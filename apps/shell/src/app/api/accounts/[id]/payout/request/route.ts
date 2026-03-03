import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';
import { randomUUID } from 'crypto';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();

  // Include idempotency key
  const idempotencyKey = body.idempotencyKey || crypto.randomUUID();

  const res = await propsimFetch(`/api/accounts/${params.id}/payout/request`, {
    method: 'POST',
    body: JSON.stringify({ ...body, idempotencyKey }),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
