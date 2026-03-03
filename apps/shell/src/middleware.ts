import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { rateLimit, rateLimitCategory, getClientId } from '@/lib/rate-limit';

const JWT_SECRET = new TextEncoder().encode(
  process.env.PROPSIM_SHELL_JWT_SECRET || 'changeme_local_dev',
);

const REFRESH_COOKIE = 'propsim_refresh_token';
const ACCESS_COOKIE = 'propsim_access_token';
const PROPSIM_BASE = process.env.PROPSIM_BASE_URL || 'http://localhost:3000';

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
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Pure static / framework paths — skip everything
  if (pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // ── Rate limiting (applies to ALL non-static paths, including public) ──
  const clientId = getClientId(req);
  const rlConfig = rateLimitCategory(pathname);
  const rl = rateLimit(`${clientId}:${pathname.split('/').slice(0, 4).join('/')}`, rlConfig);

  if (!rl.allowed) {
    const retryAfter = Math.ceil(rl.resetMs / 1000);
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }
    return new NextResponse('Too many requests. Please try again shortly.', {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  // ── Public paths — rate-limited but no auth required ──
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  // Check for auth cookie
  const token = req.cookies.get('propsim_access_token')?.value;

  if (!token) {
    // API routes: return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    // Pages: redirect to login
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — verify signature + expiry
  try {
    await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return NextResponse.next();
  } catch (err: any) {
    const isExpired = err?.code === 'ERR_JWT_EXPIRED';

    // If expired, try silent refresh before giving up
    if (isExpired) {
      const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${PROPSIM_BASE}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            const tokens = data?.data ?? data;
            if (tokens.accessToken && tokens.refreshToken) {
              const response = NextResponse.next();
              const secure = process.env.NODE_ENV === 'production';

              response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
                httpOnly: true,
                secure,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60,
              });
              response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
                httpOnly: true,
                secure,
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 30,
              });
              return response;
            }
          }
        } catch {
          // Refresh failed — fall through to redirect
        }
      }

      // Expired and refresh failed
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('expired', '1');
      return NextResponse.redirect(loginUrl);
    }

    // Invalid signature, malformed, or tampered — reject
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
