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

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        json?.error?.message ?? json?.message ?? json?.error ?? 'Login failed';
      return NextResponse.json({ error: msg }, { status: res.status });
    }

    // PropSim wraps in { success, data: { accessToken, refreshToken, user } }
    const data = json?.data ?? json;
    const { accessToken, refreshToken, user } = data;

    if (!accessToken || !refreshToken) {
      return NextResponse.json({ error: 'Invalid token response' }, { status: 502 });
    }

    setTokenCookies(accessToken, refreshToken);

    return NextResponse.json({
      message: 'Logged in',
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles,
          }
        : undefined,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
