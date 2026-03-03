import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { env } from './env';

const ADMIN_COOKIE = 'admin_token';
const secret = new TextEncoder().encode(env.adminJwtSecret);

/**
 * Create a signed admin JWT.
 */
export async function createAdminToken(email: string, userId: string): Promise<string> {
  return new SignJWT({ email, userId, role: 'ADMIN' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
}

/**
 * Verify an admin JWT and return claims.
 */
export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== 'ADMIN') return null;
    return payload as { email: string; userId: string; role: string };
  } catch {
    return null;
  }
}

/**
 * Set admin session cookie.
 */
export function setAdminCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

/**
 * Clear admin session cookie.
 */
export function clearAdminCookie() {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

/**
 * Get the admin token from the cookie.
 */
export function getAdminToken(): string | null {
  const cookieStore = cookies();
  return cookieStore.get(ADMIN_COOKIE)?.value ?? null;
}

/**
 * Guard: verify admin session and return claims, or return 401 response.
 */
export async function requireAdmin(): Promise<
  | { authorized: true; admin: { email: string; userId: string } }
  | { authorized: false; response: NextResponse }
> {
  const token = getAdminToken();
  if (!token) {
    return { authorized: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const claims = await verifyAdminToken(token);
  if (!claims) {
    return { authorized: false, response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }
  return { authorized: true, admin: { email: claims.email, userId: claims.userId } };
}
