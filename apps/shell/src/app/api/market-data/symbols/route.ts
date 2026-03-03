import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET() {
  try {
    const res = await propsimFetch('/api/market-data/symbols');
    if (res.ok) {
      const json = await res.json();
      const raw: any[] = json?.data ?? json;
      const symbols = raw.map((s: any) => ({
        symbol: s.name ?? s.symbol,
        name: s.displayName ?? s.name ?? s.symbol,
        description: s.displayName ?? s.name,
        category: (s.category ?? 'other').toLowerCase(),
        digits: s.digits ?? 5,
        pipSize: s.pipSize,
        contractSize: s.contractSize,
        commissionPerLot: s.commissionPerLot,
        maxLeverage: s.maxLeverage,
      }));
      return NextResponse.json(symbols);
    }
    return NextResponse.json([], { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Market data unavailable' }, { status: 503 });
  }
}
