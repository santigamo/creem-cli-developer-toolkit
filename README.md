# Creem CLI Developer Toolkit

This repo is the minimal integration project for the `CREEM CLI as a Developer Power Tool` bounty.

It gives you a small, reproducible loop:

`Claude Code prompt -> Creem CLI -> checkout URL -> local app webhook/state -> AI explanation over --json`

## What is included

- `examples/minimal-integration`: Bun + TypeScript + Hono app
- `scripts/verify-checkout.sh`: support script for capturing checkout verification evidence
- `scripts/debug-propagation.sh`: support script for capturing local state plus Creem transactions/subscriptions
- `scripts/manage-products.sh`: support script for product creation and optional pause/resume
- `scripts/prompts/`: prompts ready to paste into Claude Code during the recording
- `skill/SKILL.md`: a small Creem operator skill for AI coding tools
- `docs/recording-validation-runbook.md`: rehearsal checklist that mirrors the recording flow

## Stack

- Runtime: `Bun`
- Server: `Hono`
- SDK: `creem`
- Package manager: `pnpm`
- Local persistence: JSON files in `examples/minimal-integration/data/`

## SDK and webhook strategy

This repo uses the official `creem` package for API calls.

The SDK currently focuses on API resources such as products, checkouts, subscriptions, and transactions. For webhooks, this repo verifies the raw request body manually with HMAC SHA-256 against the `creem-signature` header, then records the parsed event into local JSON state.

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
- `POST /api/checkout`: optional fallback route for creating a checkout session
- `GET /success`: stores the success URL query params in local state
- `POST /api/webhooks/creem`: receives and validates Creem webhooks
- `GET /api/debug/state`: returns local app state plus recent webhook events

## Primary demo approach

The intended demo is:

1. you talk to Claude Code in natural language
2. Claude Code uses the Creem CLI
3. Claude Code parses `--json`
4. the local app provides `/success`, `/api/webhooks/creem`, and `/api/debug/state`

The scripts in this repo are support material for reproducibility. They are not meant to be the stars of the video.

## Workflow 1: checkout and verify

Primary demo flow:

- ask Claude Code to create a checkout with:
  - `creem checkouts create --product <id> --success-url http://localhost:3000/success --json`
- open the returned checkout URL
- complete the purchase
- ask Claude Code to verify the purchase with:
  - `creem transactions list --json`
  - `creem subscriptions list --json`

Support path:

- `pnpm workflow:checkout`

## Workflow 2: debug state propagation

Primary demo flow:

- ask Claude Code to compare:
  - `curl http://localhost:3000/api/debug/state`
  - `creem transactions list --json`
  - `creem subscriptions list --json`
- let Claude Code explain whether app state and Creem state match

Support path:

- `pnpm workflow:debug`

## Workflow 3: manage products from terminal

Primary demo flow:

- ask Claude Code to create a recurring product
- ask Claude Code to list products
- ask Claude Code to pause a safe test subscription
- ask Claude Code to resume it

Support path:

- `pnpm workflow:manage -- sub_xxx`

## What has been validated locally

These parts have already been smoke-tested in this repo:

- the Bun server starts
- `GET /` renders
- `GET /api/debug/state` returns JSON
- `GET /success` stores query params in local state
- `POST /api/checkout` creates a real test checkout with the official `creem` SDK
- `POST /api/webhooks/creem` accepts a correctly signed local test payload and updates local state
- TypeScript typecheck passes

## What still requires your real Creem credentials

These parts are wired but cannot be fully validated without your Creem test account:

- real checkout creation
- real checkout completion
- webhook signature verification against a real secret
- CLI verification against live test transactions/subscriptions

## Recording checklist

Before recording:

1. Confirm Claude Code can use the Creem CLI via the official skill
2. Confirm the product id in `.env`
3. Start the Bun app
4. Start the tunnel
5. Confirm one real webhook hit `/api/webhooks/creem`
6. Rehearse the conversational prompts in Claude Code once
7. Pick a safe subscription id for pause/resume
8. Keep scripts and prompts as fallback/reference, not as the main act

## Quality checks

Run:

```bash
pnpm typecheck
```

## Suggested demo loop

1. Show the local app briefly
2. Show Claude Code with the official Creem skill loaded
3. Ask Claude Code to create a checkout
4. Complete the sandbox purchase
5. Ask Claude Code to verify the transaction and subscription
6. Ask Claude Code to compare app state with Creem state
7. Ask Claude Code to create a product and pause/resume a subscription
8. Show the repo support material briefly
