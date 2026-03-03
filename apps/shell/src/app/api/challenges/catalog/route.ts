import { NextResponse } from 'next/server';
import { CHALLENGE_CATALOG, CATEGORY_INFO } from '@/lib/catalog';

/**
 * GET /api/challenges/catalog
 * Returns the full challenge catalog grouped by category.
 */
export async function GET() {
  return NextResponse.json({
    challenges: CHALLENGE_CATALOG,
    categories: CATEGORY_INFO,
  });
}
