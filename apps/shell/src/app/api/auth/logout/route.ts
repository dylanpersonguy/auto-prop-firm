import { NextResponse } from 'next/server';
import { clearTokenCookies, getTokens, propsimFetch } from '@/lib/propsim';

export async function POST() {
  try {
    const { refreshToken } = getTokens();

    if (refreshToken) {
      // Best-effort: tell PropSim to invalidate the token
      await propsimFetch('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }

    clearTokenCookies();
    return NextResponse.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    clearTokenCookies();
    return NextResponse.json({ message: 'Logged out' });
  }
}
