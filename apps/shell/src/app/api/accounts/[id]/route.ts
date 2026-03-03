import { NextRequest, NextResponse } from 'next/server';
import { propsimFetch } from '@/lib/propsim';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    return NextResponse.json({
      id: receipt.id,
      label: `${(receipt.amountUsdc / 1e6).toFixed(0)}K Challenge`,
      status: 'ACTIVE',
      balance: receipt.amountUsdc / 1e6,
      equity: receipt.amountUsdc / 1e6,
      startingBalance: receipt.amountUsdc / 1e6,
      createdAt: receipt.createdAt.toISOString(),
    });
  }
  return NextResponse.json({ error: 'Account not found' }, { status: 404 });
}
