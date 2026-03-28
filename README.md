# Creem CLI Developer Toolkit

A minimal integration showing how to use the Creem CLI as a developer power tool with an AI coding assistant.

`CLI command → checkout URL → local app webhook/state → AI explanation over --json`

📖 **[Written guide](GUIDE.md)** · 🎥 **[Video walkthrough](#)** _(link TBD)_

## What is included

- `examples/minimal-integration/` — Bun + TypeScript + Hono app with checkout, webhook, and state tracking
- `skills/creem-cli/` — Claude Code skill for operating the Creem CLI safely

## Stack

- Runtime: **Bun**
- Server: **Hono**
- SDK: **creem**
- Package manager: **pnpm**
- Local persistence: JSON files in `examples/minimal-integration/data/`

## Quick start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
cp examples/minimal-integration/.env.example examples/minimal-integration/.env
```

Fill in your Creem test credentials in `examples/minimal-integration/.env`:

```env
CREEM_API_KEY=***
CREEM_WEBHOOK_SECRET=***
CREEM_PRODUCT_ID=prod_xxx
```

### 3. Start the app

```bash
pnpm dev
```

Open `http://localhost:3000/` — you should see the status page with a "No Activity" badge.

### 4. Set up the webhook tunnel

Create a public HTTPS tunnel pointing to port `3000` (e.g. with ngrok or Cloudflare Tunnel).

Register the webhook URL in your Creem dashboard:

```
https://your-public-url/api/webhooks/creem
```

### 5. Install the Claude Code skill

```bash
npx skills add santigamo/creem-cli-developer-toolkit
```

Done. Claude Code now knows how to operate the Creem CLI.

## Workflows

### Verify a purchase

Create a checkout from the CLI, complete the sandbox purchase, then verify the transaction, subscription, and local app state — all from the terminal.

### Debug state propagation

Compare what Creem knows with what your app knows. If a webhook didn't land, the CLI helps you find the mismatch and understand why.

### Manage your store

Create products, pause and resume subscriptions, get a plain-English overview of your store. No dashboard needed.

See the **[full guide](GUIDE.md)** for detailed walkthroughs of each workflow.

## Local routes

| Route | Description |
|---|---|
| `GET /` | Status page with color-coded access badge |
| `POST /api/checkout` | Creates a checkout session via the Creem SDK |
| `GET /success` | Captures redirect params after a purchase |
| `POST /api/webhooks/creem` | Receives and verifies Creem webhooks (HMAC SHA-256) |
| `GET /api/debug/state` | Returns local app state and recent webhook events as JSON |

## How it works

The app and the Creem CLI are two independent views of the same data. The CLI talks directly to the Creem API. The app only learns about changes through webhooks.

When they agree, everything is working. When they don't, something broke — and the CLI helps you find out what.

The Claude Code skill teaches the AI the right commands, flags, safety rules, and conventions (like minor unit conversion) so you can work in natural language instead of memorizing CLI syntax.

## Quality checks

```bash
pnpm typecheck
```

## License

[MIT](LICENSE)
