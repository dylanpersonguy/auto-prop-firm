import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const res = await propsimFetch(`/api/accounts/${params.id}/payout/history`);
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json([]);
}
