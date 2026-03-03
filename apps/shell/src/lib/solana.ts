import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { env } from './env';

/**
 * Get USDC balance for a token account.
 */
export async function getUsdcBalance(tokenAccountPubkey: PublicKey): Promise<bigint> {
  const connection = new Connection(env.solanaRpcUrl);
  try {
    const account = await getAccount(connection, tokenAccountPubkey);
    return account.amount;
  } catch {
    return 0n;
  }
}

/**
 * Get the ATA address for a wallet + USDC mint.
 */
export function getUsdcAta(wallet: PublicKey): PublicKey {
  const mint = new PublicKey(env.usdcMint);
  return getAssociatedTokenAddressSync(mint, wallet, true);
}

/**
 * Format base units (6 decimals) to human-readable USDC string.
 */
export function formatUsdc(baseUnits: bigint): string {
  const whole = baseUnits / 1_000_000n;
  const frac = baseUnits % 1_000_000n;
  const fracStr = frac.toString().padStart(6, '0').replace(/0+$/, '') || '0';
  return `${whole}.${fracStr}`;
}

/**
 * Verify that a txSig contains a USDC transfer to a specific destination.
 */
export async function verifyUsdcTransfer(params: {
  txSig: string;
  expectedDestinationAta: PublicKey;
  expectedMint: PublicKey;
  expectedAmountBaseUnits: bigint;
}): Promise<boolean> {
  const connection = new Connection(env.solanaRpcUrl);
  const tx = await connection.getParsedTransaction(params.txSig, {
    maxSupportedTransactionVersion: 0,
    commitment: 'confirmed',
  });

  if (!tx || tx.meta?.err) return false;

  // Check token balance changes
  const postBalances = tx.meta?.postTokenBalances || [];
  const preBalances = tx.meta?.preTokenBalances || [];

  for (const post of postBalances) {
    if (!post.mint || post.mint !== params.expectedMint.toBase58()) continue;

    const pre = preBalances.find(
      (p) => p.accountIndex === post.accountIndex && p.mint === post.mint,
    );

    const preAmount = BigInt(pre?.uiTokenAmount?.amount || '0');
    const postAmount = BigInt(post.uiTokenAmount?.amount || '0');
    const diff = postAmount - preAmount;

    if (diff >= params.expectedAmountBaseUnits) {
      // Verify the token account owner / address
      const accountKeys = tx.transaction.message.accountKeys;
      if (post.accountIndex < accountKeys.length) {
        const accountKey = accountKeys[post.accountIndex].pubkey;
        if (accountKey.equals(params.expectedDestinationAta)) {
          return true;
        }
      }
    }
  }

  return false;
}
