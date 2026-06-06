import { type Request, type Response, type NextFunction } from "express";

// In-memory store for simplicity and stateless Cloudflare edge compatibility if moved there.
// (In a multi-instance API deployment, use Redis. For this test pass, memory is fine).
const idempotencyStore = new Map<string, { status: number; body: unknown; timestamp: number }>();
// Cleanup old keys periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.timestamp > 24 * 60 * 60 * 1000) idempotencyStore.delete(key);
  }
}, 60 * 60 * 1000);

export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return next();
  }

  const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

  if (!idempotencyKey) {
    res.status(400).json({ error: "Idempotency-Key header is required" });
    return;
  }

  if (idempotencyStore.has(idempotencyKey)) {
    const cached = idempotencyStore.get(idempotencyKey)!;
    if (cached.status) {
      res.status(cached.status).json(cached.body);
      return;
    } else {
      res.status(409).json({ error: "Request is currently processing" });
      return;
    }
  }

  idempotencyStore.set(idempotencyKey, { status: 0, body: null, timestamp: Date.now() });

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = (body: unknown): Response => {
    idempotencyStore.set(idempotencyKey, { status: res.statusCode, body, timestamp: Date.now() });
    return originalJson(body);
  };

  res.send = (body: unknown): Response => {
    if (typeof body === "string" || body instanceof Buffer || body === undefined) {
      let parsedBody = body;
      if (typeof body === 'string') {
        try {
           parsedBody = JSON.parse(body);
        } catch {
           parsedBody = body;
        }
      } else if (body === undefined) {
         parsedBody = undefined;
      }
      idempotencyStore.set(idempotencyKey, { status: res.statusCode, body: parsedBody, timestamp: Date.now() });
    }
    return originalSend(body);
  };

  next();
};
