import { NextResponse } from 'next/server';
import { z } from 'zod';

// ── Standard API response shapes ──

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

/**
 * Return a consistent success response.
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data } satisfies ApiSuccessResponse<T>, { status });
}

/**
 * Return a consistent error response.
 */
export function apiError(message: string, status = 500, details?: unknown) {
  const body: ApiErrorResponse = { success: false, error: message };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, { status });
}

/** 400 Bad Request */
export function apiBadRequest(message = 'Bad request', details?: unknown) {
  return apiError(message, 400, details);
}

/** 401 Unauthorized */
export function apiUnauthorized(message = 'Authentication required') {
  return apiError(message, 401);
}

/** 404 Not Found */
export function apiNotFound(message = 'Not found') {
  return apiError(message, 404);
}

/** 502 Bad Gateway (upstream failure) */
export function apiUpstreamError(message = 'Upstream service unavailable') {
  return apiError(message, 502);
}

/**
 * Higher-order function that wraps a route handler with standard
 * error handling: catches ZodErrors (→ 400) and unknown errors (→ 500).
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return apiBadRequest('Validation error', err.errors);
      }
      console.error('[API Error]', err);
      return apiError('Internal server error', 500);
    }
  }) as T;
}

/**
 * Proxy a GET request to PropSim API, returning proper errors instead
 * of silently falling back to empty arrays.
 *
 * Falls back to `fallback` (default: []) if PropSim is unreachable,
 * but returns proper 5xx if PropSim returns an error.
 */
export async function proxyPropSimGet(
  propsimFetch: (path: string) => Promise<Response>,
  path: string,
  { fallback = [] as unknown }: { fallback?: unknown } = {},
) {
  try {
    const res = await propsimFetch(path);
    if (res.ok) {
      return NextResponse.json(await res.json());
    }
    // PropSim returned an error — propagate with upstream body
    const text = await res.text().catch(() => 'Unknown error');
    console.error(`PropSim ${path} returned ${res.status}: ${text}`);
    // Try to parse JSON error body; fall back to statusText
    let errorMessage = res.statusText;
    try {
      const errorJson = JSON.parse(text);
      errorMessage = errorJson?.error?.message ?? errorJson?.message ?? errorJson?.error ?? res.statusText;
    } catch { /* not JSON, use statusText */ }
    return apiError(`Upstream error: ${errorMessage}`, res.status >= 500 ? 502 : res.status);
  } catch (err) {
    // PropSim completely unreachable — use fallback for reads
    console.warn(`PropSim unreachable for ${path}, using fallback`);
    return NextResponse.json(fallback);
  }
}
