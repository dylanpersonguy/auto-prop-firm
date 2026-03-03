/**
 * Firm Fee Configuration
 * 
 * All rates are in basis points (1 bp = 0.01%).
 * Revenue streams:
 *   1. Trade commissions     — per-trade fee
 *   2. Deposit fees          — % of incoming deposits
 *   3. Withdrawal fees       — % of outgoing withdrawals
 *   4. Payout splits         — firm's cut of trader profit payouts
 *   5. Challenge provider fee — 10% of challenge price
 *   6. Overhead fee          — 10% of challenge price
 *   7. Spread markup         — per-trade spread markup (in bps of notional)
 *
 * All amounts use BigInt in USDC base units (6 decimals).
 */

// ── Basis-point constants ──

const BPS_DIVISOR = 10_000n;

// ── Fee Schedule (basis points) ──

export const FIRM_FEES = {
  /** Trade commission: 5 bps (0.05%) of notional per trade */
  tradeCommissionBps: 5n,

  /** Deposit fee: 0 bps (free deposits — can be set > 0) */
  depositFeeBps: 0n,

  /** Withdrawal fee: 50 bps (0.5%) of withdrawal amount */
  withdrawalFeeBps: 50n,

  /** Payout split: firm keeps 10% of trader profit payouts */
  payoutSplitBps: 1000n,

  /** Challenge provider fee: 10% of challenge purchase price */
  challengeProviderFeeBps: 1000n,

  /** Overhead/operating cost: 10% of challenge purchase price */
  overheadFeeBps: 1000n,

  /** Spread markup: 3 bps (0.03%) of notional per trade */
  spreadMarkupBps: 3n,
} as const;

// ── Fee category enum ──

export type FeeCategory =
  | 'TRADE_COMMISSION'
  | 'DEPOSIT_FEE'
  | 'WITHDRAWAL_FEE'
  | 'PAYOUT_SPLIT'
  | 'CHALLENGE_PROVIDER_FEE'
  | 'OVERHEAD_FEE'
  | 'SPREAD_MARKUP';

// ── Calculation helpers (all BigInt, never floating point) ──

/** Apply a basis-point rate to a base-unit amount. */
function applyBps(amount: bigint, bps: bigint): bigint {
  return (amount * bps) / BPS_DIVISOR;
}

/**
 * Calculate trade fees (commission + spread) from notional value in USDC base units.
 */
export function calculateTradeFees(notionalBaseUnits: bigint) {
  const commission = applyBps(notionalBaseUnits, FIRM_FEES.tradeCommissionBps);
  const spread = applyBps(notionalBaseUnits, FIRM_FEES.spreadMarkupBps);
  return { commission, spread, total: commission + spread };
}

/**
 * Calculate deposit fee from deposit amount in USDC base units.
 */
export function calculateDepositFee(depositBaseUnits: bigint): bigint {
  return applyBps(depositBaseUnits, FIRM_FEES.depositFeeBps);
}

/**
 * Calculate withdrawal fee from withdrawal amount in USDC base units.
 */
export function calculateWithdrawalFee(withdrawalBaseUnits: bigint): bigint {
  return applyBps(withdrawalBaseUnits, FIRM_FEES.withdrawalFeeBps);
}

/**
 * Calculate firm's cut of a trader payout in USDC base units.
 */
export function calculatePayoutSplit(payoutBaseUnits: bigint): bigint {
  return applyBps(payoutBaseUnits, FIRM_FEES.payoutSplitBps);
}

/**
 * Break down challenge purchase into: net treasury, provider fee, and overhead.
 * Provider fee = 10%, overhead = 10%, net to treasury = 80%.
 */
export function calculateChallengeFees(challengePriceBaseUnits: bigint) {
  const providerFee = applyBps(challengePriceBaseUnits, FIRM_FEES.challengeProviderFeeBps);
  const overhead = applyBps(challengePriceBaseUnits, FIRM_FEES.overheadFeeBps);
  const netToTreasury = challengePriceBaseUnits - providerFee - overhead;
  return { providerFee, overhead, netToTreasury, totalFirmRevenue: providerFee + overhead };
}

/**
 * Summary: given a challenge price, return the full fee breakdown.
 */
export function challengeFeeBreakdown(priceUsdc: number) {
  const baseUnits = BigInt(Math.floor(priceUsdc * 1_000_000));
  const fees = calculateChallengeFees(baseUnits);
  return {
    totalPaid: baseUnits,
    providerFee: fees.providerFee,
    overhead: fees.overhead,
    netToTreasury: fees.netToTreasury,
    firmRevenueTotal: fees.totalFirmRevenue,
  };
}

/**
 * Format USDC base units to human-readable string.
 */
export function formatUsdc(baseUnits: bigint | string): string {
  const val = typeof baseUnits === 'string' ? BigInt(baseUnits) : baseUnits;
  const abs = val < 0n ? -val : val;
  const sign = val < 0n ? '-' : '';
  const whole = abs / 1_000_000n;
  const frac = abs % 1_000_000n;
  const fracStr = frac.toString().padStart(6, '0').replace(/0+$/, '');
  return sign + (fracStr ? `${whole}.${fracStr}` : whole.toString());
}
