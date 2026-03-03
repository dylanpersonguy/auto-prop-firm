/**
 * setup-vault.ts — Initialize the vault config + vault token account on localnet.
 *
 * Usage:
 *   npx ts-node scripts/setup-vault.ts \
 *     --programId <PROGRAM_ID> \
 *     --usdcMint <USDC_MINT> \
 *     --claimSignerPubkey <CLAIM_SIGNER_PUBKEY>
 *
 * Or read from environment variables:
 *   NEXT_PUBLIC_VAULT_PROGRAM_ID, NEXT_PUBLIC_USDC_MINT, etc.
 */

import * as anchor from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  mintTo,
} from '@solana/spl-token';

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PropsimVault;
  const authority = provider.wallet as anchor.Wallet;

  // Derive or get from args
  const usdcMint = new PublicKey(
    process.env.NEXT_PUBLIC_USDC_MINT || process.argv[process.argv.indexOf('--usdcMint') + 1],
  );

  const claimSignerPubkeyStr =
    process.env.CLAIM_SIGNER_PUBKEY || process.argv[process.argv.indexOf('--claimSignerPubkey') + 1];
  const claimSignerPubkey = new PublicKey(claimSignerPubkeyStr);

  const domain = Buffer.alloc(16, 0);
  Buffer.from(process.env.CLAIM_DOMAIN || 'PROPSIM_PAYOUT_V1', 'utf8').copy(domain, 0, 0, 16);
  const domainArray = Array.from(domain);

  const dailyCap = new anchor.BN(
    (parseInt(process.env.DAILY_CAP_USDC || '5000', 10) * 1_000_000).toString(),
  );

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config'), authority.publicKey.toBuffer()],
    program.programId,
  );

  const [vaultAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), configPda.toBuffer()],
    program.programId,
  );

  const vaultUsdc = await getAssociatedTokenAddress(usdcMint, vaultAuthority, true);

  console.log('Config PDA:', configPda.toBase58());
  console.log('Vault Authority PDA:', vaultAuthority.toBase58());
  console.log('Vault USDC ATA:', vaultUsdc.toBase58());

  // 1. Initialize config
  console.log('\n==> Initializing config...');
  try {
    await program.methods
      .initializeConfig(
        claimSignerPubkey,
        usdcMint,
        true,
        dailyCap,
        domainArray,
      )
      .accounts({
        authority: authority.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log('Config initialized.');
  } catch (err: any) {
    if (err.message?.includes('already in use')) {
      console.log('Config already exists, skipping.');
    } else {
      throw err;
    }
  }

  // 2. Initialize vault
  console.log('==> Initializing vault...');
  try {
    await program.methods
      .initializeVault()
      .accounts({
        authority: authority.publicKey,
        config: configPda,
        vaultAuthority,
        vaultUsdc,
        usdcMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();
    console.log('Vault initialized.');
  } catch (err: any) {
    if (err.message?.includes('already in use')) {
      console.log('Vault already exists, skipping.');
    } else {
      throw err;
    }
  }

  // 3. Fund the vault with USDC
  console.log('==> Funding vault with 100,000 USDC...');
  try {
    await mintTo(
      provider.connection,
      (authority as any).payer,
      usdcMint,
      vaultUsdc,
      authority.publicKey,
      100_000_000_000, // 100,000 USDC
    );
    console.log('Vault funded.');
  } catch (err: any) {
    console.error('Mint failed (ensure authority is mint authority):', err.message);
  }

  console.log('\n=== SETUP COMPLETE ===');
  console.log('NEXT_PUBLIC_VAULT_CONFIG_PDA=' + configPda.toBase58());
  console.log('NEXT_PUBLIC_VAULT_USDC_TOKEN_ACCOUNT=' + vaultUsdc.toBase58());
}

main().catch(console.error);
