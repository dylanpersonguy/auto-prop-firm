import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const res = await propsimFetch(`/api/trading/closed-positions${qs ? `?${qs}` : ''}`);
  return NextResponse.json(await res.json(), { status: res.status });
}
