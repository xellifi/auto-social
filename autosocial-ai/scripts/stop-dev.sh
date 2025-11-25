#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [ -f .vite.pid ]; then
  PID=$(cat .vite.pid)
  if kill -0 "$PID" 2>/dev/null; then
    kill "$PID" && rm -f .vite.pid
    echo "Stopped Vite (pid $PID)"
    exit 0
  else
    echo "PID $PID not running, removing stale .vite.pid"
    rm -f .vite.pid
  fi
fi

# Fallback: kill processes listening on port 3000
PIDS=$(ss -ltnp 2>/dev/null | awk '/:3000 /{match($0,/pid=([0-9]+)/,a); if(a[1]) print a[1]}') || true
if [ -n "$PIDS" ]; then
  echo "Killing processes on port 3000: $PIDS"
  kill $PIDS || true
fi

echo "Done."
