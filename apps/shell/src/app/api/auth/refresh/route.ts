import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { getTokens, setTokenCookies } from '@/lib/propsim';

export async function POST() {
  try {
    const { refreshToken } = getTokens();
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
    }

    const res = await fetch(`${env.propsimBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }

    const tokens = await res.json();
    setTokenCookies(tokens.accessToken, tokens.refreshToken);

    return NextResponse.json({ message: 'Refreshed' });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
