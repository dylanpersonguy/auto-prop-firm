import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { buildReferralLink } from '@/lib/referral';
import { getAuthUserId } from '@/lib/jwt';

/**
 * GET /api/referral/me
 * Returns the current user's referral code, link, balances, and referral count.
 * userId is derived from the verified JWT.
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user from JWT
    const authResult = await getAuthUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: { select: { referrals: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Sum all commissions earned (for lifetime total) — raw SQL since commissionAmount is String
    const commSum = (await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(CAST(commissionAmount AS INTEGER)), 0) as total FROM ReferralCommission WHERE referrerId = ?`,
      userId,
    )) as { total: number | null }[];

    // Sum all withdrawals
    const withdrawSum = (await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(CAST(amountBaseUnits AS INTEGER)), 0) as total FROM ReferralWithdrawal WHERE userId = ?`,
      userId,
    )) as { total: number | null }[];

    const lifetimeEarned = BigInt(commSum[0]?.total ?? 0);
    const totalWithdrawn = BigInt(withdrawSum[0]?.total ?? 0);
    const currentBalance = BigInt(user.commissionBalanceLamports);

    const baseUrl = req.nextUrl.origin;

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink: buildReferralLink(user.referralCode, baseUrl),
      currentBalanceBaseUnits: currentBalance.toString(),
      lifetimeEarnedBaseUnits: lifetimeEarned.toString(),
      totalWithdrawnBaseUnits: totalWithdrawn.toString(),
      referralCount: user._count.referrals,
    });
  } catch (error) {
    console.error('Referral me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
