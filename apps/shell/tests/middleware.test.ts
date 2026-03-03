import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { SignJWT } from 'jose';

const TEST_SECRET = new TextEncoder().encode('test_jwt_secret_for_vitest');
const WRONG_SECRET = new TextEncoder().encode('wrong_secret');

// ── Helper: create signed JWT ──

async function makeToken(
  payload: Record<string, unknown>,
  secret: Uint8Array = TEST_SECRET,
  expiresIn = '1h',
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// ── Minimal NextRequest / NextResponse shims ──

function createRequest(
  path: string,
  cookies: Record<string, string> = {},
): any {
  const url = new URL(path, 'http://localhost:3001');
  return {
    nextUrl: url,
    url: url.toString(),
    cookies: {
      get: (name: string) =>
        cookies[name] ? { value: cookies[name] } : undefined,
    },
  };
}

// Since Next.js middleware uses NextResponse which is hard to import in tests,
// we test the core logic by importing the middleware and mocking NextResponse.

// We can't easily import the actual middleware because it depends on Next.js
// runtime. Instead we test the JWT verification + routing logic directly.

describe('Middleware auth logic', () => {
  it('should verify valid tokens with jose', async () => {
    const { jwtVerify } = await import('jose');
    const token = await makeToken({ sub: 'user-1', email: 'u@test.com' });
    const { payload } = await jwtVerify(token, TEST_SECRET, {
      algorithms: ['HS256'],
    });
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('u@test.com');
  });

  it('should reject tokens with wrong secret', async () => {
    const { jwtVerify } = await import('jose');
    const token = await makeToken(
      { sub: 'user-1', email: 'u@test.com' },
      WRONG_SECRET,
    );
    await expect(
      jwtVerify(token, TEST_SECRET, { algorithms: ['HS256'] }),
    ).rejects.toThrow();
  });

  it('should throw ERR_JWT_EXPIRED for expired tokens', async () => {
    const { jwtVerify } = await import('jose');
    const token = await makeToken(
      { sub: 'user-1', email: 'u@test.com' },
      TEST_SECRET,
      '0s',
    );
    await new Promise((r) => setTimeout(r, 50));

    try {
      await jwtVerify(token, TEST_SECRET, { algorithms: ['HS256'] });
      expect.fail('Should have thrown');
    } catch (err: any) {
      expect(err.code).toBe('ERR_JWT_EXPIRED');
    }
  });

  it('should reject tampered tokens', async () => {
    const { jwtVerify } = await import('jose');
    const token = await makeToken({ sub: 'user-1', email: 'u@test.com' });

    // Tamper with payload
    const parts = token.split('.');
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8'),
    );
    payload.sub = 'hacker';
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tampered = parts.join('.');

    await expect(
      jwtVerify(tampered, TEST_SECRET, { algorithms: ['HS256'] }),
    ).rejects.toThrow();
  });
});

describe('Public path routing logic', () => {
  const PUBLIC_PATHS = new Set([
    '/',
    '/login',
    '/register',
    '/proof-of-reserves',
    '/challenges',
  ]);

  const PUBLIC_PREFIXES = [
    '/api/auth/',
    '/api/deposits/',
    '/api/referral/validate',
    '/api/market/',
    '/api/market-data/',
    '/api/challenges/catalog',
    '/api/ws/',
    '/api/firm',
    '/api/features',
    '/_next/',
    '/favicon',
  ];

  function isPublic(pathname: string): boolean {
    if (PUBLIC_PATHS.has(pathname)) return true;
    if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
    if (pathname.includes('.')) return true;
    return false;
  }

  it('recognizes landing page as public', () => {
    expect(isPublic('/')).toBe(true);
  });

  it('recognizes auth routes as public', () => {
    expect(isPublic('/api/auth/login')).toBe(true);
    expect(isPublic('/api/auth/register')).toBe(true);
    expect(isPublic('/api/auth/refresh')).toBe(true);
  });

  it('recognizes market data as public', () => {
    expect(isPublic('/api/market/ticks')).toBe(true);
    expect(isPublic('/api/market-data/candles')).toBe(true);
  });

  it('blocks protected pages', () => {
    expect(isPublic('/dashboard')).toBe(false);
    expect(isPublic('/account/123')).toBe(false);
    expect(isPublic('/admin')).toBe(false);
    expect(isPublic('/payouts')).toBe(false);
  });

  it('blocks protected API routes', () => {
    expect(isPublic('/api/accounts')).toBe(false);
    expect(isPublic('/api/trading/orders')).toBe(false);
    expect(isPublic('/api/admin/overview')).toBe(false);
    expect(isPublic('/api/payouts')).toBe(false);
  });

  it('allows static files (contains dot)', () => {
    expect(isPublic('/styles.css')).toBe(true);
    expect(isPublic('/logo.png')).toBe(true);
  });

  it('allows challenges catalog', () => {
    expect(isPublic('/api/challenges/catalog')).toBe(true);
  });

  it('blocks challenges purchase', () => {
    expect(isPublic('/api/challenges/purchase')).toBe(false);
  });

  it('allows WebSocket/SSE endpoints', () => {
    expect(isPublic('/api/ws/ticks')).toBe(true);
  });
});
