import { describe, it, expect } from 'vitest';
import {
  calculateTradeFees,
  calculateDepositFee,
  calculateWithdrawalFee,
  calculatePayoutSplit,
  calculateChallengeFees,
  challengeFeeBreakdown,
  formatUsdc,
  FIRM_FEES,
} from '@/lib/fees';

// ─── calculateTradeFees ──────────────────────────────────────────────────────

describe('calculateTradeFees', () => {
  it('calculates trade commission + spread on 100,000 USDC notional', () => {
    const notional = 100_000_000_000n; // 100,000 USDC
    const { commission, spread, total } = calculateTradeFees(notional);

    // commission = 5 bps = 0.05% → 50 USDC
    expect(commission).toBe(50_000_000n);
    // spread = 3 bps = 0.03% → 30 USDC
    expect(spread).toBe(30_000_000n);
    // total = 80 USDC
    expect(total).toBe(80_000_000n);
  });

  it('handles zero notional', () => {
    const { commission, spread, total } = calculateTradeFees(0n);
    expect(commission).toBe(0n);
    expect(spread).toBe(0n);
    expect(total).toBe(0n);
  });

  it('truncates fractional base units (floor division)', () => {
    // 1 base unit: 1 * 5 / 10000 = 0 (floor)
    const { commission } = calculateTradeFees(1n);
    expect(commission).toBe(0n);

    // 2000 base units: 2000 * 5 / 10000 = 1
    const { commission: c2 } = calculateTradeFees(2000n);
    expect(c2).toBe(1n);
  });

  it('uses the configured basis point rates', () => {
    const notional = 10_000_000_000n; // 10,000 USDC
    const { commission, spread } = calculateTradeFees(notional);
    expect(commission).toBe((notional * FIRM_FEES.tradeCommissionBps) / 10_000n);
    expect(spread).toBe((notional * FIRM_FEES.spreadMarkupBps) / 10_000n);
  });
});

// ─── calculateDepositFee ─────────────────────────────────────────────────────

describe('calculateDepositFee', () => {
  it('returns 0 when deposit fee is 0 bps', () => {
    expect(FIRM_FEES.depositFeeBps).toBe(0n);
    expect(calculateDepositFee(1_000_000_000n)).toBe(0n);
  });
});

// ─── calculateWithdrawalFee ──────────────────────────────────────────────────

describe('calculateWithdrawalFee', () => {
  it('calculates 0.5% withdrawal fee', () => {
    const withdrawal = 1_000_000_000n; // 1,000 USDC
    const fee = calculateWithdrawalFee(withdrawal);
    // 50 bps = 0.5% → 5 USDC
    expect(fee).toBe(5_000_000n);
  });

  it('handles zero withdrawal', () => {
    expect(calculateWithdrawalFee(0n)).toBe(0n);
  });
});

// ─── calculatePayoutSplit ────────────────────────────────────────────────────

describe('calculatePayoutSplit', () => {
  it('calculates 10% firm split of payout', () => {
    const payout = 5_000_000_000n; // 5,000 USDC
    const split = calculatePayoutSplit(payout);
    // 1000 bps = 10% → 500 USDC
    expect(split).toBe(500_000_000n);
  });
});

// ─── calculateChallengeFees ──────────────────────────────────────────────────

describe('calculateChallengeFees', () => {
  it('splits a $500 challenge into provider fee, overhead, and net', () => {
    const price = 500_000_000n; // $500 USDC
    const { providerFee, overhead, netToTreasury, totalFirmRevenue } =
      calculateChallengeFees(price);

    // 10% each → $50 each
    expect(providerFee).toBe(50_000_000n);
    expect(overhead).toBe(50_000_000n);
    // Net to treasury = $500 - $50 - $50 = $400
    expect(netToTreasury).toBe(400_000_000n);
    // Firm revenue = $100
    expect(totalFirmRevenue).toBe(100_000_000n);
  });

  it('maintains invariant: net + provider + overhead = price', () => {
    const price = 123_456_789n;
    const { providerFee, overhead, netToTreasury } =
      calculateChallengeFees(price);
    expect(netToTreasury + providerFee + overhead).toBe(price);
  });
});

// ─── challengeFeeBreakdown ───────────────────────────────────────────────────

describe('challengeFeeBreakdown', () => {
  it('converts USD price to base units and calculates fees', () => {
    const breakdown = challengeFeeBreakdown(100); // $100
    expect(breakdown.totalPaid).toBe(100_000_000n);
    expect(breakdown.providerFee).toBe(10_000_000n); // $10
    expect(breakdown.overhead).toBe(10_000_000n); // $10
    expect(breakdown.netToTreasury).toBe(80_000_000n); // $80
    expect(breakdown.firmRevenueTotal).toBe(20_000_000n); // $20
  });
});

// ─── formatUsdc ──────────────────────────────────────────────────────────────

describe('formatUsdc', () => {
  it('formats whole dollar amounts', () => {
    expect(formatUsdc(100_000_000n)).toBe('100');
    expect(formatUsdc(0n)).toBe('0');
  });

  it('formats fractional amounts and strips trailing zeros', () => {
    expect(formatUsdc(1_500_000n)).toBe('1.5');
    expect(formatUsdc(1_230_000n)).toBe('1.23');
    expect(formatUsdc(123_456n)).toBe('0.123456');
  });

  it('accepts string input', () => {
    expect(formatUsdc('50000000')).toBe('50');
  });
});
