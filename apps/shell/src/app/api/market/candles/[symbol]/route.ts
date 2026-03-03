import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

/* ── Deterministic mock candle generator ── */
function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const BASE_PRICES: Record<string, number> = {
  EURUSD: 1.0850, GBPUSD: 1.2680, USDJPY: 154.30, AUDUSD: 0.6540,
  USDCAD: 1.3620, USDCHF: 0.8820, NZDUSD: 0.5920, XAUUSD: 2340.0,
  BTCUSD: 68400, ETHUSD: 3650, NAS100: 18920, US30: 39200, SPX500: 5320,
};

function generateMockCandles(symbol: string, timeframe: string, limit: number) {
  const base = BASE_PRICES[symbol.toUpperCase()] ?? 100;
  const volatility = base > 1000 ? base * 0.004 : base > 100 ? base * 0.003 : base * 0.0015;

  const tfSeconds: Record<string, number> = {
    '1m': 60, '5m': 300, '15m': 900, '1H': 3600, '4H': 14400, '1D': 86400,
  };
  const interval = tfSeconds[timeframe] ?? 3600;

  const now = Math.floor(Date.now() / 1000);
  const startTime = now - interval * limit;

  const rand = seedRandom(symbol.length * 7919 + interval);
  let price = base;
  const candles = [];

  for (let i = 0; i < limit; i++) {
    const time = startTime + interval * i;
    const move1 = (rand() - 0.48) * volatility;
    const move2 = (rand() - 0.48) * volatility;
    const move3 = (rand() - 0.48) * volatility;

    const open = price;
    const mid = open + move1;
    const close = mid + move2;
    const extremeMove = Math.abs(move3) * 1.2;
    const high = Math.max(open, close, mid) + extremeMove;
    const low = Math.min(open, close, mid) - extremeMove;
    const volume = Math.floor(rand() * 5000 + 500);

    candles.push({
      time,
      open: +open.toFixed(base > 100 ? 2 : 5),
      high: +high.toFixed(base > 100 ? 2 : 5),
      low: +low.toFixed(base > 100 ? 2 : 5),
      close: +close.toFixed(base > 100 ? 2 : 5),
      volume,
    });

    price = close + (rand() - 0.5) * volatility * 0.3;
  }

  return candles;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } },
) {
  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await propsimFetch(
      `/api/market-data/candles/${encodeURIComponent(params.symbol)}${qs ? `?${qs}` : ''}`,
    );
    if (res.ok) {
      const json = await res.json();
      const raw: any[] = json?.data ?? json;
      // Normalize: ensure 'time' is in seconds (lightweight-charts expects seconds)
      const candles = raw.map((c: any) => ({
        time: c.time > 1e12 ? Math.floor(c.time / 1000) : c.time,
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume ?? 0),
      }));
      return NextResponse.json(candles);
    }
  } catch {
    // PropSim unavailable — fall through to mock data
  }

  const timeframe = req.nextUrl.searchParams.get('timeframe') ?? '1H';
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? 200), 500);
  const candles = generateMockCandles(params.symbol, timeframe, limit);
  return NextResponse.json(candles);
}
