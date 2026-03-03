import { NextResponse } from 'next/server';
import { propsimFetch, getTokens } from '@/lib/propsim';
import { prisma } from '@/lib/db';
import { getCatalogItem } from '@/lib/catalog';

export async function GET() {
  const { accessToken } = getTokens();

  // ── 1. If a trader is logged in, show THEIR accounts via user-scoped endpoint ──
  if (accessToken) {
    try {
      const res = await propsimFetch('/api/accounts/me/list');
      if (res.ok) {
        const json = await res.json();
        const accounts = json?.data ?? json;
        // Return user-scoped result even if empty (don't leak other users' accounts)
        if (Array.isArray(accounts)) {
          return NextResponse.json(accounts);
        }
      }
    } catch { /* PropSim unavailable — fall through to admin */ }
  }

  // ── 2. Fallback: admin listing (all firm accounts) ──
  try {
    const res = await propsimFetch('/api/admin/accounts');
    if (res.ok) {
      const json = await res.json();
      // Response shape: { success: true, data: { data: [...], total, page, ... } }
      const accounts = json?.data?.data ?? json?.data ?? json;
      if (Array.isArray(accounts) && accounts.length > 0) {
        return NextResponse.json(accounts);
      }
    }
  } catch {
    // PropSim not available — fall through to local DB
  }

  // Fallback: build accounts from local DepositReceipts
  const receipts = await prisma.depositReceipt.findMany({
    orderBy: { verifiedAt: 'desc' },
  });

  const accounts = receipts
    .filter((r) => r.createdAccountId)
    .map((r) => {
      const item = getCatalogItem(r.sku);
      const sizeNum = item ? parseFloat(item.accountSize.replace(/[^0-9.]/g, '')) : 50000;
      return {
        id: r.createdAccountId!,
        templateId: r.templateId,
        label: item?.name || r.sku,
        status: 'ACTIVE',
        balance: sizeNum,
        equity: sizeNum,
        startingBalance: sizeNum,
        createdAt: r.verifiedAt.toISOString(),
      };
    });

  return NextResponse.json(accounts);
}
