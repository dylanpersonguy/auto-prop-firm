import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const res = await propsimFetch(`/api/trading/positions/${params.id}/close`, {
      method: 'POST',
    });
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json({
    id: params.id,
    status: 'CLOSED',
    closedAt: new Date().toISOString(),
    message: 'Position closed (simulated)',
  });
}
