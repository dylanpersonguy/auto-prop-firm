import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock fetch globally ──
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ── Mock cookies ──
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

// Import after mocks are set
import { createToken } from '@/lib/jwt';

beforeEach(() => {
  mockFetch.mockReset();
  mockCookieStore.clear();
});

// ─── Auth Login Proxy ────────────────────────────────────────────────────────

describe('POST /api/auth/login logic', () => {
  it('should proxy login to PropSim and set cookies on success', async () => {
    const accessToken = await createToken({
      sub: 'user-1',
      email: 'test@example.com',
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          accessToken,
          refreshToken: 'refresh-xyz',
          user: { id: 'user-1', email: 'test@example.com', firstName: 'Test' },
        },
      }),
    });

    // Import the route handler
    const { POST } = await import('@/app/api/auth/login/route');
    const req = {
      json: async () => ({ email: 'test@example.com', password: 'TestPass123!' }),
    } as any;

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Logged in');
    expect(body.user.email).toBe('test@example.com');

    // Verify cookies were set
    expect(mockCookieStore.get('propsim_access_token')).toBe(accessToken);
    expect(mockCookieStore.get('propsim_refresh_token')).toBe('refresh-xyz');
  });

  it('should return error when PropSim rejects login', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    const { POST } = await import('@/app/api/auth/login/route');
    const req = {
      json: async () => ({ email: 'bad@example.com', password: 'wrong' }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid');
  });

  it('should return 502 when PropSim returns tokens without accessToken', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { refreshToken: 'only-refresh' } }),
    });

    const { POST } = await import('@/app/api/auth/login/route');
    const req = {
      json: async () => ({ email: 'test@example.com', password: 'pass' }),
    } as any;

    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});

// ─── Auth Me ─────────────────────────────────────────────────────────────────

describe('GET /api/auth/me logic', () => {
  it('should return user data for a valid token cookie', async () => {
    const token = await createToken({
      sub: 'user-me',
      email: 'me@example.com',
      roles: ['TRADER'],
      firmId: 'firm-1',
    });
    mockCookieStore.set('propsim_access_token', token);

    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(body.user.id).toBe('user-me');
    expect(body.user.email).toBe('me@example.com');
    expect(body.user.roles).toEqual(['TRADER']);
    expect(body.user.firmId).toBe('firm-1');
  });

  it('should return 401 when no cookie is set', async () => {
    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
  });

  it('should return 401 for an expired token', async () => {
    const token = await createToken(
      { sub: 'user-exp', email: 'expired@example.com' },
      '0s',
    );
    await new Promise((r) => setTimeout(r, 50));
    mockCookieStore.set('propsim_access_token', token);

    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('should return 401 for a tampered token', async () => {
    mockCookieStore.set('propsim_access_token', 'invalid.token.here');

    const { GET } = await import('@/app/api/auth/me/route');
    const res = await GET();
    expect(res.status).toBe(401);
  });
});

// ─── Auth Refresh ────────────────────────────────────────────────────────────

describe('POST /api/auth/refresh logic', () => {
  it('should refresh tokens when refresh token exists', async () => {
    const newAccess = await createToken({
      sub: 'user-ref',
      email: 'ref@example.com',
    });
    mockCookieStore.set('propsim_refresh_token', 'old-refresh');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: newAccess,
        refreshToken: 'new-refresh',
      }),
    });

    const { POST } = await import('@/app/api/auth/refresh/route');
    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Refreshed');
    expect(mockCookieStore.get('propsim_access_token')).toBe(newAccess);
    expect(mockCookieStore.get('propsim_refresh_token')).toBe('new-refresh');
  });

  it('should return 401 when no refresh token', async () => {
    const { POST } = await import('@/app/api/auth/refresh/route');
    const res = await POST();
    expect(res.status).toBe(401);
  });
});

// ─── Auth Logout ─────────────────────────────────────────────────────────────

describe('POST /api/auth/logout logic', () => {
  it('should clear cookies', async () => {
    mockCookieStore.set('propsim_access_token', 'some-token');
    mockCookieStore.set('propsim_refresh_token', 'some-refresh');

    // Mock the PropSim logout call (best-effort)
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    const { POST } = await import('@/app/api/auth/logout/route');
    const res = await POST();
    const body = await res.json();

    expect(body.message).toBe('Logged out');
    expect(mockCookieStore.has('propsim_access_token')).toBe(false);
    expect(mockCookieStore.has('propsim_refresh_token')).toBe(false);
  });
});
