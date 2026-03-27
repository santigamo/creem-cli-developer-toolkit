import type { Hono } from "hono";
import type { CheckoutCompletedEvent, GrantAccessContext, RevokeAccessContext } from "creem_io";

import { createCreemClient, getRuntimeConfig, getWebhookReadiness } from "../creem";
import { logError, logInfo } from "../lib/logger";
import { recordWebhook } from "../lib/state-store";
import type { LocalAccessStatus, WebhookEventRecord } from "../types";

function createWebhookRecord(
  eventName: string,
  payload: {
    webhookId?: string;
    customer?: { email?: string };
    product?: { id?: string };
    subscription?: { id?: string; lastTransactionId?: string };
    status?: string;
    id?: string;
    lastTransactionId?: string;
  },
  rawPayload: unknown,
): WebhookEventRecord {
  return {
    webhookId: payload.webhookId ?? crypto.randomUUID(),
    eventName,
    seenAt: new Date().toISOString(),
    customerEmail: payload.customer?.email ?? null,
    productId: payload.product?.id ?? null,
    subscriptionId: payload.subscription?.id ?? payload.id ?? null,
    transactionId: payload.subscription?.lastTransactionId ?? payload.lastTransactionId ?? null,
    status: payload.status ?? null,
    payload: rawPayload,
  };
}

async function persistWebhook(
  eventName: string,
  payload: CheckoutCompletedEvent | GrantAccessContext | RevokeAccessContext,
  nextStatus: LocalAccessStatus,
): Promise<void> {
  await recordWebhook(createWebhookRecord(eventName, payload, payload), nextStatus);
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
      const creem = createCreemClient(readiness.value);

      await creem.webhooks.handleEvents(body, signature, {
        onCheckoutCompleted: async (payload) => {
          await persistWebhook("checkout.completed", payload, "checkout-completed");
          logInfo("Processed checkout.completed webhook.", {
            webhookId: payload.webhookId,
            checkoutId: payload.id,
          });
        },
        onGrantAccess: async (payload) => {
          await persistWebhook(`grant:${payload.reason}`, payload, "granted");
          logInfo("Processed grant-access webhook.", {
            subscriptionId: payload.id,
            reason: payload.reason,
          });
        },
        onRevokeAccess: async (payload) => {
          await persistWebhook(`revoke:${payload.reason}`, payload, "revoked");
          logInfo("Processed revoke-access webhook.", {
            subscriptionId: payload.id,
            reason: payload.reason,
          });
        },
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
