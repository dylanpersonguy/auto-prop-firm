import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET() {
  const res = await propsimFetch('/api/firm/me');
  return NextResponse.json(await res.json(), { status: res.status });
}
