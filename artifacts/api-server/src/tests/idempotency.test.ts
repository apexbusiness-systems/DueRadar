import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import { idempotencyMiddleware } from "../middlewares/idempotency";

describe("Idempotency Middleware", () => {
  const createTestApp = () => {
    const app = express();
    app.use(express.json());
    
    // Inject custom userId stub
    app.use((req, res, next) => {
      const headerUserId = req.headers["test-user-id"];
      if (headerUserId) {
        (req as unknown as { auth: { userId: string } }).auth = { userId: headerUserId as string };
      }
      next();
    });

    app.use(idempotencyMiddleware);

    // Test routes
    let counter = 0;
    app.post("/test-post", (req, res) => {
      counter++;
      res.status(201).json({ count: counter, body: req.body });
    });

    app.delete("/test-delete", (req, res) => {
      res.status(204).end();
    });

    app.get("/test-get", (req, res) => {
      res.json({ ok: true });
    });

    return app;
  };

  it("Case 1: same user + same key + same body -> returns cached response on second call", async () => {
    const app = createTestApp();
    const key = "key-case-1";
    const body = { data: "test" };

    const res1 = await request(app)
      .post("/test-post")
      .set("idempotency-key", key)
      .set("test-user-id", "user1")
      .send(body);

    if (res1.status !== 201) console.error("TEST ERROR:", res1.body);
    expect(res1.status).toBe(201);
    expect(res1.body.count).toBe(1);

    const res2 = await request(app)
      .post("/test-post")
      .set("idempotency-key", key)
      .set("test-user-id", "user1")
      .send(body);

    expect(res2.status).toBe(201);
    expect(res2.body.count).toBe(1); // Cached count remains 1
    expect(res2.body.body).toEqual(body);
  });

  it("Case 2: same user + same key + different body -> returns 409 Conflict", async () => {
    const app = createTestApp();
    const key = "key-case-2";

    const res1 = await request(app)
      .post("/test-post")
      .set("idempotency-key", key)
      .set("test-user-id", "user1")
      .send({ val: "original" });

    expect(res1.status).toBe(201);

    const res2 = await request(app)
      .post("/test-post")
      .set("idempotency-key", key)
      .set("test-user-id", "user1")
      .send({ val: "modified" });

    expect(res2.status).toBe(409);
    expect(res2.body.error).toContain("Idempotency-Key collision");
  });

  it("Case 3: different user + same key -> processes independently without conflict", async () => {
    const app = createTestApp();
    const key = "key-case-3";
    const body = { data: "shared" };

    const res1 = await request(app)
      .post("/test-post")
      .set("idempotency-key", key)
      .set("test-user-id", "user1")
      .send(body);

    expect(res1.status).toBe(201);
    expect(res1.body.count).toBe(1);

    const res2 = await request(app)
      .post("/test-post")
      .set("idempotency-key", key)
      .set("test-user-id", "user2")
      .send(body);

    expect(res2.status).toBe(201);
    expect(res2.body.count).toBe(2); // Processes independently, count is 2
  });

  it("Case 4: DELETE/PATCH returning 204 No Content -> cached correctly, not stuck processing", async () => {
    const app = createTestApp();
    const key = "key-case-4";

    const res1 = await request(app)
      .delete("/test-delete")
      .set("idempotency-key", key)
      .set("test-user-id", "user1");

    expect(res1.status).toBe(204);

    const res2 = await request(app)
      .delete("/test-delete")
      .set("idempotency-key", key)
      .set("test-user-id", "user1");

    expect(res2.status).toBe(204); // Returns 204 from cache immediately
  });

  it("Case 5: missing Idempotency-Key on mutating route -> returns 400 Bad Request", async () => {
    const app = createTestApp();

    const res = await request(app)
      .post("/test-post")
      .set("test-user-id", "user1")
      .send({ data: "no-key" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Idempotency-Key header is required");

    // Non-mutating routes (GET) should not require the key
    const resGet = await request(app)
      .get("/test-get");

    expect(resGet.status).toBe(200);
  });
});
