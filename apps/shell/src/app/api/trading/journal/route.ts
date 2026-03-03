import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const res = await propsimFetch(`/api/trading/journal${qs ? `?${qs}` : ''}`);
  return NextResponse.json(await res.json(), { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await propsimFetch('/api/trading/journal', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
