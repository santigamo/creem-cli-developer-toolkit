# Recording Validation Runbook

Run this before recording. This is a 1:1 rehearsal of the video.

The video has 3 acts. Each act answers a different question.
Claude Code with the official Creem CLI skill drives everything.

---

## Preflight

### 1. Confirm environment

```bash
creem --version
creem whoami --json
```

Expected:
- CLI v0.1.3+
- auth `true`, environment `test`

### 2. Confirm env files

Check:
- `examples/minimal-integration/.env` has `CREEM_API_KEY`, `CREEM_WEBHOOK_SECRET`, `CREEM_PRODUCT_ID`

### 3. Start the app

```bash
pnpm dev:integration
```

Confirm:
- `http://localhost:3000/` renders
- `http://localhost:3000/api/debug/state` responds with JSON

### 4. Start ngrok

```bash
ngrok http --url=chigger-crisp-tightly.ngrok-free.app 3000
```

Expected:
- stable public HTTPS URL on your reserved domain
- webhook registered in Creem dashboard pointing to `https://<ngrok-url>/api/webhooks/creem`

### 5. Load skill in Claude Code

Open Claude Code in the repo directory.
Confirm it can execute `creem whoami --json` and understands the output.

If Claude Code doesn't know the Creem CLI, point it to the official skill: `creem.io/SKILL.md`

---

## Act 1 — "Did it work?" (Verify)

Goal: establish trust. Show a real integration, a real purchase, and a clean happy path. Claude Code is a verifier here, not a debugger.

### Steps

1. Tell Claude Code:
   > "Create a test checkout for my product and give me the URL."

   Claude Code should run:
   ```
   creem checkouts create --product <PRODUCT_ID> --success-url http://localhost:3000/success --json
   ```

2. Open the checkout URL in browser. Complete the sandbox purchase.

3. Confirm `/success` page shows the query params (checkout_id, order_id, etc.)

4. Back in Claude Code:
   > "I just completed the purchase. Can you verify the transaction went through?"

   Claude Code should run `creem transactions list --json`, find the new transaction, explain status, amount, subscription.

5. Follow up:
   > "Does the subscription look healthy?"

   Claude Code should run `creem subscriptions get <id> --json` and confirm state.

6. End with a quick consistency check:
   > "Check my app's local state too — does it agree with Creem?"

   Claude Code should run `curl localhost:3000/api/debug/state` and confirm the app agrees with Creem.

### What must be true

- Checkout created from CLI
- Purchase completed
- Transaction visible via CLI
- Subscription active via CLI
- Webhook received by app
- App state matches Creem state
- Claude Code explained everything without you reading raw JSON

### Viewer takeaway

"My integration works. Claude Code can verify a live payment from the terminal without me digging through dashboards."

---

## Act 2 — "What broke?" (Diagnose)

Goal: tension. Start from a support symptom, not from a happy-path flow. Claude Code is now investigating a mismatch, not verifying success.

### Setup the incident

Before the second purchase, break webhook delivery on purpose.

```bash
# In the ngrok terminal: Ctrl+C
```

This means:
- Creem will process the payment
- Creem will try to send the webhook
- Your app will never receive it
- Your app state will NOT update

Now create and complete a second checkout quickly, but do not spend time re-verifying the success page or re-explaining the purchase flow. The purchase is just the setup for the incident.

### Steps

1. Create a second checkout and complete the sandbox purchase.

   Keep this fast. The story is no longer "can I make a purchase?" The story is "why does my app disagree with Creem?"

2. Start from the user symptom:
   > "A user says they paid but my app still doesn't show access. Compare my local state with Creem and tell me exactly what broke."

   Claude Code should gather evidence, not guess:
   - `curl localhost:3000/api/debug/state`
   - `creem transactions list --json`
   - `creem subscriptions list --json`

3. Claude Code should diagnose the mismatch clearly:
   > "The transaction exists in Creem and it's paid, but your app never received the webhook. The issue is on your side — likely your webhook endpoint was unreachable."

4. Ask one follow-up that keeps this act investigative:
   > "What are my next recovery options?"

   Claude Code should answer in plain English, for example:
   - restore the tunnel or webhook endpoint
   - replay the event if Creem supports replay
   - perform a fresh test payment after the endpoint is healthy
   - repair local state manually only if needed for the demo

5. End the act with diagnosis only.

   Do NOT restart ngrok or attempt recovery on camera during Act 2. The point of this act is that Claude Code found the problem quickly and explained it.

### What must be true

- Second payment went through in Creem
- App did NOT receive webhook (tunnel was down)
- Claude Code diagnosed the mismatch correctly without you telling it what you broke
- Diagnosis was clear: "payment exists, webhook didn't arrive"
- This took ~2 minutes, not 20 minutes in a dashboard

### Why this works

The viewer sees: "the CLI + AI found in seconds what would have taken me ages clicking through dashboards." This act is about evidence and diagnosis, not about repeating the purchase flow.

---

## Act 3 — "What do I change now?" (Operate)

Goal: payoff. The CLI isn't just for debugging — you can run your store from here.

### Steps

1. Restore your tunnel before starting Act 3.

2. Tell Claude Code:
   > "I want to add a Pro Plan to my store. $19/month, recurring."

   Claude Code runs:
   ```
   creem products create --name "Pro Plan" --description "Pro tier with advanced features" --price 1900 --currency USD --billing-type recurring --billing-period every-month --json
   ```

3. Verify:
   > "List all my products to confirm."

   Claude Code runs `creem products list --json`, shows both products.

4. Subscription management:
   > "I need to pause subscription sub_xxx while I investigate the webhook issue."

   Claude Code runs `creem subscriptions pause <id> --json`.

5. Resume:
   > "OK, the issue is fixed. Resume it."

   Claude Code runs `creem subscriptions resume <id> --json`.

6. Summary:
   > "Give me a summary of the current state of my store."

   Claude Code runs products list + subscriptions list, gives you a plain English overview.

### What must be true

- Product created from terminal
- Product appears in list
- Subscription paused and resumed
- Claude Code summarized everything in plain language
- You never opened a dashboard

### Viewer takeaway

"This is not just a debugging tool. Claude Code can operate my store from the same terminal."

---

## Recording readiness checklist

You are ready to record ONLY if all of these passed:

- [ ] Act 1: checkout created, purchased, verified, webhook received, app state matches
- [ ] Act 2: tunnel killed, purchase completed, webhook missed, Claude Code diagnosed correctly
- [ ] Act 3: product created, subscription paused, subscription resumed
- [ ] Claude Code used the CLI naturally in every act
- [ ] You never had to read raw JSON yourself
- [ ] You know which subscription ID is safe for pause/resume

## What to write down before recording

- Product ID for checkouts
- Subscription ID safe for pause/resume (pick one from Act 1)
- ngrok URL
- The exact natural language prompts that worked best in each act (refine during rehearsal)

## Abort conditions

Do NOT record if:

- Webhook didn't arrive in Act 1 (fix webhook setup first)
- Claude Code couldn't execute CLI commands (fix skill loading)
- Claude Code diagnosis in Act 2 was wrong or vague
- Pause/resume failed in Act 3
