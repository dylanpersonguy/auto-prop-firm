import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

const MOCK_SYMBOLS = [
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'forex', digits: 5 },
  { symbol: 'GBPUSD', name: 'British Pound / US Dollar', category: 'forex', digits: 5 },
  { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'forex', digits: 3 },
  { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', category: 'forex', digits: 5 },
  { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'forex', digits: 5 },
  { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'forex', digits: 5 },
  { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', category: 'forex', digits: 5 },
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'commodities', digits: 2 },
  { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', category: 'crypto', digits: 2 },
  { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', category: 'crypto', digits: 2 },
  { symbol: 'NAS100', name: 'Nasdaq 100', category: 'indices', digits: 2 },
  { symbol: 'US30', name: 'Dow Jones 30', category: 'indices', digits: 2 },
  { symbol: 'SPX500', name: 'S&P 500', category: 'indices', digits: 2 },
];

export async function GET() {
  try {
    const res = await propsimFetch('/api/market-data/symbols');
    if (res.ok) {
      const json = await res.json();
      const raw: any[] = json?.data ?? json;
      // Normalize: PropSim uses 'name', our frontend expects 'symbol'
      const symbols = raw.map((s: any) => ({
        symbol: s.name ?? s.symbol,
        name: s.displayName ?? s.name ?? s.symbol,
        description: s.displayName ?? s.name,
        category: (s.category ?? 'other').toLowerCase(),
        digits: s.digits ?? 5,
        pipSize: s.pipSize,
        contractSize: s.contractSize,
        lotSize: s.contractSize,
        minQuantity: s.minQuantity ?? 0.01,
        maxQuantity: s.maxQuantity ?? 100,
        commissionPerLot: s.commissionPerLot,
        swapLong: s.swapLong,
        swapShort: s.swapShort,
        maxLeverage: s.maxLeverage,
      }));
      return NextResponse.json(symbols);
    }
  } catch {
    // PropSim unavailable
  }

  return NextResponse.json(MOCK_SYMBOLS);
}
