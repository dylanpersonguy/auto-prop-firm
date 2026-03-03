import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

const MOCK_SYMBOLS = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD', 'BTCUSD', 'NAS100', 'SPX500'];
const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.0850, GBPUSD: 1.2680, USDJPY: 154.30, AUDUSD: 0.6540,
  XAUUSD: 2340.0, BTCUSD: 68400, NAS100: 18920, SPX500: 5320,
};

export async function GET() {
  try {
    const res = await propsimFetch('/api/market-data/ticks');
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    // PropSim unavailable
  }

  const ticks = MOCK_SYMBOLS.map((sym) => {
    const base = BASE_PRICES[sym] ?? 100;
    const spreadPips = base > 100 ? base * 0.0001 : 0.00015;
    const jitter = (Math.random() - 0.5) * base * 0.001;
    const mid = +(base + jitter).toFixed(base > 100 ? 2 : 5);
    const bid = +(mid - spreadPips / 2).toFixed(base > 100 ? 2 : 5);
    const ask = +(mid + spreadPips / 2).toFixed(base > 100 ? 2 : 5);
    return { symbol: sym, bid, ask, mid, spread: +(ask - bid).toFixed(base > 100 ? 2 : 5), timestamp: new Date().toISOString() };
  });

  return NextResponse.json(ticks);
}
