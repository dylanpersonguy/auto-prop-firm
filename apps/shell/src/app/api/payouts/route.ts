import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET() {
  try {
    const res = await propsimFetch('/api/accounts/payouts/all');
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch {
    // PropSim not available
  }
  return NextResponse.json([]);
}
