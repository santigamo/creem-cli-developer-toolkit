import { createHmac, timingSafeEqual } from "node:crypto";

import type { Hono } from "hono";

import { getRuntimeConfig, getWebhookReadiness } from "../creem";
import { logError, logInfo } from "../lib/logger";
import { recordWebhook } from "../lib/state-store";
import type { LocalAccessStatus, WebhookEventRecord } from "../types";

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getString(record: JsonRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function getNestedString(record: JsonRecord, path: string[]): string | null {
  let current: unknown = record;

  for (const segment of path) {
    if (!isJsonRecord(current)) {
      return null;
    }

    current = current[segment];
  }

  return typeof current === "string" ? current : null;
}

function extractEventName(payload: JsonRecord): string | null {
  const eventType = getString(payload, "eventType");
  if (eventType) {
    return eventType;
  }

  return getString(payload, "type");
}

function extractEventData(payload: JsonRecord): JsonRecord | null {
  const object = payload.object;
  if (isJsonRecord(object)) {
    return object;
  }

  const data = payload.data;
  if (isJsonRecord(data)) {
    return data;
  }

  return null;
}

function nextStatusForEvent(eventName: string): LocalAccessStatus {
  switch (eventName) {
    case "checkout.completed":
      return "checkout-completed";
    case "subscription.active":
    case "subscription.trialing":
    case "subscription.paid":
      return "granted";
    case "subscription.paused":
    case "subscription.expired":
      return "revoked";
    default:
      return "unknown";
  }
}

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const computed = createHmac("sha256", secret).update(rawBody).digest("hex");

  if (computed.length !== signature.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(signature, "hex"));
}

function createWebhookRecord(
  eventName: string,
  envelope: JsonRecord,
  payload: JsonRecord,
  rawPayload: unknown,
): WebhookEventRecord {
  return {
    webhookId: getString(envelope, "id") ?? crypto.randomUUID(),
    eventName,
    seenAt: new Date().toISOString(),
    customerEmail:
      getNestedString(payload, ["customer", "email"]) ??
      getString(payload, "customer_email") ??
      null,
    productId:
      getNestedString(payload, ["product", "id"]) ??
      getString(payload, "product_id") ??
      getNestedString(payload, ["order", "product"]) ??
      null,
    subscriptionId:
      getNestedString(payload, ["subscription", "id"]) ??
      getString(payload, "subscription_id") ??
      null,
    transactionId:
      getNestedString(payload, ["subscription", "lastTransactionId"]) ??
      getString(payload, "last_transaction_id") ??
      getNestedString(payload, ["order", "transaction"]) ??
      null,
    status: getString(payload, "status"),
    payload: rawPayload,
  };
}

export function registerWebhookRoute(app: Hono): void {
  app.post("/api/webhooks/creem", async (c) => {
    const config = getRuntimeConfig();
    const readiness = getWebhookReadiness(config);

    if (!readiness.ok) {
      return c.json({ ok: false, ...readiness.error }, 500);
    }

    const signature = c.req.header("creem-signature");

    if (!signature) {
      return c.json({ ok: false, error: "Missing creem-signature header." }, 400);
    }

    const body = await c.req.text();

    try {
      if (!verifySignature(body, signature, readiness.value.webhookSecret!)) {
        return c.json(
          {
            ok: false,
            error: "Invalid webhook signature.",
          },
          401,
        );
      }

      const envelope = JSON.parse(body) as unknown;
      if (!isJsonRecord(envelope)) {
        throw new Error("Webhook payload is not an object.");
      }

      const eventName = extractEventName(envelope);
      const payload = extractEventData(envelope);

      if (!eventName || !payload) {
        throw new Error("Webhook payload is missing event type or object/data payload.");
      }

      const nextStatus = nextStatusForEvent(eventName);
      const record = createWebhookRecord(eventName, envelope, payload, envelope);

      await recordWebhook(record, nextStatus);

      logInfo("Processed Creem webhook.", {
        webhookId: record.webhookId,
        eventName,
        subscriptionId: record.subscriptionId,
        transactionId: record.transactionId,
      });

      return c.json({ ok: true, receivedAt: new Date().toISOString() });
    } catch (error) {
      logError("Failed to process Creem webhook.", error);

      return c.json(
        {
          ok: false,
          error: "Invalid webhook signature or webhook handler failure.",
          details: error instanceof Error ? error.message : String(error),
        },
        400,
      );
    }
  });
}
