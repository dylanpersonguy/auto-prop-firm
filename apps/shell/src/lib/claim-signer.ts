import nacl from 'tweetnacl';
import { createHash } from 'crypto';
import { env } from './env';
import { buildClaimMessage, type ClaimV1Fields } from '@auto-prop-firm/vault-sdk';
import { PublicKey } from '@solana/web3.js';

/**
 * Load the Ed25519 signing keypair from the base64 env variable.
 * NEVER expose to browser.
 */
function getSignerKeypair(): nacl.SignKeyPair {
  const b64 = env.claimSignerPrivateKeyB64;
  if (!b64) throw new Error('PROPSIM_CLAIM_SIGNER_ED25519_PRIVATE_KEY_BASE64 not set');
  const secretKey = Buffer.from(b64, 'base64');
  if (secretKey.length !== 64) throw new Error('Ed25519 secret key must be 64 bytes');
  return nacl.sign.keyPair.fromSecretKey(secretKey);
}

/**
 * Get the public key of the claim signer (safe to share).
 */
export function getSignerPublicKey(): Uint8Array {
  return getSignerKeypair().publicKey;
}

/**
 * Pad or truncate a domain string to exactly 16 bytes.
 */
export function domainBytes(domain: string): Uint8Array {
  const buf = Buffer.alloc(16, 0);
  Buffer.from(domain, 'utf-8').copy(buf, 0, 0, 16);
  return new Uint8Array(buf);
}

/**
 * Compute the current UTC day number (days since epoch).
 */
export function utcDayNumber(now?: Date): number {
  const d = now || new Date();
  return Math.floor(d.getTime() / (86400 * 1000));
}

/**
 * Generate a deterministic claim ID from payout parameters.
 */
export function makeClaimId(
  payoutId: string,
  wallet: string,
  amount: bigint,
  issuedAtISO: string,
): Uint8Array {
  const input = `payout:${payoutId}:${wallet}:${amount.toString()}:${issuedAtISO}`;
  const hash = createHash('sha256').update(input).digest();
  return new Uint8Array(hash);
}

/**
 * Build + sign a ClaimV1 for a payout.
 * Returns the claim fields, serialized message, and signature.
 */
export function issueClaim(params: {
  payoutId: string;
  accountId: string;
  wallet: string;
  amount: bigint; // USDC base units (6 decimals)
}): {
  claimFields: ClaimV1Fields;
  messageB64: string;
  signatureB64: string;
  claimIdHex: string;
  signerPubkeyB64: string;
} {
  const { payoutId, wallet, amount } = params;
  const keypair = getSignerKeypair();
  const now = new Date();
  const nowUnix = Math.floor(now.getTime() / 1000);

  const claimId = makeClaimId(payoutId, wallet, amount, now.toISOString());

  const claimFields: ClaimV1Fields = {
    version: 1,
    domain: domainBytes(env.claimDomain),
    programId: new PublicKey(env.vaultProgramId),
    config: new PublicKey(env.vaultConfigPda),
    claimId,
    user: new PublicKey(wallet),
    usdcMint: new PublicKey(env.usdcMint),
    amount,
    validAfter: BigInt(nowUnix - 60),
    validBefore: BigInt(nowUnix + env.claimTtlSeconds),
    dayId: utcDayNumber(now),
    dailyCap: BigInt(env.dailyCapUsdc * 1_000_000), // convert to base units
  };

  const messageBytes = buildClaimMessage(claimFields);
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);

  return {
    claimFields,
    messageB64: Buffer.from(messageBytes).toString('base64'),
    signatureB64: Buffer.from(signature).toString('base64'),
    claimIdHex: Buffer.from(claimId).toString('hex'),
    signerPubkeyB64: Buffer.from(keypair.publicKey).toString('base64'),
  };
}
