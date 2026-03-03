import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const res = await propsimFetch(`/api/trading/journal/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json({ id: params.id, updatedAt: new Date().toISOString() });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const res = await propsimFetch(`/api/trading/journal/${params.id}`, { method: 'DELETE' });
    if (res.ok) {
      const text = await res.text();
      try {
        return NextResponse.json(JSON.parse(text), { status: res.status });
      } catch {
        return new NextResponse(text, { status: res.status });
      }
    }
  } catch { /* PropSim unavailable */ }

  return NextResponse.json({ id: params.id, deleted: true });
}
