import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function POST() {
  try {
    const res = await propsimFetch('/api/trading/orders/cancel-all', { method: 'POST' });
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json({ cancelled: 0, message: 'All orders cancelled (simulated)' });
}
