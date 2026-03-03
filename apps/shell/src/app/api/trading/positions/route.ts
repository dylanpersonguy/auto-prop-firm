import { NextRequest } from 'next/server';
import { propsimFetch } from '@/lib/propsim';
import { proxyPropSimGet } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  return proxyPropSimGet(propsimFetch, `/api/trading/positions${qs ? `?${qs}` : ''}`);
}
