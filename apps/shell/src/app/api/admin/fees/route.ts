import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { FIRM_FEES, formatUsdc } from '@/lib/fees';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/fees — Full fee/revenue dashboard data.
 * Returns ledger summary, breakdown by category, profit account balance.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    // 1) Aggregate by category
    const ledgerEntries = await prisma.firmFeeLedger.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Sum by category
    const byCategory: Record<string, bigint> = {};
    let totalRevenue = 0n;

    for (const entry of ledgerEntries) {
      const amt = BigInt(entry.amountBaseUnits);
      byCategory[entry.category] = (byCategory[entry.category] || 0n) + amt;
      totalRevenue += amt;
    }

    // 2) Get or create profit account
    let profitAccount = await prisma.firmProfitAccount.findFirst();
    if (!profitAccount) {
      profitAccount = await prisma.firmProfitAccount.create({
        data: { balanceBaseUnits: '0' },
      });
    }

    // 3) Recent ledger entries (last 50)
    const recentEntries = ledgerEntries.slice(0, 50).map((e: any) => ({
      id: e.id,
      category: e.category,
      amountUsdc: formatUsdc(e.amountBaseUnits),
      amountBaseUnits: e.amountBaseUnits,
      sourceType: e.sourceType,
      sourceId: e.sourceId,
      description: e.description,
      createdAt: e.createdAt.toISOString(),
    }));

    // 4) Build category breakdown
    const categoryBreakdown = Object.entries(byCategory).map(([cat, amount]) => ({
      category: cat,
      amountUsdc: formatUsdc(amount),
      amountBaseUnits: amount.toString(),
      count: ledgerEntries.filter((e: any) => e.category === cat).length,
    }));

    // 5) Fee configuration (current rates)
    const feeConfig = {
      tradeCommissionBps: Number(FIRM_FEES.tradeCommissionBps),
      depositFeeBps: Number(FIRM_FEES.depositFeeBps),
      withdrawalFeeBps: Number(FIRM_FEES.withdrawalFeeBps),
      payoutSplitBps: Number(FIRM_FEES.payoutSplitBps),
      challengeProviderFeeBps: Number(FIRM_FEES.challengeProviderFeeBps),
      overheadFeeBps: Number(FIRM_FEES.overheadFeeBps),
      spreadMarkupBps: Number(FIRM_FEES.spreadMarkupBps),
    };

    return NextResponse.json({
      totalRevenueUsdc: formatUsdc(totalRevenue),
      totalRevenueBaseUnits: totalRevenue.toString(),
      profitAccountBalanceUsdc: formatUsdc(profitAccount.balanceBaseUnits),
      profitAccountBalanceBaseUnits: profitAccount.balanceBaseUnits,
      categoryBreakdown,
      recentEntries,
      feeConfig,
      totalEntries: ledgerEntries.length,
    });
  } catch (error) {
    console.error('Admin fees error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
