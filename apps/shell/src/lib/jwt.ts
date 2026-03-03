import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// ── Types ──

export interface UserJwtPayload extends JWTPayload {
  sub: string;
  email: string;
  roles?: string[];
  firmId?: string;
}

// ── Secret ──

const JWT_SECRET = process.env.PROPSIM_SHELL_JWT_SECRET || 'changeme_local_dev';
const secret = new TextEncoder().encode(JWT_SECRET);

if (
  process.env.NODE_ENV === 'production' &&
  JWT_SECRET === 'changeme_local_dev'
) {
  console.error(
    '[SECURITY] PROPSIM_SHELL_JWT_SECRET is using the default value. ' +
      'Set a strong secret in production!',
  );
}

// ── Verification ──

/**
 * Verify a PropSim-issued JWT and return the typed payload.
 * Returns null if the token is invalid, expired, or tampered with.
 *
 * Works in both Node.js and Edge runtimes (jose is Edge-compatible).
 */
export async function verifyToken(
  token: string,
): Promise<UserJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return payload as UserJwtPayload;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT payload WITHOUT verification.
 * Use only when you need to inspect an expired/unverifiable token
 * (e.g., to check if it's worth attempting a refresh).
 */
export function decodeTokenUnsafe(token: string): UserJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8'),
    );
    return payload as UserJwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check if a decoded token payload is expired.
 */
export function isTokenExpired(payload: JWTPayload): boolean {
  if (!payload.exp) return false;
  return payload.exp * 1000 < Date.now();
}

// ── Token Creation (for testing / shell-issued tokens) ──

/**
 * Create a signed JWT. Primarily used for tests and any
 * shell-originated tokens.
 */
export async function createToken(
  payload: Omit<UserJwtPayload, 'iat' | 'exp'>,
  expiresIn = '1h',
): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// ── API Route Guard ──

/**
 * Guard for protected API routes that require an authenticated trader.
 * Similar to `requireAdmin()` but for regular users.
 *
 * Usage in API routes:
 * ```ts
 * const auth = await requireUser();
 * if (!auth.authorized) return auth.response;
 * const { user } = auth;
 * ```
 */
export async function requireUser(
  cookieToken?: string | null,
): Promise<
  | { authorized: true; user: UserJwtPayload }
  | { authorized: false; response: Response }
> {
  if (!cookieToken) {
    return {
      authorized: false,
      response: Response.json(
        { error: 'Not authenticated' },
        { status: 401 },
      ),
    };
  }

  const payload = await verifyToken(cookieToken);
  if (!payload) {
    return {
      authorized: false,
      response: Response.json(
        { error: 'Invalid or expired token' },
        { status: 401 },
      ),
    };
  }

  return { authorized: true, user: payload };
}

/**
 * Convenience: extract authenticated userId from the access token cookie.
 * Returns { userId, response? }. If response is set, return it immediately.
 */
export async function getAuthUserId(): Promise<
  | { userId: string; response?: never }
  | { userId?: never; response: Response }
> {
  const { cookies } = await import('next/headers');
  const token = cookies().get('propsim_access_token')?.value;
  if (!token) {
    return { response: Response.json({ error: 'Authentication required' }, { status: 401 }) };
  }
  const payload = await verifyToken(token);
  if (!payload?.sub) {
    return { response: Response.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }
  return { userId: payload.sub };
}
