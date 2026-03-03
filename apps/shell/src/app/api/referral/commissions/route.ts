import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/referral/commissions?userId=X&page=1&limit=20
 * Returns a paginated ledger of commissions earned.
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const [commissions, total] = await Promise.all([
      prisma.referralCommission.findMany({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          referredUser: { select: { email: true } },
          depositReceipt: { select: { sku: true, txSig: true } },
        },
      }),
      prisma.referralCommission.count({ where: { referrerId: userId } }),
    ]);

    return NextResponse.json({
      commissions: commissions.map((c) => ({
        id: c.id,
        referredEmail: c.referredUser.email,
        sku: c.depositReceipt.sku,
        depositTxSig: c.depositReceipt.txSig,
        depositAmount: c.depositAmount,
        commissionAmount: c.commissionAmount,
        createdAt: c.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Referral commissions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
