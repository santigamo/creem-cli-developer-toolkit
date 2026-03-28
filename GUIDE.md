# Using the Creem CLI as a Developer Power Tool with Claude Code

If you build with Creem, you know the loop: write some code, open the dashboard, check if the checkout went through, look at the webhook logs, compare with your local state, go back to the code. Repeat.

It works, but it's slow. And the more your integration grows — subscriptions, status changes, multiple products — the more time you spend switching between tabs instead of building.

This guide shows a different approach. Instead of going to the dashboard, you stay in the terminal. Instead of reading JSON yourself, you let an AI coding assistant do it. The Creem CLI provides the data, Claude Code interprets it, and your app shows the result. Everything in one place.

I built a small integration to demonstrate this. The repo includes a minimal Bun + Hono app that handles checkouts and webhooks, plus a Claude Code skill that teaches the AI how to operate the Creem CLI safely. The entire workflow — verify, debug, operate — happens from the terminal.

## The setup

The integration is intentionally small. A Bun server running Hono with five routes:

- `GET /` — a status page that shows the current state of your app at a glance, including a color-coded badge (green for access granted, red for revoked, yellow for in-progress, gray for no activity)
- `POST /api/checkout` — creates a checkout session via the Creem SDK
- `GET /success` — captures the redirect parameters after a successful purchase
- `POST /api/webhooks/creem` — receives and verifies webhook events from Creem using HMAC SHA-256
- `GET /api/debug/state` — returns the full local state as JSON, useful for programmatic comparison

The app tracks a simple state machine: `unknown → checkout-created → checkout-completed → granted → revoked`. Every transition is driven by a webhook event. If the webhook doesn't arrive, the state doesn't change. This becomes important later.

The key thing to understand is that the Creem CLI and the app are two independent views of the same data. The CLI talks directly to the Creem API. The app only learns about changes through webhooks. When they agree, everything is fine. When they don't, something broke — and the CLI can help you find out what.

## Teaching Claude Code the Creem CLI

Claude Code is a capable AI coding assistant, but it doesn't know how to use the Creem CLI out of the box. It doesn't know the commands, the flags, or the conventions — like the fact that Creem returns money amounts in minor units, where `500` means `5.00 EUR`, not `500.00`.

That's why I built a skill. In Claude Code, a skill is a structured document that teaches the AI how to use a specific tool. It covers the available commands, the correct flags, safety rules, and common workflows.

The Creem CLI skill includes:

- A quick reference table for every supported command: products, customers, checkouts, subscriptions, transactions, and configuration
- Rules like "always use `--json` for machine-readable output" and "never read or expose the config file at `~/.creem/config.json`"
- Money amount conventions: always convert minor units before showing values to the user
- High-value workflows: how to create and verify a checkout, how to look up customers, how to manage subscription lifecycle
- Automation patterns for scripting and piping output through `jq`

The skill lives in the repo at `skills/creem-cli/SKILL.md` and anyone can install it with one command:

```bash
npx skills add santigamo/creem-cli-developer-toolkit
```

Once installed, Claude Code loads the skill automatically when it's relevant. You talk in natural language, and it translates your intent into the correct CLI commands with the right flags and safety constraints.

## Workflow 1: Verify a purchase

The first thing you want to know when building a payment integration is: does it work? Did the checkout go through? Did the webhook land? Does my app agree with the payment provider?

Normally you'd check the Creem dashboard for the transaction, then check your server logs for the webhook, then maybe hit your debug endpoint to compare. Three different places, three different formats.

With the CLI skill loaded, the conversation looks like this:

**You:** "Create a test checkout for my product and give me the URL."

Claude Code runs `creem checkouts create --product <id> --success-url http://localhost:3000/success --json`, parses the response, and hands you the checkout URL. You open it, complete the sandbox purchase with a test card, and come back.

**You:** "I just completed the purchase. Can you verify the transaction went through?"

Claude Code runs `creem transactions list --json`, finds the new transaction, and explains: paid, the amount in human-readable format (converting from minor units), the associated subscription ID. No raw JSON to read.

**You:** "Does the subscription look healthy?"

Claude Code runs `creem subscriptions get <id> --json` and confirms: active, renewal date set, everything nominal.

**You:** "Check my app's local state too — does it agree with Creem?"

Claude Code hits `curl localhost:3000/api/debug/state`, compares the local access status with what the Creem API returned, and confirms they match. The app's status badge shows green: "Access Granted."

The entire verification took less than two minutes. One conversation, zero dashboard tabs. And because Claude Code explains the results in plain English, you don't have to parse any JSON yourself.

