import { NextResponse } from 'next/server';
import { getTokens } from '@/lib/propsim';
import { verifyToken } from '@/lib/jwt';

/**
 * GET /api/auth/me — returns the current user from the verified JWT.
 */
export async function GET() {
  const { accessToken } = getTokens();

  if (!accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifyToken(accessToken);

  if (!payload) {
    return NextResponse.json({ authenticated: false, reason: 'invalid' }, { status: 401 });
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
}
