---
name: creem-cli
description: Use this skill when you need to operate the Creem CLI for authentication checks, products, customers, checkouts, subscriptions, transactions, configuration, monitoring, or terminal automation workflows. Prefer it for agent-driven Creem tasks that should use real CLI commands and JSON output instead of dashboard clicks or guessed API calls.
---

# Creem CLI

`creem` is the official Creem command-line interface for managing products, customers, checkouts, subscriptions, transactions, and CLI configuration from the terminal.

Use this skill when the user wants to operate Creem from a terminal or through an AI agent. Prefer the CLI over dashboard instructions when the task is supported directly by `creem`.

## Prerequisites

- The `creem` CLI must already be installed.
- The user must already be authenticated before agent-driven work starts.
- Start in test mode unless the user explicitly asks to use live mode.
- Confirm the current session with:

```bash
creem whoami --json
```

## Secret Safety

- Never read, print, summarize, upload, or parse `~/.creem/config.json`.
- Never ask the user to paste API keys into chat.
- Never run `creem login --api-key ...` inside an agent or LLM session.
- If authentication is missing, tell the user to authenticate manually outside the session, then continue with `creem whoami --json`.
- Never switch to live mode unless the user explicitly asks for production operations.

## Agent Rules

- Prefer `--json` on every command so outputs are machine-readable.
- Run `creem whoami --json` before mutating operations.
- List or inspect resources before mutating them. Do not guess IDs.
- Do not use the interactive browser mode (`creem products`, `creem customers`, etc.) in agent sessions.
- Do not change the global CLI output format unless the user explicitly asks. Use per-command `--json` instead.
- For cancellations, recommend `--mode scheduled` unless the user explicitly wants immediate access removal.
- Treat CLI money amounts as minor units, not major units. For EUR and USD, `500` means `5.00`, not `500.00`.
- When summarizing prices or transactions for humans, convert minor units into a decimal amount with currency. Do not repeat raw CLI numbers as if they were full euros or dollars.

## Money Amounts

Creem CLI prices and transaction amounts are returned in minor units.

- `--price 1999` means `19.99`, not `1999.00`.
- `500 EUR` from the CLI means `5.00 EUR`, not `500.00 EUR`.
- If you are explaining a transaction to the user, present both forms when helpful: raw CLI value plus human value.

Example:

```text
tran_6QWuvWPj9s9twH6vvdpOI8 | paid | 500 EUR
```

Interpret that as:

```text
paid transaction for 5.00 EUR (CLI raw amount: 500 minor units)
```

## Quick Reference

| Action | Command |
| --- | --- |
| Check auth and environment | `creem whoami --json` |
| Show config | `creem config show --json` |
| List config keys | `creem config list --json` |
| List products | `creem products list --json` |
| Get product | `creem products get prod_XXXXX --json` |
| Create product | `creem products create --name "Pro Plan" --description "Monthly pro subscription with all features" --price 1999 --currency USD --billing-type recurring --billing-period every-month --json` |
| List customers | `creem customers list --json` |
| Get customer by ID | `creem customers get cust_XXXXX --json` |
| Get customer by email | `creem customers get --email user@example.com --json` |
| Billing portal link | `creem customers billing cust_XXXXX --json` |
| Create checkout | `creem checkouts create --product prod_XXXXX --success-url https://app.com/welcome --json` |
| Get checkout | `creem checkouts get chk_XXXXX --json` |
| List subscriptions | `creem subscriptions list --json` |
| Filter subscriptions | `creem subscriptions list --status active --json` |
| Get subscription | `creem subscriptions get sub_XXXXX --json` |
| Pause subscription | `creem subscriptions pause sub_XXXXX --json` |
| Resume subscription | `creem subscriptions resume sub_XXXXX --json` |
| Cancel subscription safely | `creem subscriptions cancel sub_XXXXX --mode scheduled --json` |
| List transactions | `creem transactions list --limit 50 --json` |
| Get transaction | `creem transactions get txn_XXXXX --json` |

## High-Value Workflows

### Create a checkout and verify it

```bash
creem whoami --json
creem checkouts create --product prod_XXXXX --success-url https://app.com/welcome --json
creem transactions list --limit 10 --json
creem subscriptions list --limit 10 --json
```

Use this flow when the user wants to create a payment link, inspect the returned checkout, then verify whether the resulting transaction or subscription exists.

When reading the returned amounts, convert minor units before explaining totals to the user.

### Create and inspect products

```bash
creem whoami --json
creem products create --name "Template Pack" --description "50 premium templates" --price 4999 --currency USD --billing-type onetime --tax-mode exclusive --tax-category digital-goods-service --json
creem products list --json
creem products get prod_XXXXX --json
```

### Look up customers and open the billing portal

```bash
creem customers list --json
creem customers get --email user@example.com --json
creem customers billing cust_XXXXX --json
```

Use customer lookup before subscription or transaction investigations so the next commands use real IDs.

### Pause, resume, or cancel subscriptions

```bash
creem subscriptions list --status active --json
creem subscriptions pause sub_XXXXX --json
creem subscriptions resume sub_XXXXX --json
creem subscriptions cancel sub_XXXXX --mode scheduled --json
```

Prefer `--mode scheduled` for cancellation unless the user explicitly asks for immediate removal of access.

### Review transactions and subscription health

```bash
creem transactions list --limit 20 --json
creem subscriptions list --status active --json
creem subscriptions list --status paused --json
creem subscriptions list --status canceled --json
creem subscriptions list --status scheduled_cancel --json
```

For scripted monitoring, parse JSON with `jq` instead of relying on table output.

### Inspect or change CLI configuration only when requested

```bash
creem config show --json
creem config get environment --json
creem config set environment test
```

Do not change `environment` or `output_format` unless the user explicitly asks.

## Automation Patterns

```bash
# Latest transaction ID
creem transactions list --limit 1 --json | jq -r '.[0].id'

# Count active subscriptions
creem subscriptions list --status active --json | jq 'length'

# Bulk checkout generation
for PRODUCT_ID in prod_AAA prod_BBB prod_CCC; do
  creem checkouts create --product "$PRODUCT_ID" --json | jq -r '.checkout_url'
done
```

When automating, keep the workflow read-first and fail on missing IDs instead of guessing.

## More Docs

- Docs index: [https://docs.creem.io/llms.txt](https://docs.creem.io/llms.txt)
- Creem docs home: [https://docs.creem.io](https://docs.creem.io)
- CLI reference: use the docs index above to locate the latest Creem CLI page before drilling deeper.
