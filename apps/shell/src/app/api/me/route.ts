import { NextResponse } from 'next/server';
import { propsimFetch, getTokens } from '@/lib/propsim';

export async function GET() {
  try {
    const { accessToken } = getTokens();
    if (!accessToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const firmRes = await propsimFetch('/api/firm/me');
    const firm = firmRes.ok ? await firmRes.json() : null;

    return NextResponse.json({ authenticated: true, firm });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
