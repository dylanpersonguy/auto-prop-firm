import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const res = await propsimFetch(`/api/trading/positions/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json({
    id: params.id,
    updatedAt: new Date().toISOString(),
    message: 'Position modification simulated locally',
  });
}
