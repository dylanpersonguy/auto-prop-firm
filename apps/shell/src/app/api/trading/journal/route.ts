import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';

export async function GET(req: NextRequest) {
  try {
    const qs = req.nextUrl.searchParams.toString();
    const res = await propsimFetch(`/api/trading/journal${qs ? `?${qs}` : ''}`);
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const res = await propsimFetch('/api/trading/journal', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.ok) return NextResponse.json(await res.json(), { status: res.status });
  } catch { /* PropSim unavailable */ }

  // Simulate journal entry locally
  return NextResponse.json({
    id: `journal_${Date.now()}`,
    accountId: body.accountId,
    content: body.content || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { status: 201 });
}
