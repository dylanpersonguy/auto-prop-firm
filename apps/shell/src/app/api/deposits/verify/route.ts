import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { prisma } from '@/lib/db';
import { propsimFetch } from '@/lib/propsim';
import { env } from '@/lib/env';
import { getCatalogItem } from '@/lib/catalog';
import { verifyUsdcTransfer } from '@/lib/solana';
import { calculateCommission } from '@/lib/referral';
import { calculateChallengeFees } from '@/lib/fees';
import { recordFirmFees } from '@/lib/fee-recorder';

const VerifyDepositBody = z.object({
  sku: z.string(),
  depositorWallet: z.string().min(32).max(44),
  txSig: z.string().min(64).max(128),
  userId: z.string().min(1), // local User.id
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = VerifyDepositBody.parse(body);
    const { sku, depositorWallet, txSig, userId } = parsed;

    // 1) Look up catalog item
    const item = getCatalogItem(sku);
    if (!item) {
      return NextResponse.json({ error: `Unknown SKU: ${sku}` }, { status: 400 });
    }

    // 2) Check for duplicate receipt
    const existing = await prisma.depositReceipt.findUnique({
      where: { txSig },
    });
    if (existing) {
      return NextResponse.json({
        message: 'Deposit already verified',
        accountId: existing.createdAccountId,
      });
    }

    // 3) Verify on-chain USDC transfer
    const usdcMint = new PublicKey(env.usdcMint);
    const treasuryPubkey = new PublicKey(env.treasuryWallet);
    const treasuryAta = getAssociatedTokenAddressSync(usdcMint, treasuryPubkey, true);
    const expectedAmount = BigInt(item.priceUsdc * 1_000_000);

    const verified = await verifyUsdcTransfer({
      txSig,
      expectedDestinationAta: treasuryAta,
      expectedMint: usdcMint,
      expectedAmountBaseUnits: expectedAmount,
    });

    if (!verified) {
      return NextResponse.json(
        { error: 'On-chain verification failed: transfer not found or amount mismatch' },
        { status: 400 },
      );
    }

    // 4) Create PropSim account
    const createRes = await propsimFetch('/api/accounts', {
      method: 'POST',
      body: JSON.stringify({
        templateId: item.templateId,
        label: `${item.name} (${sku}) – tx:${txSig.slice(0, 8)}`,
      }),
    });

    let createdAccountId: string | null = null;
    if (createRes.ok) {
      const accountData = await createRes.json();
      createdAccountId = accountData.id || null;
    }

    // 5) Store deposit receipt + credit referral commission atomically
    const depositReceipt = await prisma.depositReceipt.create({
      data: {
        userId,
        sku,
        templateId: item.templateId,
        amountBaseUnits: expectedAmount.toString(),
        treasuryWallet: env.treasuryWallet,
        depositorWallet,
        txSig,
        createdAccountId,
      },
    });

    // 5b) Record firm fees (challenge provider fee + overhead)
    const challengeFees = calculateChallengeFees(expectedAmount);
    await recordFirmFees([
      {
        category: 'CHALLENGE_PROVIDER_FEE',
        amountBaseUnits: challengeFees.providerFee,
        sourceType: 'DEPOSIT',
        sourceId: depositReceipt.id,
        depositReceiptId: depositReceipt.id,
        description: `10% provider fee on ${sku} challenge ($${item.priceUsdc} USDC)`,
      },
      {
        category: 'OVERHEAD_FEE',
        amountBaseUnits: challengeFees.overhead,
        sourceType: 'DEPOSIT',
        sourceId: depositReceipt.id,
        depositReceiptId: depositReceipt.id,
        description: `10% overhead fee on ${sku} challenge ($${item.priceUsdc} USDC)`,
      },
    ]);

    // 6) Credit 15% commission to referrer (if user was referred)
    let commissionCreated = false;
    const depositor = await prisma.user.findUnique({
      where: { id: userId },
      select: { referredById: true },
    });

    if (depositor?.referredById) {
      const commissionAmount = calculateCommission(expectedAmount);
      if (commissionAmount > 0n) {
        // Atomic: create commission record + increment referrer balance
        await prisma.$transaction(async (tx) => {
          await tx.referralCommission.create({
            data: {
              referrerId: depositor.referredById!,
              referredUserId: userId,
              depositReceiptId: depositReceipt.id,
              depositAmount: expectedAmount.toString(),
              commissionAmount: commissionAmount.toString(),
            },
          });
          // Atomic BigInt increment via raw SQL (Prisma can't increment string fields)
          await tx.$executeRawUnsafe(
            `UPDATE User SET commissionBalanceLamports = CAST((CAST(commissionBalanceLamports AS INTEGER) + ?) AS TEXT) WHERE id = ?`,
            Number(commissionAmount),
            depositor.referredById!,
          );
        });
        commissionCreated = true;
      }
    }

    return NextResponse.json({
      message: 'Deposit verified and account created',
      accountId: createdAccountId,
      sku,
      commissionCredited: commissionCreated,
    }, { status: 201 });
  } catch (error) {
    console.error('Deposit verify error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
