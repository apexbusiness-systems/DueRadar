import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { idempotencyKeysTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import crypto from "crypto";

// Routes that manage their own idempotency or are externally-called webhooks.
// Paths are relative to the /api mount point (i.e. req.path inside the middleware).
const EXEMPT_PREFIXES = [
  "/webhooks/",  // Clerk and other external webhooks (verified by Svix signature)
  "/internal/flowc/", // FlowC signals route has DB-backed idempotency of its own
];

function isExempt(path: string): boolean {
  return EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  if (isExempt(req.path)) {
    return next();
  }

  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
  if (!idempotencyKey) {
    res.status(400).json({ error: "Idempotency-Key header is required" });
    return;
  }

  // Scope the key by the authenticated user when available.  Fall back to a
  // combination of the raw key and the client IP for unauthenticated routes.
  let userId: string | null;
  try {
    userId = getAuth(req)?.userId || null;
  } catch {
    // In tests or if clerk middleware is not applied, fallback to req.auth
    userId = (req as unknown as { auth?: { userId?: string } }).auth?.userId || null;
  }
  const effectiveUserId =
    userId ??
    `anon:${(req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "unknown"}`;

  const fingerprint = crypto
    .createHash("sha256")
    .update(JSON.stringify({ method, path: req.path, body: req.body }))
    .digest("hex");

  try {
    // Look up any existing record for this key.
    const [existing] = await db
      .select()
      .from(idempotencyKeysTable)
      .where(
        and(
          eq(idempotencyKeysTable.key, idempotencyKey),
          eq(idempotencyKeysTable.userId, effectiveUserId)
        )
      )
      .limit(1);

    if (existing) {
      if (existing.requestFingerprint !== fingerprint) {
        res.status(409).json({ error: "Idempotency-Key collision: payload mismatch" });
        return;
      }

      if (existing.responseStatus !== null) {
        // Completed — replay the cached response.
        if (existing.responseStatus === 204) {
          res.status(204).end();
          return;
        }
        res.status(existing.responseStatus).json(existing.responseBody);
        return;
      } else {
        // Still processing (status is NULL = in-flight sentinel).
        res.status(409).json({ error: "Request is currently processing" });
        return;
      }
    }

    // Mark the key as in-flight by inserting a row with no response yet.
    await db.insert(idempotencyKeysTable).values({
      key: idempotencyKey,
      userId: effectiveUserId,
      requestMethod: method,
      requestPath: req.path,
      requestFingerprint: fingerprint,
      responseStatus: null,
      responseBody: null,
    });
  } catch (err: unknown) {
    console.error("IDEMPOTENCY DB ERROR:", err);
    logger.error({ err }, "idempotency.db_check_failed");
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    return;
  }

  // Intercept res.json() to persist the response before it is sent.
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  const originalEnd = res.end.bind(res);

  const saveResponse = (status: number, body: unknown) => {
    db.update(idempotencyKeysTable)
      .set({
        responseStatus: status,
        responseBody: body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(idempotencyKeysTable.key, idempotencyKey),
          eq(idempotencyKeysTable.userId, effectiveUserId)
        )
      )
      .catch((err) =>
        logger.error({ err }, "idempotency.cache_update_failed"),
      );
  };

  let saved = false;

  res.json = (body: unknown): Response => {
    if (!saved) {
      saveResponse(res.statusCode, body);
      saved = true;
    }
    return originalJson(body);
  };

  res.send = (body?: unknown): Response => {
    if (!saved) {
      saveResponse(res.statusCode, body === undefined ? null : body);
      saved = true;
    }
    return originalSend(body);
  };

  res.end = (chunk?: unknown, encoding?: unknown, cb?: unknown): Response => {
    if (!saved) {
      saveResponse(res.statusCode, null);
      saved = true;
    }
    return originalEnd(chunk, encoding as BufferEncoding, cb as () => void);
  };

  next();
};
