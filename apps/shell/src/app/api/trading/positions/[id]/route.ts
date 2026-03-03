import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const res = await propsimFetch(`/api/trading/positions/${params.id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
