import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const qs = req.nextUrl.searchParams.toString();
  const res = await propsimFetch(`/api/accounts/${params.id}/ledger${qs ? `?${qs}` : ''}`);
  return NextResponse.json(await res.json(), { status: res.status });
}
