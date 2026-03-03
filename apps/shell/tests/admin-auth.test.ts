import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock cookies
const mockCookieStore = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: () => ({
    get: (name: string) => {
      const val = mockCookieStore.get(name);
      return val ? { value: val } : undefined;
    },
    set: (name: string, value: string, _opts?: any) => {
      mockCookieStore.set(name, value);
    },
    delete: (name: string) => {
      mockCookieStore.delete(name);
    },
  }),
}));

import {
  createAdminToken,
  verifyAdminToken,
  setAdminCookie,
  clearAdminCookie,
  getAdminToken,
  requireAdmin,
} from '@/lib/admin-auth';

beforeEach(() => {
  mockCookieStore.clear();
});

// ─── createAdminToken / verifyAdminToken ─────────────────────────────────────

describe('Admin JWT signing and verification', () => {
  it('creates a valid admin token that can be verified', async () => {
    const token = await createAdminToken('admin@test.com', 'admin-1');
    expect(typeof token).toBe('string');

    const claims = await verifyAdminToken(token);
    expect(claims).not.toBeNull();
    expect(claims!.email).toBe('admin@test.com');
    expect(claims!.userId).toBe('admin-1');
    expect(claims!.role).toBe('ADMIN');
  });

  it('rejects token without ADMIN role', async () => {
    // We can't easily create a token with wrong role using createAdminToken,
    // so we verify that verifyAdminToken checks the role field
    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode('test_admin_secret');
    const token = await new SignJWT({ email: 'user@test.com', userId: 'u-1', role: 'USER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(secret);

    const claims = await verifyAdminToken(token);
    expect(claims).toBeNull();
  });

  it('rejects a completely invalid token', async () => {
    const claims = await verifyAdminToken('garbage');
    expect(claims).toBeNull();
  });
});

// ─── Cookie helpers ──────────────────────────────────────────────────────────

describe('Admin cookie management', () => {
  it('setAdminCookie sets the token', () => {
    setAdminCookie('test-admin-jwt');
    expect(mockCookieStore.get('admin_token')).toBe('test-admin-jwt');
  });

  it('getAdminToken retrieves the correct cookie', () => {
    mockCookieStore.set('admin_token', 'my-token');
    expect(getAdminToken()).toBe('my-token');
  });

  it('getAdminToken returns null when no cookie', () => {
    expect(getAdminToken()).toBeNull();
  });

  it('clearAdminCookie removes the cookie', () => {
    mockCookieStore.set('admin_token', 'will-be-cleared');
    clearAdminCookie();
    expect(mockCookieStore.has('admin_token')).toBe(false);
  });
});

// ─── requireAdmin guard ──────────────────────────────────────────────────────

describe('requireAdmin', () => {
  it('returns authorized: true with valid admin token', async () => {
    const token = await createAdminToken('admin@test.com', 'admin-1');
    mockCookieStore.set('admin_token', token);

    const result = await requireAdmin();
    expect(result.authorized).toBe(true);
    if (result.authorized) {
      expect(result.admin.email).toBe('admin@test.com');
      expect(result.admin.userId).toBe('admin-1');
    }
  });

  it('returns 401 when no admin cookie', async () => {
    const result = await requireAdmin();
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
    }
  });

  it('returns 401 for expired/invalid admin token', async () => {
    mockCookieStore.set('admin_token', 'invalid-token');

    const result = await requireAdmin();
    expect(result.authorized).toBe(false);
    if (!result.authorized) {
      expect(result.response.status).toBe(401);
    }
  });
});
