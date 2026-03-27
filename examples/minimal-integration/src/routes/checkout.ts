import type { Hono } from "hono";

import { createCreemClient, getCheckoutReadiness, getRuntimeConfig } from "../creem";
import { logError, logInfo } from "../lib/logger";
import { createRequestId } from "../lib/request-id";
import { recordCheckout } from "../lib/state-store";
import type { CheckoutRequestBody } from "../types";

function isCheckoutRequestBody(value: unknown): value is CheckoutRequestBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return true;
}

export function registerCheckoutRoute(app: Hono): void {
  app.post("/api/checkout", async (c) => {
    const config = getRuntimeConfig();
    const readiness = getCheckoutReadiness(config);

    if (!readiness.ok) {
      return c.json({ ok: false, ...readiness.error }, 500);
    }

    const rawBody = await c.req.json().catch(() => ({}));
    const body = isCheckoutRequestBody(rawBody) ? rawBody : {};
    const requestId = createRequestId();
    const productId = body.productId?.trim() || readiness.value.productId!;
    const customerEmail = body.email?.trim() || readiness.value.testCustomerEmail || null;
    const units = typeof body.units === "number" && body.units > 0 ? body.units : 1;
    const successUrl = new URL("/success", readiness.value.appUrl);

    successUrl.searchParams.set("request_id", requestId);

    try {
      const creem = createCreemClient(readiness.value);
      const checkout = await creem.checkouts.create({
        requestId,
        productId,
        units,
        successUrl: successUrl.toString(),
        customer: customerEmail ? { email: customerEmail } : undefined,
        metadata: {
          userId: readiness.value.demoUserId,
          requestId,
          source: "creem-cli-bounty",
        },
      });

      if (!checkout.checkoutUrl) {
        throw new Error("Creem checkout response did not include checkoutUrl.");
      }

      await recordCheckout({
        requestId,
        checkoutId: checkout.id,
        checkoutUrl: checkout.checkoutUrl,
        productId,
        customerEmail,
        createdAt: new Date().toISOString(),
        status: checkout.status,
      });

      logInfo("Created checkout session.", {
        requestId,
        checkoutId: checkout.id,
        productId,
      });

      return c.json({
        ok: true,
        requestId,
        checkoutId: checkout.id,
        checkoutUrl: checkout.checkoutUrl,
        productId,
        customerEmail,
        mode: checkout.mode,
        status: checkout.status,
      });
    } catch (error) {
      logError("Failed to create checkout session.", error);

      return c.json(
        {
          ok: false,
          error: "Failed to create checkout session.",
          details: error instanceof Error ? error.message : String(error),
        },
        502,
      );
    }
  });
}

