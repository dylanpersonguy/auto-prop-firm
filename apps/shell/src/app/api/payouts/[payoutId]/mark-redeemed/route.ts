import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { Connection } from '@solana/web3.js';
import { env } from '@/lib/env';

const MarkRedeemedBody = z.object({
  txSig: z.string().min(64).max(128),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { payoutId: string } },
) {
  try {
    const body = await req.json();
    const parsed = MarkRedeemedBody.parse(body);
    const { txSig } = parsed;
    const { payoutId } = params;

    // Find the claim
    const claim = await prisma.payoutClaim.findUnique({
      where: { payoutId },
    });

    if (!claim) {
      return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    }

    if (claim.status === 'REDEEMED') {
      return NextResponse.json({ message: 'Already redeemed', txSig: claim.redeemedTxSig });
    }

    // Basic on-chain verification: check that the tx succeeded
    const connection = new Connection(env.solanaRpcUrl);
    const tx = await connection.getTransaction(txSig, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.meta?.err) {
      return NextResponse.json({ error: 'Transaction failed on-chain' }, { status: 400 });
    }

    // Verify the tx includes an instruction to our vault program
    const programIdIndex = tx.transaction.message.staticAccountKeys?.findIndex(
      (key) => key.toBase58() === env.vaultProgramId,
    );
    if (programIdIndex === undefined || programIdIndex < 0) {
      return NextResponse.json(
        { error: 'Transaction does not include vault program' },
        { status: 400 },
      );
    }

    // Mark as redeemed
    await prisma.payoutClaim.update({
      where: { payoutId },
      data: {
        status: 'REDEEMED',
        redeemedTxSig: txSig,
        redeemedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Claim marked as redeemed', txSig });
  } catch (error) {
    console.error('Mark redeemed error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
