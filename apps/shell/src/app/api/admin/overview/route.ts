import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/overview
 * Dashboard overview: key metrics for the entire prop firm.
 */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const [
      totalUsers,
      totalDeposits,
      totalPayoutClaims,
      payoutsByStatus,
      totalReferralCommissions,
      totalReferralWithdrawals,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.depositReceipt.count(),
      prisma.payoutClaim.count(),
      prisma.payoutClaim.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.referralCommission.count(),
      prisma.referralWithdrawal.count(),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, role: true, createdAt: true },
      }),
    ]);

    // Revenue: sum of all deposit amounts
    const revenueResult = (await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(CAST(amountBaseUnits AS INTEGER)), 0) as total FROM DepositReceipt`,
    )) as { total: number | null }[];
    const totalRevenueBaseUnits = BigInt(revenueResult[0]?.total ?? 0);

    // Payouts issued: sum of all payout claim amounts
    const payoutsResult = (await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(CAST(amountBaseUnits AS INTEGER)), 0) as total FROM PayoutClaim`,
    )) as { total: number | null }[];
    const totalPayoutsBaseUnits = BigInt(payoutsResult[0]?.total ?? 0);

    // Commissions owed
    const commissionsResult = (await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(CAST(commissionAmount AS INTEGER)), 0) as total FROM ReferralCommission`,
    )) as { total: number | null }[];
    const totalCommissionsBaseUnits = BigInt(commissionsResult[0]?.total ?? 0);

    // Deposits by SKU
    const depositsBySku = await prisma.depositReceipt.groupBy({
      by: ['sku'],
      _count: true,
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        recent: recentUsers,
      },
      revenue: {
        totalDeposits,
        totalRevenueUsdc: (Number(totalRevenueBaseUnits) / 1_000_000).toFixed(2),
        totalRevenueBaseUnits: totalRevenueBaseUnits.toString(),
        depositsBySku: depositsBySku.map((d: any) => ({ sku: d.sku, count: d._count })),
      },
      payouts: {
        totalClaims: totalPayoutClaims,
        totalPayoutsUsdc: (Number(totalPayoutsBaseUnits) / 1_000_000).toFixed(2),
        totalPayoutsBaseUnits: totalPayoutsBaseUnits.toString(),
        byStatus: payoutsByStatus.reduce((acc: Record<string, number>, p: any) => {
          acc[p.status] = p._count;
          return acc;
        }, {} as Record<string, number>),
      },
      referrals: {
        totalCommissions: totalReferralCommissions,
        totalCommissionsUsdc: (Number(totalCommissionsBaseUnits) / 1_000_000).toFixed(2),
        totalWithdrawals: totalReferralWithdrawals,
      },
      netRevenue: {
        usdc: (Number(totalRevenueBaseUnits - totalPayoutsBaseUnits - totalCommissionsBaseUnits) / 1_000_000).toFixed(2),
      },
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
