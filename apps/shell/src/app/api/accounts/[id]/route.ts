import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';
import { prisma } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Try direct account endpoint first, then admin endpoint as fallback
    let res = await propsimFetch(`/api/accounts/${params.id}`);
    if (!res.ok) {
      res = await propsimFetch(`/api/admin/accounts/${params.id}`);
    }
    if (res.ok) {
      const json = await res.json();
      // Admin endpoint wraps in { success, data }
      const account = json?.data ?? json;
      return NextResponse.json(account);
    }
  } catch { /* PropSim unavailable */ }

  // Fallback: build from local DepositReceipt
  const receipt = await prisma.depositReceipt.findFirst({ where: { id: params.id } }).catch(() => null);
  if (receipt) {
    const amountUsdc = Number(BigInt(receipt.amountBaseUnits)) / 1e6;
    return NextResponse.json({
      id: receipt.id,
      label: `${amountUsdc.toFixed(0)}K Challenge`,
      status: 'ACTIVE',
      balance: amountUsdc,
      equity: amountUsdc,
      startingBalance: amountUsdc,
      createdAt: receipt.verifiedAt.toISOString(),
    });
  }
  return NextResponse.json({ error: 'Account not found' }, { status: 404 });
}
