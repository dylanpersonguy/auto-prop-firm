import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/referral/stats
 * Admin-only: aggregate referral program metrics.
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    // String-typed BigInt fields can't use Prisma aggregate, so use raw SQL for sums
    const [
      totalUsers,
      usersWithReferrer,
      totalCommissions,
      totalWithdrawals,
      topReferrers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { referredById: { not: null } } }),
      prisma.referralCommission.count(),
      prisma.referralWithdrawal.count(),
      // Top 10 referrers by referral count
      prisma.user.findMany({
        where: { referrals: { some: {} } },
        select: {
          id: true,
          email: true,
          referralCode: true,
          commissionBalanceLamports: true,
          _count: { select: { referrals: true, commissionsEarned: true } },
        },
        orderBy: { referrals: { _count: 'desc' } },
        take: 10,
      }),
    ]);

    // Raw SQL sums for string-encoded BigInt fields
    const commSum = (await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(CAST(commissionAmount AS INTEGER)), 0) as total FROM ReferralCommission`,
    )) as { total: number | null }[];
    const withdrawSum = (await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(CAST(amountBaseUnits AS INTEGER)), 0) as total FROM ReferralWithdrawal`,
    )) as { total: number | null }[];

    const totalCommissionAmount = BigInt(commSum[0]?.total ?? 0);
    const totalWithdrawnAmount = BigInt(withdrawSum[0]?.total ?? 0);

    return NextResponse.json({
      totalUsers,
      usersWithReferrer,
      referralConversionRate: totalUsers > 0 ? (usersWithReferrer / totalUsers * 100).toFixed(1) + '%' : '0%',
      totalCommissions,
      totalCommissionAmountBaseUnits: totalCommissionAmount.toString(),
      totalWithdrawals,
      totalWithdrawnAmountBaseUnits: totalWithdrawnAmount.toString(),
      outstandingBalanceBaseUnits: (totalCommissionAmount - totalWithdrawnAmount).toString(),
      topReferrers: topReferrers.map((u: any) => ({
        email: u.email,
        referralCode: u.referralCode,
        referralCount: u._count.referrals,
        commissionsEarned: u._count.commissionsEarned,
        currentBalanceBaseUnits: u.commissionBalanceLamports,
      })),
    });
  } catch (error) {
    console.error('Admin referral stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
