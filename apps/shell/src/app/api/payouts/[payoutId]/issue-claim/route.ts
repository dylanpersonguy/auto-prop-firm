import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { propsimFetch } from '@/lib/propsim';
import { issueClaim, getSignerPublicKey } from '@/lib/claim-signer';
import { env } from '@/lib/env';
import { prisma } from '@/lib/db';
import { PublicKey } from '@solana/web3.js';
import { calculatePayoutSplit, formatUsdc } from '@/lib/fees';
import { recordFirmFee } from '@/lib/fee-recorder';

const IssueClaimBody = z.object({
  walletPubkey: z.string().min(32).max(44),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { payoutId: string } },
) {
  try {
    const body = await req.json();
    const parsed = IssueClaimBody.parse(body);
    const { walletPubkey } = parsed;
    const { payoutId } = params;

    // Validate wallet is a valid pubkey
    try {
      new PublicKey(walletPubkey);
    } catch {
      return NextResponse.json({ error: 'Invalid wallet pubkey' }, { status: 400 });
    }

    // 1) Fetch all payouts and find this one
    const payoutsRes = await propsimFetch('/api/accounts/payouts/all');
    if (!payoutsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 502 });
    }
    const payouts = await payoutsRes.json();
    const payout = (Array.isArray(payouts) ? payouts : []).find(
      (p: any) => p.id === payoutId,
    );

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    // 2) Ensure payout is APPROVED
    if (payout.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Payout status is ${payout.status}, must be APPROVED` },
        { status: 400 },
      );
    }

    // 3) Check if claim already exists for this payoutId
    const existing = await prisma.payoutClaim.findUnique({
      where: { payoutId },
    });
    if (existing) {
      // Return existing claim (idempotent)
      return NextResponse.json({
        claimId: existing.claimId,
        messageB64: existing.messageB64,
        signatureB64: existing.signatureB64,
        propsimSignerPubkey: Buffer.from(getSignerPublicKey()).toString('base64'),
        programId: env.vaultProgramId,
        configPda: env.vaultConfigPda,
        vaultUsdcTokenAccount: env.vaultUsdcTokenAccount,
        usdcMint: env.usdcMint,
        status: existing.status,
      });
    }

    // 4) Calculate eligible amount
    const calcRes = await propsimFetch(
      `/api/accounts/${payout.accountId}/payout/calculate`,
    );
    let amountUsdc = payout.amount;
    if (calcRes.ok) {
      const calcData = await calcRes.json();
      amountUsdc = calcData.payoutAmount || calcData.eligibleAmount || payout.amount;
    }

    // Convert to base units (USDC has 6 decimals)
    const amountBaseUnits = BigInt(Math.floor(amountUsdc * 1_000_000));

    // Cap to daily limit
    const dailyCapBase = BigInt(env.dailyCapUsdc * 1_000_000);
    const finalAmount = amountBaseUnits > dailyCapBase ? dailyCapBase : amountBaseUnits;

    // 4b) Deduct payout split (firm keeps 10% of trader payout)
    const payoutSplitAmount = calculatePayoutSplit(finalAmount);
    const traderReceives = finalAmount - payoutSplitAmount;

    // 5) Issue the signed claim (for the reduced amount after firm split)
    const claim = issueClaim({
      payoutId,
      accountId: payout.accountId,
      wallet: walletPubkey,
      amount: traderReceives,
    });

    // 6) Save to DB
    const payoutRecord = await prisma.payoutClaim.create({
      data: {
        payoutId,
        accountId: payout.accountId,
        userId: payout.userId || 'unknown',
        wallet: walletPubkey,
        claimId: claim.claimIdHex,
        messageB64: claim.messageB64,
        signatureB64: claim.signatureB64,
        amountBaseUnits: traderReceives.toString(),
        status: 'ISSUED',
      },
    });

    // 6b) Record payout split fee
    await recordFirmFee({
      category: 'PAYOUT_SPLIT',
      amountBaseUnits: payoutSplitAmount,
      sourceType: 'PAYOUT',
      sourceId: payoutRecord.id,
      payoutClaimId: payoutRecord.id,
      description: `10% payout split on ${formatUsdc(finalAmount)} USDC payout for account ${payout.accountId}`,
    });

    // 7) Return claim data for client to build the Solana tx
    return NextResponse.json({
      claimId: claim.claimIdHex,
      claimFields: {
        version: claim.claimFields.version,
        domain: Array.from(claim.claimFields.domain),
        programId: claim.claimFields.programId.toBase58(),
        config: claim.claimFields.config.toBase58(),
        claimId: Array.from(claim.claimFields.claimId),
        user: claim.claimFields.user.toBase58(),
        usdcMint: claim.claimFields.usdcMint.toBase58(),
        amount: finalAmount.toString(),
        validAfter: claim.claimFields.validAfter.toString(),
        validBefore: claim.claimFields.validBefore.toString(),
        dayId: claim.claimFields.dayId,
        dailyCap: claim.claimFields.dailyCap.toString(),
      },
      messageB64: claim.messageB64,
      signatureB64: claim.signatureB64,
      propsimSignerPubkey: claim.signerPubkeyB64,
      programId: env.vaultProgramId,
      configPda: env.vaultConfigPda,
      vaultUsdcTokenAccount: env.vaultUsdcTokenAccount,
      usdcMint: env.usdcMint,
    });
  } catch (error) {
    console.error('Issue claim error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
