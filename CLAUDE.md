# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A developer toolkit for integrating with Creem, a payment platform. The repo contains a minimal Bun+Hono web app that handles Creem checkouts, webhooks, and subscription state, plus a Claude Code skill for operating the Creem CLI.

## Commands

```bash
pnpm dev                 # Start Bun server with hot reload (port 3000)
pnpm start               # Start Bun server without hot reload
pnpm typecheck           # TypeScript type check (no emit)
```

There are no tests or linter configured. `pnpm typecheck` is the only quality gate.

## Architecture

**Monorepo** with pnpm workspaces. Runtime is **Bun** (not Node), framework is **Hono**.

### Key Directories

- `examples/minimal-integration/` — The main Bun+Hono application
- `skills/creem-cli/` — Claude Code skill for safe Creem CLI operation

### Application (`examples/minimal-integration/src/`)

- `index.ts` — Entry point, Hono app setup
- `creem.ts` — SDK client creation, env config, readiness checks. Test mode uses `serverIdx: 1`
- `types.ts` — TypeScript types
- `routes/` — HTTP handlers: `checkout.ts`, `webhooks.ts`, `success.ts`, `home.ts`, `debug.ts`
- `lib/state-store.ts` — JSON file persistence in `data/`
- `lib/logger.ts`, `lib/request-id.ts` — Utilities

### How Data Flows

1. **Checkouts** are created via the Creem CLI or SDK. The CLI returns a checkout URL that the customer opens to pay.
2. **After payment**, Creem sends webhook events to the app at `POST /api/webhooks/creem`. This is the only way the app learns about payment completions and subscription changes.
3. **The app verifies** each webhook with HMAC SHA-256 against the `creem-signature` header, then updates local state.
4. **Local state** tracks an access state machine: `unknown → checkout-created → checkout-completed → granted/revoked`. Transitions are driven by webhook events.
5. **`GET /api/debug/state`** returns the app's current local state plus recent webhook events. This is the primary way to inspect what the app knows.

The Creem CLI talks directly to the Creem API. The app talks to Creem only through webhooks. These are two independent views of the same data.

### Environment

Two `.env` files: root and `examples/minimal-integration/.env` (for the app). Key vars: `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`, `CREEM_PRODUCT_ID`, `APP_URL`, `PORT`.

## Important Patterns

- Creem CLI money fields are **minor units** (500 = 5.00 EUR, not 500.00). Always convert before displaying to users.
- Always use `--json` flag when operating the Creem CLI programmatically.
- The skill at `skills/creem-cli/SKILL.md` must have valid frontmatter; validate with `npx skills add . --list`.
- When creating checkouts, use `http://localhost:3000/success` as the success URL (local dev, no TLS).
