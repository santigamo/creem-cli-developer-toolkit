#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

load_repo_env() {
  if [[ -f "$ROOT_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/.env"
    set +a
  fi

  if [[ -f "$ROOT_DIR/examples/minimal-integration/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/examples/minimal-integration/.env"
    set +a
  fi
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

timestamp() {
  date -u +"%Y%m%dT%H%M%SZ"
}

workflow_dir() {
  local name="$1"
  local dir="$ROOT_DIR/artifacts/$name-$(timestamp)"
  mkdir -p "$dir"
  echo "$dir"
}

save_json_command() {
  local outfile="$1"
  shift
  "$@" | tee "$outfile"
}

print_json_field() {
  local file="$1"
  local field="$2"
  node --input-type=module -e "import { readFileSync } from 'node:fs'; const json = JSON.parse(readFileSync(process.argv[1], 'utf8')); console.log(json[process.argv[2]] ?? '');" "$file" "$field"
}

