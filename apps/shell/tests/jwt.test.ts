import { describe, it, expect, beforeAll } from 'vitest';
import { SignJWT, jwtVerify } from 'jose';

// We rely on setup.ts setting PROPSIM_SHELL_JWT_SECRET = 'test_jwt_secret_for_vitest'
const TEST_SECRET = new TextEncoder().encode('test_jwt_secret_for_vitest');
const WRONG_SECRET = new TextEncoder().encode('wrong_secret');

// We need dynamic import because the module reads process.env at import time
let verifyToken: (token: string) => Promise<any>;
let decodeTokenUnsafe: (token: string) => any;
let isTokenExpired: (payload: any) => boolean;
let createToken: (payload: any, expiresIn?: string) => Promise<string>;
let requireUser: (token?: string | null) => Promise<any>;

beforeAll(async () => {
  const jwt = await import('@/lib/jwt');
  verifyToken = jwt.verifyToken;
  decodeTokenUnsafe = jwt.decodeTokenUnsafe;
  isTokenExpired = jwt.isTokenExpired;
  createToken = jwt.createToken;
  requireUser = jwt.requireUser;
});

// ── Helper: create a JWT with a specific secret ──

async function makeToken(
  payload: Record<string, unknown>,
  secret: Uint8Array,
  expiresIn = '1h',
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

// ─── verifyToken ─────────────────────────────────────────────────────────────

describe('verifyToken', () => {
  it('returns payload for a valid token signed with correct secret', async () => {
    const token = await makeToken(
      { sub: 'user-123', email: 'test@example.com', roles: ['TRADER'] },
      TEST_SECRET,
    );
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-123');
    expect(payload!.email).toBe('test@example.com');
    expect(payload!.roles).toEqual(['TRADER']);
  });

  it('returns null for a token signed with wrong secret', async () => {
    const token = await makeToken(
      { sub: 'user-123', email: 'test@example.com' },
      WRONG_SECRET,
    );
    const payload = await verifyToken(token);
    expect(payload).toBeNull();
  });

  it('returns null for an expired token', async () => {
    const token = await makeToken(
      { sub: 'user-123', email: 'test@example.com' },
      TEST_SECRET,
      '0s', // expires immediately
    );
    // Small delay to ensure expiry
    await new Promise((r) => setTimeout(r, 50));
    const payload = await verifyToken(token);
    expect(payload).toBeNull();
  });

  it('returns null for a completely malformed token', async () => {
    expect(await verifyToken('not.a.jwt')).toBeNull();
    expect(await verifyToken('')).toBeNull();
    expect(await verifyToken('random-garbage')).toBeNull();
  });

  it('returns null for a token with tampered payload', async () => {
    const token = await makeToken(
      { sub: 'user-123', email: 'test@example.com' },
      TEST_SECRET,
    );
    // Tamper with the payload (middle part)
    const parts = token.split('.');
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8'),
    );
    payload.email = 'hacker@evil.com';
    parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const tampered = parts.join('.');

    expect(await verifyToken(tampered)).toBeNull();
  });

  it('rejects tokens with unsupported algorithms', async () => {
    // Create a token with "none" algorithm (header says HS256 but no real sig)
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ sub: 'user-123', email: 'test@example.com', exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString('base64url');
    const fakeToken = `${header}.${payload}.`;

    expect(await verifyToken(fakeToken)).toBeNull();
  });
});

// ─── decodeTokenUnsafe ───────────────────────────────────────────────────────

describe('decodeTokenUnsafe', () => {
  it('decodes a valid JWT payload without verification', async () => {
    const token = await makeToken(
      { sub: 'user-456', email: 'unsafe@example.com' },
      WRONG_SECRET, // wrong secret — but decode should still work
    );
    const payload = decodeTokenUnsafe(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-456');
    expect(payload!.email).toBe('unsafe@example.com');
  });

  it('returns null for malformed input', () => {
    expect(decodeTokenUnsafe('')).toBeNull();
    expect(decodeTokenUnsafe('one.two')).toBeNull();
    expect(decodeTokenUnsafe('not-a-jwt')).toBeNull();
  });

  it('returns null when payload is not valid JSON', () => {
    const fakeToken = 'header.' + Buffer.from('not-json').toString('base64url') + '.sig';
    expect(decodeTokenUnsafe(fakeToken)).toBeNull();
  });
});

// ─── isTokenExpired ──────────────────────────────────────────────────────────

describe('isTokenExpired', () => {
  it('returns false for a token that is not expired', () => {
    const payload = { exp: Math.floor(Date.now() / 1000) + 3600 };
    expect(isTokenExpired(payload)).toBe(false);
  });

  it('returns true for a token that is expired', () => {
    const payload = { exp: Math.floor(Date.now() / 1000) - 60 };
    expect(isTokenExpired(payload)).toBe(true);
  });

  it('returns false if no exp claim exists', () => {
    expect(isTokenExpired({})).toBe(false);
  });
});

// ─── createToken ─────────────────────────────────────────────────────────────

describe('createToken', () => {
  it('creates a token that can be verified', async () => {
    const token = await createToken({
      sub: 'user-789',
      email: 'creator@example.com',
    });
    expect(typeof token).toBe('string');

    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.sub).toBe('user-789');
    expect(payload!.email).toBe('creator@example.com');
  });

  it('respects custom expiry', async () => {
    const token = await createToken(
      { sub: 'user-exp', email: 'exp@example.com' },
      '0s',
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(await verifyToken(token)).toBeNull();
  });
});

// ─── requireUser ─────────────────────────────────────────────────────────────

describe('requireUser', () => {
  it('returns authorized: true for a valid token', async () => {
    const token = await createToken({
      sub: 'user-guard',
      email: 'guard@example.com',
    });
    const result = await requireUser(token);
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.user.sub).toBe('user-guard');
      expect(result.user.email).toBe('guard@example.com');
    }
  });

  it('returns 401 for null token', async () => {
    const result = await requireUser(null);
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns 401 for undefined token', async () => {
    const result = await requireUser(undefined);
    expect(result.authorized).toBe(false);
  });

  it('returns 401 for an invalid/tampered token', async () => {
    const result = await requireUser('forged.token.here');
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
      const body = await result.response.json();
      expect(body.error).toContain('Invalid');
    }
  });

  it('returns 401 for an expired token', async () => {
    const token = await createToken(
      { sub: 'user-expired', email: 'expired@example.com' },
      '0s',
    );
    await new Promise((r) => setTimeout(r, 50));
    const result = await requireUser(token);
    expect(result.authorized).toBe(false);
  });
});
