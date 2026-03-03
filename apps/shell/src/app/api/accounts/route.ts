import { NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET() {
  const res = await propsimFetch('/api/accounts/me/list');
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
