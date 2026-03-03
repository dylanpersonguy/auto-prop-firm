import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.0850, GBPUSD: 1.2680, USDJPY: 154.30, AUDUSD: 0.6540,
  USDCAD: 1.3620, USDCHF: 0.8820, NZDUSD: 0.5920, XAUUSD: 2340.0,
  BTCUSD: 68400, ETHUSD: 3650, NAS100: 18920, US30: 39200, SPX500: 5320,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } },
) {
  try {
    const res = await propsimFetch(`/api/market-data/ticks/${encodeURIComponent(params.symbol)}`);
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    // PropSim unavailable — fall through to mock tick
  }

  const base = BASE_PRICES[params.symbol.toUpperCase()] ?? 100;
  const spreadPips = base > 100 ? base * 0.0001 : 0.00015;
  const jitter = (Math.random() - 0.5) * base * 0.001;
  const mid = +(base + jitter).toFixed(base > 100 ? 2 : 5);
  const bid = +(mid - spreadPips / 2).toFixed(base > 100 ? 2 : 5);
  const ask = +(mid + spreadPips / 2).toFixed(base > 100 ? 2 : 5);

  return NextResponse.json({
    symbol: params.symbol.toUpperCase(),
    bid,
    ask,
    mid,
    spread: +(ask - bid).toFixed(base > 100 ? 2 : 5),
    timestamp: new Date().toISOString(),
  });
}
