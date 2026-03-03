import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET() {
  const res = await propsimFetch('/api/market-data/ticks');
  return NextResponse.json(await res.json(), { status: res.status });
}
