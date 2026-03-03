import { NextRequest, NextResponse } from 'next/server';

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

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();
  // Static files
  if (pathname.includes('.')) return NextResponse.next();

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

  // Token exists — optionally check expiry (quick decode, no verification)
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'),
    );
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      // Token expired — try refresh via API, or redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 });
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      loginUrl.searchParams.set('expired', '1');
      return NextResponse.redirect(loginUrl);
    }
  } catch {
    // Can't decode — let the API/page handle it
  }

  return NextResponse.next();
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
