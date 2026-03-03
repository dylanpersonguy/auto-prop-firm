#!/usr/bin/env bash
# deploy-vault.sh — Build and deploy the propsim_vault program to localnet
# Then print the program ID and derived PDAs.
set -euo pipefail

echo "==> Building Anchor program..."
anchor build

# Extract program ID from keypair
PROGRAM_KEYPAIR="target/deploy/propsim_vault-keypair.json"
PROGRAM_ID=$(solana address --keypair "$PROGRAM_KEYPAIR")
echo "Program ID: $PROGRAM_ID"

# Update declare_id in lib.rs and Anchor.toml
sed -i '' "s/VLT111111111111111111111111111111111111111/$PROGRAM_ID/" programs/propsim_vault/src/lib.rs 2>/dev/null || \
sed -i "s/VLT111111111111111111111111111111111111111/$PROGRAM_ID/" programs/propsim_vault/src/lib.rs

sed -i '' "s/VLT111111111111111111111111111111111111111/$PROGRAM_ID/" Anchor.toml 2>/dev/null || \
sed -i "s/VLT111111111111111111111111111111111111111/$PROGRAM_ID/" Anchor.toml

echo "==> Rebuilding with correct program ID..."
anchor build

echo "==> Deploying to localnet..."
anchor deploy

# Get authority (default wallet)
AUTHORITY=$(solana address)
echo "Authority: $AUTHORITY"

# Derive Config PDA
CONFIG_PDA=$(node -e "
  const { PublicKey } = require('@solana/web3.js');
  const programId = new PublicKey('$PROGRAM_ID');
  const authority = new PublicKey('$AUTHORITY');
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config'), authority.toBuffer()],
    programId,
  );
  console.log(pda.toBase58());
")
echo "Config PDA: $CONFIG_PDA"

# Derive Vault Authority PDA
VAULT_AUTH=$(node -e "
  const { PublicKey } = require('@solana/web3.js');
  const programId = new PublicKey('$PROGRAM_ID');
  const configPda = new PublicKey('$CONFIG_PDA');
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), configPda.toBuffer()],
    programId,
  );
  console.log(pda.toBase58());
")
echo "Vault Authority PDA: $VAULT_AUTH"

echo ""
echo "================================================="
echo "Set these in apps/shell/.env:"
echo "NEXT_PUBLIC_VAULT_PROGRAM_ID=$PROGRAM_ID"
echo "NEXT_PUBLIC_VAULT_CONFIG_PDA=$CONFIG_PDA"
echo "================================================="
echo ""
echo "Next steps:"
echo "  1. Run 'pnpm usdc:mint' to create USDC mint and fund the vault"
echo "  2. Initialize config + vault by calling the program instructions"
