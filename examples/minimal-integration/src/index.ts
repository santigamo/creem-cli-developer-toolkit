import { Hono } from "hono";

import { getRuntimeConfig } from "./creem";
import { logInfo } from "./lib/logger";
import { registerCheckoutRoute } from "./routes/checkout";
import { registerDebugRoute } from "./routes/debug";
import { registerHomeRoute } from "./routes/home";
import { registerSuccessRoute } from "./routes/success";
import { registerWebhookRoute } from "./routes/webhooks";

const app = new Hono();

registerHomeRoute(app);
registerCheckoutRoute(app);
registerSuccessRoute(app);
registerWebhookRoute(app);
registerDebugRoute(app);

app.notFound((c) => c.json({ ok: false, error: "Not found" }, 404));

const config = getRuntimeConfig();

Bun.serve({
  port: config.port,
  fetch: app.fetch,
});

logInfo(`Minimal integration listening on ${config.appUrl} (port ${config.port}).`);

