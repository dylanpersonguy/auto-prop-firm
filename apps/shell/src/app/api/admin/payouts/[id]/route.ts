import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';
import { z } from 'zod';

/**
 * PATCH /api/admin/payouts/[id]
 * Update payout claim status (e.g., mark EXPIRED).
 */
const UpdateBody = z.object({
  status: z.enum(['ISSUED', 'REDEEMED', 'EXPIRED']),
  redeemedTxSig: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const { status, redeemedTxSig } = UpdateBody.parse(body);

    const payout = await prisma.payoutClaim.update({
      where: { id: params.id },
      data: {
        status,
        ...(redeemedTxSig ? { redeemedTxSig } : {}),
        ...(status === 'REDEEMED' ? { redeemedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(payout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin payout update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
