import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { issueClaim } from '@/lib/claim-signer';
import { MIN_WITHDRAWAL_BASE_UNITS } from '@/lib/referral';

const WithdrawBody = z.object({
  userId: z.string().min(1),
  wallet: z.string().min(32).max(44),
});

/**
 * POST /api/referral/withdraw
 * Issue a signed vault claim for the user's referral commission balance.
 * Min withdrawal: 50 USDC. Debits the full balance atomically.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, wallet } = WithdrawBody.parse(body);

    // 1) Fetch user & check balance
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const balance = BigInt(user.commissionBalanceLamports);
    if (balance < MIN_WITHDRAWAL_BASE_UNITS) {
      return NextResponse.json(
        {
          error: `Minimum withdrawal is 50 USDC. Current balance: ${(Number(balance) / 1_000_000).toFixed(2)} USDC`,
        },
        { status: 400 },
      );
    }

    // 2) Atomically debit balance AND create withdrawal + claim in a transaction
    const withdrawalId = `ref-withdraw-${userId}-${Date.now()}`;

    const claim = issueClaim({
      payoutId: withdrawalId,
      accountId: `referral-${userId}`,
      wallet,
      amount: balance,
    });

    const [withdrawal] = await prisma.$transaction([
      prisma.referralWithdrawal.create({
        data: {
          userId,
          amountBaseUnits: balance.toString(),
          wallet,
          claimId: claim.claimIdHex,
          messageB64: claim.messageB64,
          signatureB64: claim.signatureB64,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { commissionBalanceLamports: '0' },
      }),
    ]);

    return NextResponse.json(
      {
        message: 'Withdrawal claim issued',
        withdrawalId: withdrawal.id,
        amountBaseUnits: balance.toString(),
        amountUsdc: (Number(balance) / 1_000_000).toFixed(2),
        claim: {
          messageB64: claim.messageB64,
          signatureB64: claim.signatureB64,
          claimIdHex: claim.claimIdHex,
          signerPubkeyB64: claim.signerPubkeyB64,
          claimFields: {
            ...claim.claimFields,
            // Serialize bigints & PublicKeys for JSON
            amount: claim.claimFields.amount.toString(),
            validAfter: claim.claimFields.validAfter.toString(),
            validBefore: claim.claimFields.validBefore.toString(),
            dailyCap: claim.claimFields.dailyCap.toString(),
            programId: claim.claimFields.programId.toBase58(),
            config: claim.claimFields.config.toBase58(),
            user: claim.claimFields.user.toBase58(),
            usdcMint: claim.claimFields.usdcMint.toBase58(),
            domain: Buffer.from(claim.claimFields.domain).toString('hex'),
            claimId: Buffer.from(claim.claimFields.claimId).toString('hex'),
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Referral withdraw error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
