import { createCreem } from "creem_io";

import type { Result, RuntimeConfig } from "./types";

export type CreemClient = ReturnType<typeof createCreem>;

function readBoolean(rawValue: string | undefined, defaultValue: boolean): boolean {
  if (rawValue === undefined) {
    return defaultValue;
  }

  return rawValue === "true";
}

function readPort(rawValue: string | undefined): number {
  const parsed = Number(rawValue ?? "3000");

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 3000;
  }

  return parsed;
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    apiKey: process.env.CREEM_API_KEY ?? null,
    webhookSecret: process.env.CREEM_WEBHOOK_SECRET ?? null,
    productId: process.env.CREEM_PRODUCT_ID ?? null,
    testCustomerEmail: process.env.CREEM_TEST_CUSTOMER_EMAIL ?? null,
    appUrl: process.env.APP_URL ?? "http://localhost:3000",
    demoUserId: process.env.DEMO_USER_ID ?? "demo-user-1",
    port: readPort(process.env.PORT),
    testMode: readBoolean(process.env.CREEM_TEST_MODE, true),
  };
}

export function getCheckoutReadiness(
  config: RuntimeConfig,
): Result<RuntimeConfig, { message: string; missing: string[] }> {
  const missing = [];

  if (!config.apiKey) {
    missing.push("CREEM_API_KEY");
  }

  if (!config.productId) {
    missing.push("CREEM_PRODUCT_ID");
  }

  if (missing.length > 0) {
    return {
      ok: false,
      error: {
        message: "Checkout route is missing required Creem configuration.",
        missing,
      },
    };
  }

  return { ok: true, value: config };
}

export function getWebhookReadiness(
  config: RuntimeConfig,
): Result<RuntimeConfig, { message: string; missing: string[] }> {
  const missing = [];

  if (!config.apiKey) {
    missing.push("CREEM_API_KEY");
  }

  if (!config.webhookSecret) {
    missing.push("CREEM_WEBHOOK_SECRET");
  }

  if (missing.length > 0) {
    return {
      ok: false,
      error: {
        message: "Webhook route is missing required Creem configuration.",
        missing,
      },
    };
  }

  return { ok: true, value: config };
}

export function createCreemClient(config: RuntimeConfig): CreemClient {
  if (!config.apiKey) {
    throw new Error("CREEM_API_KEY is required to create the Creem client.");
  }

  return createCreem({
    apiKey: config.apiKey,
    webhookSecret: config.webhookSecret ?? undefined,
    testMode: config.testMode,
  });
}

export function summarizeConfig(config: RuntimeConfig): Record<string, unknown> {
  return {
    appUrl: config.appUrl,
    port: config.port,
    demoUserId: config.demoUserId,
    testMode: config.testMode,
    hasApiKey: Boolean(config.apiKey),
    hasWebhookSecret: Boolean(config.webhookSecret),
    hasProductId: Boolean(config.productId),
    testCustomerEmail: config.testCustomerEmail,
  };
}
