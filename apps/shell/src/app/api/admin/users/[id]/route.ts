import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { z } from 'zod';

/**
 * GET /api/admin/users/[id] — get user detail
 * PATCH /api/admin/users/[id] — update user role
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        referredBy: { select: { email: true, referralCode: true } },
        _count: { select: { referrals: true, commissionsEarned: true, withdrawals: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's deposits
    const deposits = await prisma.depositReceipt.findMany({
      where: { userId: user.id },
      orderBy: { verifiedAt: 'desc' },
      take: 20,
    });

    // Get user's payout claims
    const payoutClaims = await prisma.payoutClaim.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ user, deposits, payoutClaims });
  } catch (error) {
    console.error('Admin user detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const UpdateBody = z.object({
  role: z.enum(['USER', 'ADMIN']).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { role } = UpdateBody.parse(body);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: { ...(role ? { role } : {}) },
      select: { id: true, email: true, role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
