import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { env } from '@/lib/env';
import { getUsdcBalance, getUsdcAta, formatUsdc } from '@/lib/solana';

export async function GET() {
  try {
    const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER || 'localnet';
    const explorerBase =
      cluster === 'mainnet-beta'
        ? 'https://explorer.solana.com'
        : `https://explorer.solana.com?cluster=${cluster}`;

    // Treasury USDC balance
    let treasuryBalance = 0n;
    let treasuryAtaAddress = '';
    if (env.treasuryWallet) {
      const treasuryPubkey = new PublicKey(env.treasuryWallet);
      const treasuryAta = getUsdcAta(treasuryPubkey);
      treasuryAtaAddress = treasuryAta.toBase58();
      treasuryBalance = await getUsdcBalance(treasuryAta);
    }

    // Vault USDC balance
    let vaultBalance = 0n;
    if (env.vaultUsdcTokenAccount) {
      const vaultAta = new PublicKey(env.vaultUsdcTokenAccount);
      vaultBalance = await getUsdcBalance(vaultAta);
    }

    return NextResponse.json({
      treasury: {
        wallet: env.treasuryWallet,
        usdcAta: treasuryAtaAddress,
        balanceBaseUnits: treasuryBalance.toString(),
        balanceUsdc: formatUsdc(treasuryBalance),
        explorerUrl: env.treasuryWallet
          ? `${explorerBase}/address/${env.treasuryWallet}`
          : null,
      },
      vault: {
        programId: env.vaultProgramId,
        configPda: env.vaultConfigPda,
        usdcTokenAccount: env.vaultUsdcTokenAccount,
        balanceBaseUnits: vaultBalance.toString(),
        balanceUsdc: formatUsdc(vaultBalance),
        explorerUrl: env.vaultUsdcTokenAccount
          ? `${explorerBase}/address/${env.vaultUsdcTokenAccount}`
          : null,
      },
      totalReservesUsdc: formatUsdc(treasuryBalance + vaultBalance),
    });
  } catch (error) {
    console.error('Transparency error:', error);
    return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
  }
}
