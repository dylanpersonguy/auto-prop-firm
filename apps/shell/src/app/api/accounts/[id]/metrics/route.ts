import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await propsimFetch(`/api/v1/accounts/${params.id}/metrics`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
