import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const res = await propsimFetch(`/api/trading/orders/${params.id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await propsimFetch(`/api/trading/orders/${params.id}`, { method: 'DELETE' });
  const text = await res.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return new NextResponse(text, { status: res.status });
  }
}
