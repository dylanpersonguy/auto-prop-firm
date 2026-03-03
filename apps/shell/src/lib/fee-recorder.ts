import { prisma } from '@/lib/db';
import type { FeeCategory } from '@/lib/fees';

/**
 * Record a fee in the FirmFeeLedger and increment the FirmProfitAccount.
 * Uses a transaction so the ledger + balance stay in sync.
 */
export async function recordFirmFee(params: {
  category: FeeCategory;
  amountBaseUnits: bigint;
  sourceType: 'DEPOSIT' | 'PAYOUT' | 'TRADE' | 'WITHDRAWAL';
  sourceId: string;
  depositReceiptId?: string;
  payoutClaimId?: string;
  description?: string;
}): Promise<string> {
  const { category, amountBaseUnits, sourceType, sourceId, depositReceiptId, payoutClaimId, description } = params;

  // Skip zero-amount fees
  if (amountBaseUnits <= 0n) return '';

  const result = await prisma.$transaction(async (tx) => {
    // 1) Create ledger entry
    const entry = await tx.firmFeeLedger.create({
      data: {
        category,
        amountBaseUnits: amountBaseUnits.toString(),
        sourceType,
        sourceId,
        depositReceiptId: depositReceiptId || null,
        payoutClaimId: payoutClaimId || null,
        description: description || `${category} from ${sourceType} ${sourceId}`,
      },
    });

    // 2) Upsert profit account balance (atomic increment)
    let account = await tx.firmProfitAccount.findFirst();
    if (!account) {
      account = await tx.firmProfitAccount.create({
        data: { balanceBaseUnits: amountBaseUnits.toString() },
      });
    } else {
      const newBalance = BigInt(account.balanceBaseUnits) + amountBaseUnits;
      await tx.firmProfitAccount.update({
        where: { id: account.id },
        data: {
          balanceBaseUnits: newBalance.toString(),
          lastUpdatedAt: new Date(),
        },
      });
    }

    return entry.id;
  });

  return result;
}

/**
 * Record multiple fees at once in a single transaction.
 */
export async function recordFirmFees(
  fees: Array<{
    category: FeeCategory;
    amountBaseUnits: bigint;
    sourceType: 'DEPOSIT' | 'PAYOUT' | 'TRADE' | 'WITHDRAWAL';
    sourceId: string;
    depositReceiptId?: string;
    payoutClaimId?: string;
    description?: string;
  }>,
): Promise<string[]> {
  // Filter out zero-amount fees
  const nonZero = fees.filter((f) => f.amountBaseUnits > 0n);
  if (nonZero.length === 0) return [];

  const totalAmount = nonZero.reduce((sum, f) => sum + f.amountBaseUnits, 0n);

  return prisma.$transaction(async (tx) => {
    const ids: string[] = [];

    for (const fee of nonZero) {
      const entry = await tx.firmFeeLedger.create({
        data: {
          category: fee.category,
          amountBaseUnits: fee.amountBaseUnits.toString(),
          sourceType: fee.sourceType,
          sourceId: fee.sourceId,
          depositReceiptId: fee.depositReceiptId || null,
          payoutClaimId: fee.payoutClaimId || null,
          description: fee.description || `${fee.category} from ${fee.sourceType} ${fee.sourceId}`,
        },
      });
      ids.push(entry.id);
    }

    // Update profit account once with total
    let account = await tx.firmProfitAccount.findFirst();
    if (!account) {
      await tx.firmProfitAccount.create({
        data: { balanceBaseUnits: totalAmount.toString() },
      });
    } else {
      const newBalance = BigInt(account.balanceBaseUnits) + totalAmount;
      await tx.firmProfitAccount.update({
        where: { id: account.id },
        data: {
          balanceBaseUnits: newBalance.toString(),
          lastUpdatedAt: new Date(),
        },
      });
    }

    return ids;
  });
}
