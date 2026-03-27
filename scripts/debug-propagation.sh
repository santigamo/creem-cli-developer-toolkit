#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/capture-json.sh"

load_repo_env
require_command curl
require_command creem

APP_URL="${APP_URL:-http://localhost:3000}"
WORK_DIR="$(workflow_dir wf2)"

echo "Artifacts: $WORK_DIR"

save_json_command "$WORK_DIR/local-debug-state.json" curl -sS "$APP_URL/api/debug/state"
save_json_command "$WORK_DIR/transactions-list.json" creem transactions list --limit 10 --json
save_json_command "$WORK_DIR/subscriptions-list.json" creem subscriptions list --limit 10 --json

echo
echo "Workflow 2 captured. Use scripts/prompts/wf2-debug-propagation.txt in Claude Code."