## Workflow 2: Diagnose a state mismatch

Verifying the happy path is useful, but the real value shows up when something breaks. Specifically: when your payment provider knows something that your app doesn't.

This happens more often than you'd think. A subscription gets paused or canceled on the Creem side, but the webhook doesn't land — maybe your endpoint was down, maybe there was a network hiccup, maybe your tunnel dropped. Your app keeps showing "Access Granted" while the subscription is actually paused. Your user has access they shouldn't have, or worse, they lost access and your app doesn't know.

Finding this kind of mismatch by hand means opening the Creem dashboard, finding the subscription, checking its status, then comparing with your database or local state, then checking your webhook logs to see if the event was ever delivered. That's a 10 to 15 minute investigation, minimum.

Here's how it looks with the CLI:

**You:** "Pause the subscription from my last test purchase, then compare what Creem says with what my app says. I want to know if subscription changes are propagating correctly."

Claude Code runs the pause command, then gathers evidence from both sides: `creem subscriptions get <id> --json` for the Creem state, and `curl localhost:3000/api/debug/state` for the app state. It compares them and reports the finding.

In my test, the result was clear: Creem shows the subscription as paused, but the app still says "Access Granted." The status badge on the home page is still green. The webhook never arrived.

Claude Code didn't just find the mismatch — it explained why. The subscription changed in Creem, Creem tried to send a webhook, but the endpoint wasn't reachable. The local state is stale.

**You:** "What are my recovery options?"

Claude Code suggests concrete steps: restore the webhook endpoint, then either replay the event if the platform supports it, or trigger another state change so the next webhook lands and syncs the state. It adapts the suggestions to what it knows about the setup.

The whole diagnosis took about 30 seconds. The same investigation through dashboards and logs would have taken significantly longer, and with more room for error — especially if you're comparing timestamps across different UIs.

## Workflow 3: Operate the store

The CLI isn't just for testing and debugging. Once you're comfortable with it, you can manage your Creem store without leaving the terminal.

First, recovery from the previous workflow. After restoring the webhook endpoint:

**You:** "My endpoint is healthy again. Resume that subscription and confirm the current state."

Claude Code resumes the subscription, verifies the state on both sides, and confirms everything is back in sync. The app's status badge flips back to green, and the webhook event shows up in the recent events table.

Then, product management:

**You:** "I want to add a Pro Plan to my store. 19 dollars a month, recurring."

Claude Code runs `creem products create` with the right flags: `--name "Pro Plan"`, `--price 1900` (minor units), `--currency USD`, `--billing-type recurring`, `--billing-period every-month`. One sentence from you, one command from the CLI.

**You:** "List all my products to confirm."

Claude Code runs `creem products list --json` and shows you both products — the original test product and the new Pro Plan.

**You:** "Give me a summary of the current state of my store."

Claude Code pulls products and subscriptions, cross-references them, and gives you a plain English overview: how many products, how many active subscriptions, current revenue state. The kind of snapshot that would normally require opening the dashboard and clicking through several pages.

## Why this matters

The pattern here isn't specific to Creem. It's about what happens when a CLI tool produces structured output and an AI assistant knows how to read it.

The Creem CLI already returns clean JSON with `--json`. That makes it machine-readable. The skill teaches Claude Code what the commands are, what the output means, and what the conventions are (like minor units). Together, they turn what would be a series of manual dashboard checks into a conversation.

Three things make this particularly effective:

1. **Verification without context-switching.** After integrating a payment flow, you can verify the entire chain — checkout, transaction, subscription, webhook, local state — without leaving the terminal. The AI reads the JSON so you don't have to.

2. **Faster diagnosis.** When your app and your payment provider disagree, the CLI lets you query both sides programmatically and compare. The AI spots the mismatch and explains it. What takes 10–15 minutes in a dashboard takes 30 seconds here.

3. **Store operations from the terminal.** Creating products, managing subscriptions, getting store overviews — these are all things you can do conversationally. No forms, no navigation, no waiting for pages to load.

## Try it yourself

The repo is open and includes everything you need:

- A minimal Bun + Hono app with checkout, webhook, and state tracking
- The Claude Code skill for the Creem CLI
- Setup instructions and environment configuration

Install the skill:

```bash
npx skills add santigamo/creem-cli-developer-toolkit
```

Clone the repo, set up your Creem test credentials, start the app, and start talking to Claude Code. The skill handles the rest.

GitHub: [santigamo/creem-cli-developer-toolkit](https://github.com/santigamo/creem-cli-developer-toolkit)
