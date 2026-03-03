import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const res = await propsimFetch(`/api/accounts/${params.id}/payout/calculate`);
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`PropSim payout/calc returned ${res.status}: ${text}`);
      return NextResponse.json(
        { error: `Failed to calculate payout: ${res.statusText}` },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Payout calc error:', error);
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }
}
