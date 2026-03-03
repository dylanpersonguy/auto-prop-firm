import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const res = await propsimFetch(`/api/v1/accounts/${params.id}/metrics`);
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json({
    accountId: params.id,
    balance: 0, equity: 0, profit: 0, profitPercent: 0,
    dailyPnl: 0, dailyPnlPercent: 0, maxDrawdown: 0, maxDrawdownPercent: 0,
    tradingDays: 0, winRate: 0, totalTrades: 0, openPositions: 0,
  });
}
