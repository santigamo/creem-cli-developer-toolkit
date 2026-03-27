#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/capture-json.sh"

load_repo_env
require_command curl
require_command creem
require_command node

APP_URL="${APP_URL:-http://localhost:3000}"
WORK_DIR="$(workflow_dir wf1)"
CHECKOUT_RESPONSE="$WORK_DIR/checkout-response.json"

echo "Artifacts: $WORK_DIR"
echo "Creating checkout session against $APP_URL/api/checkout"

save_json_command "$CHECKOUT_RESPONSE" curl -sS \
  -X POST \
  "$APP_URL/api/checkout" \
  -H "content-type: application/json" \
  -d "{}"

CHECKOUT_URL="$(print_json_field "$CHECKOUT_RESPONSE" checkoutUrl)"
REQUEST_ID="$(print_json_field "$CHECKOUT_RESPONSE" requestId)"

echo
echo "Request ID: $REQUEST_ID"
echo "Checkout URL: $CHECKOUT_URL"
echo "Complete the purchase in the browser, then press Enter to continue."
read -r _

save_json_command "$WORK_DIR/local-debug-state.json" curl -sS "$APP_URL/api/debug/state"
save_json_command "$WORK_DIR/products-list.json" creem products list --json
save_json_command "$WORK_DIR/transactions-list.json" creem transactions list --limit 5 --json
save_json_command "$WORK_DIR/subscriptions-list.json" creem subscriptions list --limit 5 --json

echo
echo "Workflow 1 captured. Use scripts/prompts/wf1-checkout-verify.txt in Claude Code."

