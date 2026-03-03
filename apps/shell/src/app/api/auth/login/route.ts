import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { setTokenCookies } from '@/lib/propsim';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${env.propsimBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || 'Login failed' },
        { status: res.status },
      );
    }

    const tokens = await res.json();
    setTokenCookies(tokens.accessToken, tokens.refreshToken);

    return NextResponse.json({ message: 'Logged in' });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
