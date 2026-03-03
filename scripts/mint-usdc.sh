#!/usr/bin/env bash
# mint-usdc.sh — Create a local USDC mint, treasury ATA, and fund the vault
# Run this AFTER deploying the vault program and initializing config+vault.
set -euo pipefail

echo "==> Creating local USDC mint..."
USDC_MINT=$(spl-token create-token --decimals 6 2>&1 | grep "Creating token" | awk '{print $3}')
echo "USDC Mint: $USDC_MINT"

# Authority (default wallet)
AUTHORITY=$(solana address)
echo "Authority: $AUTHORITY"

# Create ATA for authority (treasury)
echo "==> Creating treasury ATA..."
TREASURY_ATA=$(spl-token create-account "$USDC_MINT" 2>&1 | grep "Creating account" | awk '{print $3}')
echo "Treasury ATA: $TREASURY_ATA"

# Mint 1,000,000 USDC to treasury
echo "==> Minting 1,000,000 USDC to treasury..."
spl-token mint "$USDC_MINT" 1000000

echo ""
echo "================================================="
echo "USDC Mint: $USDC_MINT"
echo "Treasury Wallet: $AUTHORITY"
echo "Treasury ATA: $TREASURY_ATA"
echo ""
echo "Set these in apps/shell/.env:"
echo "NEXT_PUBLIC_USDC_MINT=$USDC_MINT"
echo "NEXT_PUBLIC_TREASURY_WALLET=$AUTHORITY"
echo "================================================="
echo ""
echo "Next steps:"
echo "  1. Initialize config+vault program with these addresses"
echo "  2. Fund the vault token account with USDC:"
echo "     Run the setup-vault.ts script or transfer manually"
