import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await propsimFetch(`/api/trading/account-status${qs ? `?${qs}` : ''}`);
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json({
    status: 'ACTIVE', tradingEnabled: true, riskStatus: 'OK', violations: [],
  });
}
