import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/payouts?page=1&limit=20&status=ISSUED
 * List all payout claims with pagination and optional status filter.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)));
    const status = req.nextUrl.searchParams.get('status') || '';
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [payouts, total] = await Promise.all([
      prisma.payoutClaim.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payoutClaim.count({ where }),
    ]);

    return NextResponse.json({
      payouts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin payouts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
