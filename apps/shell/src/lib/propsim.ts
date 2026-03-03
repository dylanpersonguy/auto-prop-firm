import { cookies } from 'next/headers';
import { env } from './env';

const ACCESS_TOKEN_COOKIE = 'propsim_access_token';
const REFRESH_TOKEN_COOKIE = 'propsim_refresh_token';

/**
 * Get stored tokens from HttpOnly cookies.
 */
export function getTokens(): { accessToken: string | null; refreshToken: string | null } {
  const cookieStore = cookies();
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null,
  };
}

/**
 * Set auth tokens as HttpOnly, Secure cookies.
 */
export function setTokenCookies(accessToken: string, refreshToken: string) {
  const cookieStore = cookies();
  const secure = process.env.NODE_ENV === 'production';

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Clear auth cookies.
 */
export function clearTokenCookies() {
  const cookieStore = cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

/**
 * Proxy a request to PropSim, handling auth and auto-refresh on 401.
 */
export async function propsimFetch(
  path: string,
  init?: RequestInit & { body?: string | undefined },
): Promise<Response> {
  const { accessToken, refreshToken } = getTokens();

  const url = `${env.propsimBaseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(url, { ...init, headers, cache: 'no-store' });

  // Auto-refresh on 401
  if (res.status === 401 && refreshToken) {
    const refreshRes = await fetch(`${env.propsimBaseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setTokenCookies(data.accessToken, data.refreshToken);
      headers['Authorization'] = `Bearer ${data.accessToken}`;
      res = await fetch(url, { ...init, headers, cache: 'no-store' });
    }
  }

  return res;
}
