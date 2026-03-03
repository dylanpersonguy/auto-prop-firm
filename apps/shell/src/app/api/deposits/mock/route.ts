import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getCatalogItem } from '@/lib/catalog';
import { env } from '@/lib/env';
import { generateReferralCode } from '@/lib/referral';
import { calculateChallengeFees } from '@/lib/fees';
import { recordFirmFees } from '@/lib/fee-recorder';

/**
 * Mock deposit endpoint for TESTING ONLY.
 * Skips on-chain verification and PropSim account creation.
 * Creates a User (if needed) + DepositReceipt + fake account ID.
 */

const MockDepositBody = z.object({
  sku: z.string(),
  depositorWallet: z.string().min(32).max(44),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = MockDepositBody.parse(body);
    const { sku, depositorWallet } = parsed;

    // 1) Look up catalog item
    const item = getCatalogItem(sku);
    if (!item) {
      return NextResponse.json({ error: `Unknown SKU: ${sku}` }, { status: 400 });
    }

    // 2) Find or create user by wallet address
    let user = await prisma.user.findFirst({
      where: { email: depositorWallet },
    });

    if (!user) {
      let referralCode: string;
      let attempts = 0;
      do {
        referralCode = generateReferralCode();
        const exists = await prisma.user.findUnique({ where: { referralCode } });
        if (!exists) break;
        attempts++;
      } while (attempts < 10);

      user = await prisma.user.create({
        data: {
          email: depositorWallet, // use wallet as identifier for mock
          referralCode: referralCode!,
        },
      });
    }

    // 3) Generate fake transaction signature
    const fakeTxSig = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const fakeAccountId = `acct_${sku}_${Date.now()}`;
    const expectedAmount = BigInt(item.priceUsdc * 1_000_000);

    // 4) Create deposit receipt
    const receipt = await prisma.depositReceipt.create({
      data: {
        userId: user.id,
        sku,
        templateId: item.templateId,
        amountBaseUnits: expectedAmount.toString(),
        treasuryWallet: env.treasuryWallet,
        depositorWallet,
        txSig: fakeTxSig,
        createdAccountId: fakeAccountId,
      },
    });

    // 5) Record firm fees (challenge provider fee + overhead)
    const challengeFees = calculateChallengeFees(expectedAmount);
    await recordFirmFees([
      {
        category: 'CHALLENGE_PROVIDER_FEE',
        amountBaseUnits: challengeFees.providerFee,
        sourceType: 'DEPOSIT',
        sourceId: receipt.id,
        depositReceiptId: receipt.id,
        description: `10% provider fee on ${sku} challenge ($${item.priceUsdc} USDC)`,
      },
      {
        category: 'OVERHEAD_FEE',
        amountBaseUnits: challengeFees.overhead,
        sourceType: 'DEPOSIT',
        sourceId: receipt.id,
        depositReceiptId: receipt.id,
        description: `10% overhead on ${sku} challenge ($${item.priceUsdc} USDC)`,
      },
    ]);

    return NextResponse.json(
      {
        message: 'Mock deposit created successfully',
        accountId: fakeAccountId,
        sku,
        userId: user.id,
        txSig: fakeTxSig,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Mock deposit error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
