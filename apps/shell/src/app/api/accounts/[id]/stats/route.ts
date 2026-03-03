import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const res = await propsimFetch(`/api/accounts/${params.id}/stats`);
  return NextResponse.json(await res.json(), { status: res.status });
}
