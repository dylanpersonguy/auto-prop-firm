import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/deposits?page=1&limit=20&sku=starter-50k
 * List all deposit receipts with pagination and optional SKU filter.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)));
    const sku = req.nextUrl.searchParams.get('sku') || '';
    const skip = (page - 1) * limit;

    const where = sku ? { sku } : {};

    const [deposits, total] = await Promise.all([
      prisma.depositReceipt.findMany({
        where,
        orderBy: { verifiedAt: 'desc' },
        skip,
        take: limit,
        include: {
          commission: {
            select: { commissionAmount: true, referrerId: true },
          },
        },
      }),
      prisma.depositReceipt.count({ where }),
    ]);

    return NextResponse.json({
      deposits,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin deposits error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
