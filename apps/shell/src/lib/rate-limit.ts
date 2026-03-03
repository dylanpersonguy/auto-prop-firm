/**
 * In-memory sliding-window rate limiter.
 *
 * Works for single-instance deploys (next start, Docker).
 * For multi-instance / edge, swap the store for Upstash Redis.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  /** Max requests in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
}

/** Named presets for different route categories */
export const RATE_LIMITS = {
  /** Auth endpoints (login, register) — strict to prevent brute-force */
  auth: { limit: 10, windowSeconds: 60 } as RateLimitConfig,
  /** Order placement — moderate */
  trading: { limit: 60, windowSeconds: 60 } as RateLimitConfig,
  /** General API reads */
  api: { limit: 120, windowSeconds: 60 } as RateLimitConfig,
  /** Public pages / static */
  page: { limit: 60, windowSeconds: 60 } as RateLimitConfig,
} as const;

const store = new Map<string, RateLimitEntry>();

// Evict stale entries every 60 s to prevent unbounded growth
const EVICT_INTERVAL_MS = 60_000;
let lastEvict = Date.now();

function evictStale() {
  const now = Date.now();
  if (now - lastEvict < EVICT_INTERVAL_MS) return;
  lastEvict = now;
  // Use a conservative 2-minute threshold to cover any window size
  const maxAge = 120_000;
  for (const [key, entry] of store) {
    if (now - entry.lastRefill > maxAge) {
      store.delete(key);
    }
  }
}

/**
 * Check + consume a rate-limit token.
 *
 * Returns `{ allowed, remaining, resetMs }`.
 */
export function rateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; limit: number; resetMs: number } {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  evictStale();

  let entry = store.get(key);
  if (!entry) {
    entry = { tokens: config.limit, lastRefill: now };
    store.set(key, entry);
  }

  // Refill tokens proportionally to elapsed time (token-bucket style)
  const elapsed = now - entry.lastRefill;
  const refill = (elapsed / windowMs) * config.limit;
  entry.tokens = Math.min(config.limit, entry.tokens + refill);
  entry.lastRefill = now;

  if (entry.tokens < 1) {
    const resetMs = Math.ceil(((1 - entry.tokens) / config.limit) * windowMs);
    return { allowed: false, remaining: 0, limit: config.limit, resetMs };
  }

  entry.tokens -= 1;
  return {
    allowed: true,
    remaining: Math.floor(entry.tokens),
    limit: config.limit,
    resetMs: 0,
  };
}

/**
 * Determine which rate-limit bucket a path belongs to.
 */
export function rateLimitCategory(pathname: string): RateLimitConfig {
  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register')
  ) {
    return RATE_LIMITS.auth;
  }
  if (
    pathname.startsWith('/api/trading/orders') ||
    pathname.startsWith('/api/trading/positions')
  ) {
    return RATE_LIMITS.trading;
  }
  if (pathname.startsWith('/api/')) {
    return RATE_LIMITS.api;
  }
  return RATE_LIMITS.page;
}

/**
 * Extract a client identifier from the request (IP or fallback).
 */
export function getClientId(req: {
  ip?: string | null;
  headers: { get: (name: string) => string | null };
}): string {
  return (
    req.ip ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
