# Creem CLI Developer Toolkit

A minimal integration project showing how to use the Creem CLI as a developer power tool alongside an AI coding assistant.

It gives you a small, reproducible loop:

`CLI command → checkout URL → local app webhook/state → AI explanation over --json`

## What is included

- `examples/minimal-integration`: Bun + TypeScript + Hono app
- `skills/creem-cli/`: a Claude Code skill for operating the Creem CLI safely

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
CREEM_API_KEY=***
CREEM_WEBHOOK_SECRET=***
CREEM_PRODUCT_ID=prod_xxx
CREEM_TEST_CUSTOMER_EMAIL=demo+sandbox@example.com
APP_URL=http://localhost:3000
DEMO_USER_ID=demo-user-1
PORT=3000
CREEM_TEST_MODE=true
```

## Run the app

```bash
pnpm dev
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

Make sure you have validated one real webhook delivery end to end before relying on it.

## Local routes

- `GET /`: minimal status page
- `POST /api/checkout`: optional fallback route for creating a checkout session
- `GET /success`: stores the success URL query params in local state
- `POST /api/webhooks/creem`: receives and validates Creem webhooks
- `GET /api/debug/state`: returns local app state plus recent webhook events

## Workflows

### Checkout and verify

- Create a checkout: `creem checkouts create --product <id> --success-url http://localhost:3000/success --json`
- Open the returned checkout URL and complete the purchase
- Verify: `creem transactions list --json` and `creem subscriptions list --json`

### Debug state propagation

- Compare local app state (`curl http://localhost:3000/api/debug/state`) with Creem state (`creem transactions list --json`, `creem subscriptions list --json`)
- Identify whether the app and Creem agree

### Manage products and subscriptions

- Create a recurring product from the CLI
- List products
- Pause and resume a test subscription

## What has been validated locally

- the Bun server starts
- `GET /` renders
- `GET /api/debug/state` returns JSON
- `GET /success` stores query params in local state
- `POST /api/checkout` creates a real test checkout with the official `creem` SDK
- `POST /api/webhooks/creem` accepts a correctly signed local test payload and updates local state
- TypeScript typecheck passes

## What still requires your real Creem credentials

- real checkout creation and completion
- webhook signature verification against a real secret
- CLI verification against live test transactions/subscriptions

## Skill installation

Validate that the repo exposes a discoverable skill:

```bash
npx skills add . --list
```

Install locally from this checkout:

```bash
npx skills add .
```

Install from GitHub after publishing:

```bash
npx skills add <owner>/<repo>
```

The canonical skill lives at `skills/creem-cli/SKILL.md`.

## Quality checks

```bash
pnpm typecheck
```
