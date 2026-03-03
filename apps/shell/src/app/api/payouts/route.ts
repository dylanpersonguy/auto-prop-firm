import { propsimFetch } from '@/lib/propsim';
import { proxyPropSimGet } from '@/lib/api-response';

export async function GET() {
  return proxyPropSimGet(propsimFetch, '/api/accounts/payouts/all');
}
