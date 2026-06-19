import { Router, type Request, type Response } from "express";
import { Webhook } from "svix";
import { db } from "@workspace/db";
import { workspaceMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

type RawBodyRequest = Request & { rawBody?: Buffer };

const router = Router();

router.post("/clerk", async (req: RawBodyRequest, res: Response) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const payload = req.rawBody?.toString("utf8");
  if (!payload) {
    return void res.status(400).json({ error: "Missing raw body" });
  }

  const svixHeaders = {
    "svix-id": req.headers["svix-id"] as string,
    "svix-timestamp": req.headers["svix-timestamp"] as string,
    "svix-signature": req.headers["svix-signature"] as string,
  };

  let evt: { type: string; data: Record<string, unknown> };
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(payload, svixHeaders) as typeof evt;
  } catch (err) {
    req.log.error({ err }, "Webhook signature verification failed");
    return void res.status(400).json({ error: "Invalid signature" });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = evt.data as {
      id: string;
      email_addresses?: Array<{ email_address?: string }>;
      first_name?: string;
      last_name?: string;
    };
    const primaryEmail = email_addresses?.[0]?.email_address;
    if (primaryEmail) {
      const emailLower = primaryEmail.toLowerCase().trim();
      const displayName = [first_name, last_name].filter(Boolean).join(" ");

      const pendingPrefix = `pending:${emailLower}`;

      await db
        .update(workspaceMembersTable)
        .set({
          clerkUserId: id,
          name: displayName || undefined,
        })
        .where(eq(workspaceMembersTable.clerkUserId, pendingPrefix));

      req.log.info({ clerkId: id, email: emailLower }, "auto_provision.completed");
    }
  }

  res.json({ success: true });
});

export default router;
