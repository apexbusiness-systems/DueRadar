import { type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { idempotencyKeysTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

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
  const { userId } = getAuth(req);
  const effectiveUserId =
    userId ??
    `anon:${(req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ?? req.ip ?? "unknown"}`;

  try {
    // Look up any existing record for this key.
    const [existing] = await db
      .select()
      .from(idempotencyKeysTable)
      .where(eq(idempotencyKeysTable.key, idempotencyKey))
      .limit(1);

    if (existing) {
      if (existing.responseStatus !== null) {
        // Completed — replay the cached response.
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
      responseStatus: null,
      responseBody: null,
    });
  } catch (err) {
    logger.error({ err }, "idempotency.db_check_failed");
    res.status(500).json({ error: "Internal server error (idempotency check failed)" });
    return;
  }

  // Intercept res.json() to persist the response before it is sent.
  const originalJson = res.json.bind(res);
  res.json = (body: unknown): Response => {
    db.update(idempotencyKeysTable)
      .set({
        responseStatus: res.statusCode,
        responseBody: body,
        updatedAt: new Date(),
      })
      .where(eq(idempotencyKeysTable.key, idempotencyKey))
      .catch((err) =>
        logger.error({ err }, "idempotency.cache_update_failed"),
      );
    return originalJson(body);
  };

  next();
};
