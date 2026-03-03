import { randomBytes } from 'crypto';

// ── Constants ──

/** Commission rate: 15% */
export const COMMISSION_BPS = 1500n; // 15% in basis points
const BPS_DIVISOR = 10000n;

/** Minimum withdrawal: 50 USDC in base units (6 decimals) */
export const MIN_WITHDRAWAL_BASE_UNITS = 50_000_000n;

// ── Referral code generation ──

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity
const CODE_LENGTH = 8;

/**
 * Generate a unique, URL-safe referral code.
 * 8 chars from a 32-char alphabet → 32^8 ≈ 1.1 trillion combinations.
 */
export function generateReferralCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

// ── Commission math (BigInt only – never floating point) ──

/**
 * Calculate the 15% commission from a deposit amount.
 * Both input and output are USDC base units (6 decimals) as bigint.
 */
export function calculateCommission(depositAmountBaseUnits: bigint): bigint {
  return (depositAmountBaseUnits * COMMISSION_BPS) / BPS_DIVISOR;
}

// ── Referral link builder ──

/**
 * Build a full referral URL from a code and base URL.
 */
export function buildReferralLink(code: string, baseUrl: string): string {
  return `${baseUrl}/register?ref=${code}`;
}

// ── Validation helpers ──

const CODE_REGEX = /^[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]{8}$/;

/**
 * Check if a string looks like a valid referral code format.
 */
export function isValidCodeFormat(code: string): boolean {
  return CODE_REGEX.test(code.toUpperCase());
}
