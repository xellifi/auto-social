#!/usr/bin/env bash
set -euo pipefail

# Start the Vite dev server detached and record its PID
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Install dependencies if node_modules missing (safe to run repeatedly)
if [ ! -d node_modules ]; then
  npm install --no-audit --no-fund
fi

nohup npm run dev > /tmp/autosocial-vite.log 2>&1 &
echo $! > .vite.pid
echo "Vite started (pid $(cat .vite.pid)), log: /tmp/autosocial-vite.log"
