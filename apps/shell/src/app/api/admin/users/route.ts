import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/users?page=1&limit=20&search=email
 * List all users with pagination and optional search.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)));
    const search = req.nextUrl.searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const where = search
      ? { email: { contains: search } }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          referralCode: true,
          referredById: true,
          commissionBalanceLamports: true,
          createdAt: true,
          _count: {
            select: {
              referrals: true,
              commissionsEarned: true,
              withdrawals: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
