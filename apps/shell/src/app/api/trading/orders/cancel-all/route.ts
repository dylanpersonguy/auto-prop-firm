import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function POST() {
  const res = await propsimFetch('/api/trading/orders/cancel-all', { method: 'POST' });
  return NextResponse.json(await res.json(), { status: res.status });
}
