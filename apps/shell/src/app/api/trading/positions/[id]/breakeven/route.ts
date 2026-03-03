import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const res = await propsimFetch(`/api/trading/positions/${params.id}/breakeven`, {
      method: 'POST',
    });
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json({
    id: params.id,
    stopLossPrice: 0,
    message: 'Breakeven set (simulated)',
  });
}
