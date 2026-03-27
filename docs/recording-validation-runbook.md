# Recording Validation Runbook

This is a 1:1 rehearsal of the recording flow.

The rule is simple:

- run this before recording
- do not improvise outside this sequence
- if a step fails, stop and fix it before moving on

## Goal

Validate the exact sequence you will later show on camera:

`app state -> checkout -> success -> webhook -> CLI verification -> AI reasoning -> operator workflow`

## Preflight

### 1. Confirm environment

Run:

```bash
creem --version
creem whoami --json
pnpm typecheck
```

Expected:

- CLI responds
- auth is `true`
- environment is `test`
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

### 3. Start the app

Run:

```bash
pnpm dev:integration
```

Then open:

- `http://localhost:3000/`
- `http://localhost:3000/api/debug/state`

Expected:

- page renders
- debug JSON responds

### 4. Start the tunnel

Run your preferred tunnel, for example:

```bash
ngrok http 3000
```

Expected:

- you get a stable public HTTPS URL

### 5. Confirm webhook registration

In Creem, confirm the webhook URL is:

```text
https://<public-url>/api/webhooks/creem
```

Expected:

- correct URL
- correct secret copied to local `.env`

## Validation Pass

This mirrors the recording.

### Phase 1 — Baseline state

Run:

```bash
curl -sS http://localhost:3000/api/debug/state
```

Look for:

- app config present
- `lastWebhook` visible or null
- current local state understandable

This is the first thing you will also show in the video.

### Phase 2 — Checkout workflow

Run:

```bash
pnpm workflow:checkout
```

What happens:

1. the script hits `POST /api/checkout`
2. it saves the checkout response
3. it prints the checkout URL
4. it waits for you to complete the purchase

What you must do now:

1. open the checkout URL
2. complete the sandbox purchase
3. confirm the browser lands on `/success`
4. go back to terminal and continue

Expected results:

- `checkout-response.json` exists
- `transactions-list.json` exists
- `subscriptions-list.json` exists
- `local-debug-state.json` exists

Then inspect:

```bash
curl -sS http://localhost:3000/api/debug/state
```

Must be true:

- `lastCheckout` is updated
- `lastSuccess` is updated
- `lastWebhook` is present after the real webhook lands
- `localAccessStatus` is no longer just the pre-checkout state

If `lastWebhook` is still null:

- stop
- check tunnel
- check secret
- check webhook registration

Do not proceed to recording until this is fixed.

### Phase 3 — Propagation debug workflow

Run:

```bash
pnpm workflow:debug
```

Then inspect the generated artifact folder in `artifacts/`.

Expected:

- local debug state saved
- transactions list saved
- subscriptions list saved

This is the exact material you will later give to Claude Code.

### Phase 4 — AI reasoning pass

Open Claude Code in the repo and use:

- [wf1-checkout-verify.txt](/Users/santi/Code/creem-cli-developer-toolkit/scripts/prompts/wf1-checkout-verify.txt)
- [wf2-debug-propagation.txt](/Users/santi/Code/creem-cli-developer-toolkit/scripts/prompts/wf2-debug-propagation.txt)

Expected:

- Claude identifies the likely transaction
- Claude identifies the likely subscription
- Claude gives a sensible next command

If Claude is vague:

- point it to the exact artifact paths
- shorten the prompt
- note the exact wording that works best

That wording is what you should reuse on camera.

### Phase 5 — Operator workflow

Pick a safe test subscription id first.

Run:

```bash
pnpm workflow:manage -- sub_xxx
```

Expected:

- product creation succeeds
- product list shows the new product
- pause succeeds
- resume succeeds

If you do not have a safe subscription id, do not improvise in the recording. Pick one now and write it down.

## Recording readiness checklist

You are ready to record only if all of these are true:

1. one real checkout completed
2. one real webhook landed locally
3. `/api/debug/state` shows the webhook
4. `workflow:checkout` completed cleanly
5. `workflow:debug` completed cleanly
6. `workflow:manage -- sub_xxx` completed cleanly
7. Claude Code prompts already worked once
8. you know which artifact folders you want to reference

## What to write down before recording

Keep these in a note:

- product id for checkout
- subscription id for pause/resume
- last clean `wf1` folder
- last clean `wf2` folder
- last clean `wf3` folder
- exact Claude Code prompts that worked best
- tunnel URL

## Recording pass mapping

Use this mapping:

- Validation Phase 1 -> Video intro baseline state
- Validation Phase 2 -> Video Workflow 1
- Validation Phase 3 -> Video Workflow 2
- Validation Phase 4 -> Video AI reasoning moments
- Validation Phase 5 -> Video Workflow 3

The recording should be almost the same sequence, just with narration and fewer pauses.

## Abort conditions

Do not start recording if any of these happens:

- webhook does not reach local app
- checkout succeeds but artifacts are incomplete
- Claude Code answer is weak or confused
- pause/resume target is not confirmed safe

Fix the issue first, then rerun this runbook.
