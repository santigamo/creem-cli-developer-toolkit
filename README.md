# Creem CLI Developer Toolkit

This repo is the minimal integration project for the `CREEM CLI as a Developer Power Tool` bounty.

It gives you a small, reproducible loop:

`local app -> checkout -> webhook -> local debug state -> Creem CLI verification -> AI reasoning over --json`

## What is included

- `examples/minimal-integration`: Bun + TypeScript + Hono app
- `scripts/verify-checkout.sh`: creates a checkout through the app and captures CLI evidence
- `scripts/debug-propagation.sh`: captures local state plus Creem transactions/subscriptions
- `scripts/manage-products.sh`: creates a product and optionally pauses/resumes a subscription
- `scripts/prompts/`: prompts ready to paste into Claude Code during the recording
- `skill/SKILL.md`: a small Creem operator skill for AI coding tools

## Stack

- Runtime: `Bun`
- Server: `Hono`
- SDK: `creem_io`
- Package manager: `pnpm`
- Local persistence: JSON files in `examples/minimal-integration/data/`

## Important note on the SDK

`creem_io@1.1.0` is currently marked as deprecated on npm in favor of the `creem` package. This repo still uses `creem_io` because the official Creem docs currently document its webhook helpers and Hono example directly, which keeps the integration smaller for the bounty.

If Creem updates the docs or examples before publication, the safest upgrade path is to move the integration to `creem` and verify webhook signatures manually.

## Prerequisites

1. `pnpm`
2. `bun`
3. `creem` CLI installed and authenticated
4. A Creem test product ID
5. A public HTTPS tunnel for local webhooks, such as ngrok or Cloudflare Tunnel

## Setup

Install dependencies:

```bash
pnpm install
```

Copy env files:

```bash
cp .env.example .env
cp examples/minimal-integration/.env.example examples/minimal-integration/.env
```

Required root env values:

```env
CREEM_PRODUCT_ID=prod_your_demo_product
CREEM_TEST_CUSTOMER_EMAIL=demo+sandbox@example.com
APP_URL=http://localhost:3000
PUBLIC_WEBHOOK_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

Required integration env values:

```env
CREEM_API_KEY=creem_test_xxx
CREEM_WEBHOOK_SECRET=whsec_xxx
CREEM_PRODUCT_ID=prod_xxx
CREEM_TEST_CUSTOMER_EMAIL=demo+sandbox@example.com
APP_URL=http://localhost:3000
DEMO_USER_ID=demo-user-1
PORT=3000
CREEM_TEST_MODE=true
```

## Run the app

```bash
pnpm dev:integration
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/api/debug/state`

## Configure the webhook

Create a public tunnel that points to the local app on port `3000`.

Your Creem webhook URL should be:

```text
https://your-public-url/api/webhooks/creem
```

Before recording, make sure you have validated one real webhook delivery end to end.

## Local routes

- `GET /`: minimal status page
- `POST /api/checkout`: creates a Creem checkout session
- `GET /success`: stores the success URL query params in local state
- `POST /api/webhooks/creem`: receives and validates Creem webhooks
- `GET /api/debug/state`: returns local app state plus recent webhook events

## Workflow 1: checkout and verify

Start the app, then run:

```bash
pnpm workflow:checkout
```

This script:

- calls `POST /api/checkout`
- stores the response under `artifacts/`
- pauses so you can complete the checkout
- captures:
  - local debug state
  - `creem products list --json`
  - `creem transactions list --json`
  - `creem subscriptions list --json`

Use `scripts/prompts/wf1-checkout-verify.txt` in Claude Code.

## Workflow 2: debug state propagation

```bash
pnpm workflow:debug
```

This captures:

- local debug state
- `creem transactions list --json`
- `creem subscriptions list --json`

Use `scripts/prompts/wf2-debug-propagation.txt` in Claude Code.

## Workflow 3: manage products from terminal

Without a subscription id:

```bash
pnpm workflow:manage
```

With a test subscription id to pause and resume:

```bash
pnpm workflow:manage -- sub_xxx
```

Use `scripts/prompts/wf3-manage-terminal.txt` in Claude Code.

## What has been validated locally

These parts have already been smoke-tested in this repo:

- the Bun server starts
- `GET /` renders
- `GET /api/debug/state` returns JSON
- `GET /success` stores query params in local state
- `POST /api/checkout` returns a clear configuration error when env vars are missing
- TypeScript typecheck passes

## What still requires your real Creem credentials

These parts are wired but cannot be fully validated without your Creem test account:

- real checkout creation
- real checkout completion
- webhook signature verification against a real secret
- CLI verification against live test transactions/subscriptions

## Recording checklist

Before recording:

1. Confirm `creem whoami --json`
2. Confirm the product id in `.env`
3. Start the Bun app
4. Start the tunnel
5. Confirm one test webhook hit `/api/webhooks/creem`
6. Pre-run each script once so you know the exact outputs
7. Keep the `artifacts/` folders from a clean run
8. Keep the prompt files open in Claude Code

## Quality checks

Run:

```bash
pnpm typecheck
```

## Suggested demo loop

1. Show `GET /api/debug/state`
2. Run `pnpm workflow:checkout`
3. Complete a sandbox purchase
4. Ask Claude Code to compare local state with `creem ... --json`
5. Run `pnpm workflow:debug`
6. Run `pnpm workflow:manage`
7. Show `skill/SKILL.md`
