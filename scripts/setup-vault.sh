#!/usr/bin/env bash
# setup-vault.ts runner
# Initializes config + vault and funds it. Run after deploy-vault.sh + mint-usdc.sh
set -euo pipefail

npx ts-node --esm scripts/setup-vault.ts "$@"
