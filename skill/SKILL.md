# Creem CLI Operator

Use the Creem CLI as a terminal-native source of truth while the local integration app is running.

## Rules

1. Prefer `creem ... --json` so the output can be parsed or compared.
2. Compare local app state from `/api/debug/state` against Creem state before guessing.
3. For checkout validation, inspect:
   - local checkout response
   - `creem transactions list --json`
   - `creem subscriptions list --json`
4. For webhook debugging, decide whether the failure is in payment creation or state propagation.
5. For operator tasks, use product and subscription commands from the terminal before opening the dashboard.

## Suggested command sequence

```bash
creem whoami --json
creem products list --json
curl -sS http://localhost:3000/api/debug/state
creem transactions list --limit 5 --json
creem subscriptions list --limit 5 --json
```

