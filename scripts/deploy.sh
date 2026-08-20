#!/bin/bash
# Pulls latest, rebuilds, and reports whether a service restart is needed.
# Intended to run as the low-privilege service account (`sudo -u docs
# scripts/deploy.sh`) — deliberately does NOT restart the systemd service
# itself, since that account shouldn't have sudo rights to do so.
set -euo pipefail

export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

cd "$(dirname "$0")/.."

echo "==> git pull"
git pull

echo "==> bun install (also runs fumadocs-mdx via postinstall)"
bun install

echo "==> bun run build"
bun run build

echo
echo "Build complete. Apply it with:"
echo "  sudo systemctl restart omniplex-docs"
