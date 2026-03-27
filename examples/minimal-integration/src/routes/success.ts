import type { Hono } from "hono";

import { recordSuccess } from "../lib/state-store";

function formatEntries(params: Record<string, string>): string {
  const entries = Object.entries(params);

  if (entries.length === 0) {
    return "<li>No query parameters were present on the success URL.</li>";
  }

  return entries
    .map(
      ([key, value]) =>
        `<li><strong>${key}</strong>: <code>${value.replaceAll("<", "&lt;")}</code></li>`,
    )
    .join("");
}

export function registerSuccessRoute(app: Hono): void {
  app.get("/success", async (c) => {
    const params = c.req.query();
    await recordSuccess(params);

    return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Creem Success</title>
    <style>
      body {
        font-family: "SF Mono", "JetBrains Mono", monospace;
        background: #111111;
        color: #f4efe8;
        margin: 0;
        padding: 32px 20px;
      }
      main {
        max-width: 760px;
        margin: 0 auto;
      }
      .panel {
        background: #1a1a1a;
        border: 1px solid #2e2e2e;
        border-radius: 16px;
        padding: 20px;
      }
      a {
        color: #f8a062;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Checkout success page</h1>
      <p>The query parameters below were stored in the local app state for later CLI comparison.</p>
      <div class="panel">
        <ul>${formatEntries(params)}</ul>
      </div>
      <p><a href="/api/debug/state">Open /api/debug/state</a></p>
    </main>
  </body>
</html>`);
  });
}

