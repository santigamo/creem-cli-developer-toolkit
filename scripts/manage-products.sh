#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/capture-json.sh"

load_repo_env
require_command creem

WORK_DIR="$(workflow_dir wf3)"
SUBSCRIPTION_ID="${1:-}"
PRODUCT_NAME="${CREEM_DEMO_PRODUCT_NAME:-CLI Demo Product $(date -u +%Y%m%d-%H%M%S)}"
PRODUCT_DESCRIPTION="${CREEM_DEMO_PRODUCT_DESCRIPTION:-Sandbox product for the Creem CLI bounty demo}"
PRICE_CENTS="${CREEM_DEMO_PRODUCT_PRICE:-1500}"
CURRENCY="${CREEM_DEMO_PRODUCT_CURRENCY:-USD}"
BILLING_TYPE="${CREEM_DEMO_PRODUCT_BILLING_TYPE:-onetime}"

echo "Artifacts: $WORK_DIR"

save_json_command "$WORK_DIR/product-created.json" creem products create \
  --name "$PRODUCT_NAME" \
  --description "$PRODUCT_DESCRIPTION" \
  --price "$PRICE_CENTS" \
  --currency "$CURRENCY" \
  --billing-type "$BILLING_TYPE" \
  --json

save_json_command "$WORK_DIR/products-list.json" creem products list --json
save_json_command "$WORK_DIR/subscriptions-list.json" creem subscriptions list --limit 10 --json

if [[ -n "$SUBSCRIPTION_ID" ]]; then
  save_json_command "$WORK_DIR/subscription-paused.json" creem subscriptions pause "$SUBSCRIPTION_ID" --json
  save_json_command "$WORK_DIR/subscription-resumed.json" creem subscriptions resume "$SUBSCRIPTION_ID" --json
else
  echo "No subscription id provided; skipping pause/resume."
fi

echo
echo "Workflow 3 captured. Use scripts/prompts/wf3-manage-terminal.txt in Claude Code."
