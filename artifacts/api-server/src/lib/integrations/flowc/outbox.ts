import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import { integrationOutboxTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "../../logger";
import { getCallbackConfig, attemptCallback } from "./callback";
import type { CallbackPayload } from "./callback";

const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 10;

type DeadLetterRow = {
  id: number;
  receiptId: number;
  targetKind: string;
  targetUrl: string | null;
  eventName: string | null;
  payload: unknown;
  attemptCount: number;
};

async function notifyDeadLetter(row: DeadLetterRow): Promise<void> {
  logger.error(
    { outboxId: row.id, receiptId: row.receiptId, targetKind: row.targetKind },
    "flowc.outbox.dead_letter",
  );

  const slackUrl = process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    fetch(slackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `⚠️ FlowC dead-letter: outbox row ${row.id} for receipt ${row.receiptId} failed after 5 attempts. targetKind: ${row.targetKind}`,
      }),
      signal: ac.signal,
    })
      .catch(() => {})
      .finally(() => clearTimeout(timer));
  }

  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? "" }
          : undefined,
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: process.env.SMTP_FROM,
        subject: `DueRadar: FlowC outbox dead-letter — row ${row.id}`,
        text: JSON.stringify(row, null, 2),
      });
    } catch {
      // swallow
    }
  }
}

function backoffSeconds(attemptCount: number): number {
  // Exponential backoff: 30, 60, 120, 240, capped at 300 seconds
  return Math.min(30 * Math.pow(2, attemptCount), 300);
}

export async function processOutbox(): Promise<void> {
  const config = getCallbackConfig();
  if (!config) return;

  try {
    await db.transaction(async (tx) => {
      const claimed = await tx.execute<{
        id: number;
        receipt_id: number;
        target_kind: string;
        target_url: string | null;
        event_name: string | null;
        payload: unknown;
        attempt_count: number;
      }>(sql`
        SELECT id, receipt_id, target_kind, target_url, event_name, payload, attempt_count
        FROM integration_outbox
        WHERE status = 'pending' AND next_attempt_at <= NOW()
        ORDER BY next_attempt_at ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      `);

      for (const row of claimed.rows) {
        const payload =
          typeof row.payload === "string"
            ? JSON.parse(row.payload)
            : (row.payload as CallbackPayload);

        let ok = false;
        let error: string | undefined;

        if (row.target_kind === "callback" && row.target_url) {
          const result = await attemptCallback(
            { url: row.target_url, secret: config.secret },
            payload as CallbackPayload,
          );
          ok = result.ok;
          error = result.error;
        }

        const newAttemptCount = row.attempt_count + 1;

        if (ok) {
          await tx.execute(sql`
            UPDATE integration_outbox
            SET status = 'sent', sent_at = NOW(),
                attempt_count = ${newAttemptCount}, updated_at = NOW()
            WHERE id = ${row.id}
          `);
        } else if (newAttemptCount >= MAX_ATTEMPTS) {
          await tx.execute(sql`
            UPDATE integration_outbox
            SET status = 'dead_letter', attempt_count = ${newAttemptCount},
                last_error = ${error ?? "unknown"}, updated_at = NOW()
            WHERE id = ${row.id}
          `);
          void notifyDeadLetter({
            id: row.id,
            receiptId: row.receipt_id,
            targetKind: row.target_kind,
            targetUrl: row.target_url,
            eventName: row.event_name,
            payload: row.payload,
            attemptCount: newAttemptCount,
          });
        } else {
          const nextSecs = backoffSeconds(newAttemptCount);
          await tx.execute(sql`
            UPDATE integration_outbox
            SET status = 'pending', attempt_count = ${newAttemptCount},
                last_error = ${error ?? "unknown"},
                next_attempt_at = NOW() + (${nextSecs} * INTERVAL '1 second'),
                updated_at = NOW()
            WHERE id = ${row.id}
          `);
        }
      }
    });
  } catch (err) {
    logger.error({ err }, "flowc.outbox.process_error");
  }
}

export async function enqueueOutboxRow(params: {
  receiptId: number;
  targetKind: "callback" | "event";
  targetUrl?: string;
  eventName?: string;
  payload: Record<string, unknown>;
  payloadHash: string;
}): Promise<void> {
  await db
    .insert(integrationOutboxTable)
    .values({
      receiptId: params.receiptId,
      targetKind: params.targetKind,
      targetUrl: params.targetUrl ?? null,
      eventName: params.eventName ?? null,
      payload: params.payload,
      payloadHash: params.payloadHash,
      status: "pending",
      attemptCount: 0,
    })
    .onConflictDoNothing();
}

export function startOutboxScheduler(): () => void {
  const config = getCallbackConfig();
  if (!config) {
    logger.info("FlowC outbox scheduler disabled — FLOWC_CALLBACK_URL not set");
    return () => {};
  }

  logger.info("Starting FlowC outbox retry scheduler (5-minute interval)");
  const interval = setInterval(() => {
    processOutbox().catch((err) =>
      logger.error({ err }, "flowc.outbox.scheduler_error"),
    );
  }, 5 * 60 * 1000);

  return () => {
    clearInterval(interval);
    logger.info("FlowC outbox scheduler stopped");
  };
}
