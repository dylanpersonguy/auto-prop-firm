import { NextResponse } from 'next/server';
import { getTokens } from '@/lib/propsim';

/**
 * GET /api/auth/me — returns the current user from the JWT.
 * No PropSim call needed — we decode the JWT payload client-side.
 */
export async function GET() {
  const { accessToken } = getTokens();

  if (!accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    // Decode JWT payload (no verification — that's PropSim's job)
    const parts = accessToken.split('.');
    if (parts.length !== 3) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8'),
    );

    // Check expiry
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return NextResponse.json({ authenticated: false, reason: 'expired' }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.sub,
        email: payload.email,
        roles: payload.roles ?? [],
        firmId: payload.firmId,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
