import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } },
) {
  const res = await propsimFetch(`/api/market-data/ticks/${encodeURIComponent(params.symbol)}`);
  return NextResponse.json(await res.json(), { status: res.status });
}
