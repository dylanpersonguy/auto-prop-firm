import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET() {
  try {
    const res = await propsimFetch('/api/firm/me');
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json({ id: 'local', name: 'Auto Prop Firm' });
}
