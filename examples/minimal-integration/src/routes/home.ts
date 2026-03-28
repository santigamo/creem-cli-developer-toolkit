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

interface StatusStyle {
  color: string;
  bg: string;
  label: string;
}

function statusStyle(status: string): StatusStyle {
  switch (status) {
    case "granted":
      return { color: "#1a7f37", bg: "#dafbe1", label: "Access Granted" };
    case "revoked":
      return { color: "#cf222e", bg: "#ffebe9", label: "Access Revoked" };
    case "checkout-completed":
      return { color: "#9a6700", bg: "#fff8c5", label: "Checkout Completed" };
    case "checkout-created":
      return { color: "#9a6700", bg: "#fff8c5", label: "Checkout Created" };
    default:
      return { color: "#656d76", bg: "#f6f8fa", label: "No Activity" };
  }
}

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function registerHomeRoute(app: Hono): void {
  app.get("/", async (c) => {
    const config = getRuntimeConfig();
    const snapshot = await getDebugSnapshot();
    const { state, recentWebhookEvents } = snapshot;
    const style = statusStyle(state.localAccessStatus);
    const configJson = escapeHtml(JSON.stringify(summarizeConfig(config), null, 2));

    const subscriptionId =
      state.lastWebhook?.subscriptionId ?? state.lastSuccess?.params?.subscription_id ?? null;

    const lastEventRows = recentWebhookEvents
      .slice(0, 5)
      .map(
        (e) =>
          `<tr>
            <td><code>${escapeHtml(e.eventName)}</code></td>
            <td>${e.subscriptionId ? `<code>${escapeHtml(e.subscriptionId)}</code>` : "—"}</td>
            <td>${e.status ? escapeHtml(e.status) : "—"}</td>
            <td>${timeAgo(e.seenAt)}</td>
          </tr>`,
      )
      .join("");

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

      /* Status badge */
      .status-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px 24px;
        border-radius: 18px;
        margin: 24px 0;
        border: 1px solid var(--border);
        background: var(--panel);
        box-shadow: 0 18px 48px rgba(31, 27, 22, 0.06);
      }
      .status-dot {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .status-label {
        font-size: 22px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .status-meta {
        margin-left: auto;
        text-align: right;
        font-size: 13px;
        color: var(--muted);
        font-family: "SF Mono", "JetBrains Mono", monospace;
      }
      .status-meta code {
        display: block;
        margin-bottom: 2px;
      }

      /* Grid and panels */
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

      /* Event table */
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
        font-family: "SF Mono", "JetBrains Mono", monospace;
      }
      th {
        text-align: left;
        padding: 6px 8px;
        border-bottom: 2px solid var(--border);
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
        font-size: 14px;
        color: var(--muted);
      }
      td {
        padding: 6px 8px;
        border-bottom: 1px solid var(--border);
      }
      .empty-row td {
        color: var(--muted);
        font-style: italic;
        font-family: "Iowan Old Style", "Palatino Linotype", serif;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Creem Minimal Integration</h1>
      <p>
        A tiny Bun + Hono app that creates checkout sessions,
        records webhook deliveries, and exposes local state for CLI comparison.
      </p>

      <div class="status-card">
        <div class="status-dot" style="background: ${style.color}"></div>
        <span class="status-label" style="color: ${style.color}">${style.label}</span>
        <div class="status-meta">
          ${subscriptionId ? `<code>${escapeHtml(subscriptionId)}</code>` : ""}
          <span>Updated ${timeAgo(state.lastUpdatedAt)}</span>
        </div>
      </div>

      <div class="cta-row">
        <a href="/api/debug/state">Debug JSON</a>
        <a class="secondary" href="/success">Success page</a>
      </div>

      <div class="grid">
        <section class="panel">
          <h2>Recent Webhook Events</h2>
          <table>
            <thead>
              <tr><th>Event</th><th>Subscription</th><th>Status</th><th>When</th></tr>
            </thead>
            <tbody>
              ${lastEventRows || '<tr class="empty-row"><td colspan="4">No webhook events received yet.</td></tr>'}
            </tbody>
          </table>
        </section>
        <section class="panel">
          <h2>Runtime Config</h2>
          <pre><code>${configJson}</code></pre>
        </section>
      </div>
    </main>
  </body>
</html>`);
  });
}
