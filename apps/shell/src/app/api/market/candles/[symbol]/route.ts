import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(
  req: NextRequest,
  { params }: { params: { symbol: string } },
) {
  const qs = req.nextUrl.searchParams.toString();
  const res = await propsimFetch(
    `/api/market-data/candles/${encodeURIComponent(params.symbol)}${qs ? `?${qs}` : ''}`,
  );
  return NextResponse.json(await res.json(), { status: res.status });
}
