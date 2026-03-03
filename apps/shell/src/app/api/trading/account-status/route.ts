import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';
import { apiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await propsimFetch(`/api/trading/account-status${qs ? `?${qs}` : ''}`);
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
    const text = await res.text().catch(() => '');
    console.error(`PropSim /api/trading/account-status returned ${res.status}: ${text}`);
    return apiError(`Upstream error: ${res.statusText}`, res.status >= 500 ? 502 : res.status);
  } catch {
    console.warn('PropSim unreachable for account-status, using defaults');
  }

  return NextResponse.json({
    status: 'ACTIVE', tradingEnabled: true, riskStatus: 'OK', violations: [],
  });
}
