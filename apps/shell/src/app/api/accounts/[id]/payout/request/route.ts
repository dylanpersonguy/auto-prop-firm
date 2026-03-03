import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const idempotencyKey = body.idempotencyKey || crypto.randomUUID();
    const res = await propsimFetch(`/api/accounts/${params.id}/payout/request`, {
      method: 'POST',
      body: JSON.stringify({ ...body, idempotencyKey }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
