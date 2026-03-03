import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await propsimFetch(`/api/trading/positions/${params.id}/breakeven`, {
    method: 'POST',
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
