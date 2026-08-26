#!/bin/bash
# Pulls latest (whatever branch is currently checked out — prod tracks the
# default branch, beta tracks `staging`), rebuilds, and reports whether a
# service restart is needed. Intended to run as the low-privilege service
# account (e.g. `sudo -u omniplex scripts/deploy.sh`) — deliberately does
# NOT restart the systemd service itself, since that account shouldn't have
# sudo rights to do so. See README.md's Deployment section for the full
# setup this script assumes.
#
# NEXT_PUBLIC_* variables are inlined into the client bundle at build time,
# not read at runtime — make sure .env is in place in this directory BEFORE
# running this script, not just before starting the service.
set -euo pipefail

export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
export PATH="$BUN_INSTALL/bin:$PATH"

cd "$(dirname "$0")/.."

echo "==> git pull"
git pull

echo "==> bun install"
bun install

echo "==> bun run build"
bun run build

echo
echo "Build complete. Apply it with:"
echo "  sudo systemctl restart omniplex        # prod"
echo "  sudo systemctl restart omniplex-beta   # beta"
