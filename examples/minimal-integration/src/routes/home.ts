import type { Hono } from "hono";

import { getRuntimeConfig, summarizeConfig } from "../creem";
import { getDebugSnapshot } from "../lib/state-store";

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function registerHomeRoute(app: Hono): void {
  app.get("/", async (c) => {
    const config = getRuntimeConfig();
    const snapshot = await getDebugSnapshot();
    const configJson = escapeHtml(JSON.stringify(summarizeConfig(config), null, 2));
    const stateJson = escapeHtml(JSON.stringify(snapshot.state, null, 2));

    return c.html(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Creem Minimal Integration</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f8f5ef;
        --panel: #fffdf8;
        --ink: #1f1b16;
        --muted: #6b6258;
        --accent: #d55c2b;
        --border: #e7ddcf;
      }
      body {
        margin: 0;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        color: var(--ink);
        background:
          radial-gradient(circle at top left, rgba(213, 92, 43, 0.12), transparent 28%),
          linear-gradient(180deg, #fff7ea 0%, var(--bg) 100%);
      }
      main {
        max-width: 920px;
        margin: 0 auto;
        padding: 48px 20px 72px;
      }
      h1, h2 {
        margin: 0 0 12px;
        font-weight: 700;
      }
      p {
        color: var(--muted);
        line-height: 1.6;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 16px;
        margin: 24px 0 32px;
      }
      .panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 18px 48px rgba(31, 27, 22, 0.06);
      }
      .cta-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin: 18px 0 8px;
      }
      a, button {
        border-radius: 999px;
        padding: 10px 16px;
        border: 0;
        background: var(--accent);
        color: white;
        font: inherit;
        cursor: pointer;
        text-decoration: none;
      }
      a.secondary {
        background: transparent;
        color: var(--ink);
        border: 1px solid var(--border);
      }
      pre {
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
      }
      code {
        font-family: "SF Mono", "JetBrains Mono", monospace;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Creem Minimal Integration</h1>
      <p>
        A tiny Bun + Hono app for the Creem CLI bounty. It creates checkout sessions,
        records webhook deliveries, and exposes local state so the CLI can act as source of truth.
      </p>
      <div class="cta-row">
        <a href="/api/debug/state">Open debug JSON</a>
        <a class="secondary" href="/success">Open success page</a>
      </div>
      <div class="grid">
        <section class="panel">
          <h2>Local Actions</h2>
          <p>Use the terminal or a simple curl request to create a checkout:</p>
          <pre><code>curl -X POST ${escapeHtml(
            `${config.appUrl}/api/checkout`,
          )} -H 'content-type: application/json' -d '{}'</code></pre>
        </section>
        <section class="panel">
          <h2>Runtime Config</h2>
          <pre><code>${configJson}</code></pre>
        </section>
      </div>
      <section class="panel">
        <h2>Current Local State</h2>
        <pre><code>${stateJson}</code></pre>
      </section>
    </main>
  </body>
</html>`);
  });
}

