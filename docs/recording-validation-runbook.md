# Recording Validation Runbook

This runbook is a 1:1 rehearsal of the recording flow.

The setup is:

- Claude Code is the protagonist
- the official `creem.io/SKILL.md` is loaded in Claude Code
- you speak in natural language
- Claude Code executes the Creem CLI and explains the JSON
- the local app exists to receive the success redirect, webhooks, and expose local state

## Goal

Validate the exact flow you want to show on camera:

`Claude Code request -> Creem CLI command -> checkout URL -> local app state -> CLI verification -> Claude explanation`

## Step 0 — Confirm Claude Code + skill works

Before anything else, verify the core bet of the demo.

In Claude Code, ask:

```text
Use the Creem CLI to verify my auth and tell me what environment I am in.
```

Expected behavior:

- Claude Code runs `creem whoami --json`
- Claude Code explains that auth is working
- Claude Code tells you the environment is `test`

Then ask:

```text
List my Creem products and tell me which one I should use for a demo checkout.
```

Expected behavior:

- Claude Code runs `creem products list --json`
- Claude Code identifies the product id

If this step is weak or clumsy, stop. The new demo depends on this working cleanly.

## Preflight

### 1. Confirm environment

Run locally:

```bash
creem --version
pnpm typecheck
```

Expected:

- CLI responds
- typecheck passes

### 2. Confirm env files

Check:

- [/.env](/Users/santi/Code/creem-cli-developer-toolkit/.env)
- [examples/minimal-integration/.env](/Users/santi/Code/creem-cli-developer-toolkit/examples/minimal-integration/.env)

Must exist:

- `CREEM_PRODUCT_ID`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `APP_URL=http://localhost:3000`

### 3. Start the local app

Run:

```bash
pnpm dev:integration
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/api/debug/state`

Expected:

- page renders
- debug JSON responds

### 4. Start the tunnel

Run:

```bash
ngrok http --url=chigger-crisp-tightly.ngrok-free.app 3000
```

Important:

- the tunnel must point to port `3000`
- not port `80`

### 5. Confirm webhook registration

In Creem, confirm the webhook URL is:

```text
https://chigger-crisp-tightly.ngrok-free.app/api/webhooks/creem
```

Expected:

- correct URL
- correct secret copied into local `.env`

## Validation Pass

This is the rehearsal you run before recording.

### Phase 1 — Baseline state

Show yourself the app state first:

```bash
curl -sS http://localhost:3000/api/debug/state
```

You only care about visible signals:

- app config is present
- `lastWebhook` is null or old
- current local state is understandable

This is also how the video should start.

### Phase 2 — Workflow 1: checkout + verify

This workflow now lives primarily inside Claude Code.

#### 2.1 Ask Claude Code to create the checkout

Prompt:

```text
Create a Creem test checkout for my demo product and use http://localhost:3000/success as the success URL. Then show me the checkout URL.
```

Expected Claude Code behavior:

- runs `creem checkouts create --product <id> --success-url http://localhost:3000/success --json`
- explains what was created
- gives you the checkout URL

#### 2.2 Complete the purchase

What you do:

1. open the checkout URL
2. complete the sandbox purchase
3. confirm the browser lands on `/success`

#### 2.3 Ask Claude Code to verify it

Prompt:

```text
I completed the purchase. Verify it went through and tell me the transaction details.
```

Expected Claude Code behavior:

- runs `creem transactions list --json`
- identifies the likely new transaction
- explains status, amount, and relevant ids

Then ask:

```text
Does the subscription look healthy?
```

Expected Claude Code behavior:

- runs `creem subscriptions list --json` or `creem subscriptions get <id> --json`
- explains state and next billing info

#### 2.4 Confirm the local app saw it

Now check the app:

```bash
curl -sS http://localhost:3000/api/debug/state
```

What must now be true:

- `lastSuccess` is updated
- `lastWebhook` is present
- `localAccessStatus` reflects the post-checkout state

If `lastWebhook` is still missing:

- stop
- fix tunnel / secret / webhook registration

Do not proceed to recording until this is fixed.

### Phase 3 — Workflow 2: propagation debug

This workflow is a conversation, not a script.

Prompt:

```text
My app thinks the user has access, but I want to make sure Creem agrees. Compare my local app state with what Creem says.
```

Expected Claude Code behavior:

- runs `curl http://localhost:3000/api/debug/state`
- runs `creem transactions list --json`
- runs `creem subscriptions list --json`
- explains whether local state and Creem state match

Optional stronger variant:

- turn off the tunnel before a test purchase
- then ask Claude Code the same question
- ideal diagnosis:
  - payment happened
  - your app never received the webhook
  - problem is propagation, not checkout

If you use the mismatch version, rehearse it before recording. Do not attempt it cold on camera.

### Phase 4 — Workflow 3: management

This workflow should also be conversational.

Prompt:

```text
I want to add a Pro Plan to my store. Create a recurring product at $19/month.
```

Expected Claude Code behavior:

- runs `creem products create ... --json`
- confirms the product details

Then ask:

```text
Now list all products to verify it.
```

Expected:

- Claude Code runs `creem products list --json`
- confirms the new product is visible

Then ask:

```text
I need to pause subscription sub_xxx while I debug something.
```

Expected:

- Claude Code runs pause
- explains the result

Then:

```text
Resume it and confirm the state after the change.
```

Expected:

- Claude Code runs resume
- explains the result

Choose the `sub_xxx` before recording. Do not improvise the target subscription.

## Recording readiness checklist

You are ready to record only if all of these are true:

1. Claude Code successfully used the Creem CLI at least once
2. Claude Code successfully created a checkout URL
3. one real checkout completed
4. one real webhook landed locally
5. `/api/debug/state` shows the webhook
6. Claude Code successfully compared app state vs Creem state
7. Claude Code successfully created a product
8. Claude Code successfully paused and resumed a safe test subscription

## What to write down before recording

Keep these in a note:

- product id used for checkout
- subscription id used for pause/resume
- exact Claude prompts that worked best
- tunnel URL
- one clean transaction id from a rehearsal
- one clean subscription id from a rehearsal

## Repo support material

These are useful, but not the protagonists of the video:

- `scripts/`
- `scripts/prompts/`
- `artifacts/`

They exist as:

- fallback tools
- reproducibility support
- blog/repo documentation

They should not dominate the recording.

## Recording pass mapping

Use this mapping:

- Step 0 -> video setup credibility
- Phase 1 -> opening baseline
- Phase 2 -> video Workflow 1
- Phase 3 -> video Workflow 2
- Phase 4 -> video Workflow 3

The recording should feel like a clean replay of this runbook, with narration added.

## Abort conditions

Do not start recording if any of these happens:

- Claude Code fails to use the CLI reliably
- Claude Code creates weak or confused explanations of the JSON
- webhook does not reach the local app
- the target subscription for pause/resume is not confirmed safe

Fix the issue first, then rerun this runbook.
