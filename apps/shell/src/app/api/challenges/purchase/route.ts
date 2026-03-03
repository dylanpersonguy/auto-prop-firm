import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCatalogItem } from '@/lib/catalog';
import { env } from '@/lib/env';
import { cookies } from 'next/headers';

/**
 * POST /api/challenges/purchase
 * 
 * Purchases a challenge: validates payment, creates a PropSim account
 * for the authenticated user, returns the new account details.
 * 
 * For now uses "mock" payment (always succeeds). In production,
 * this would verify on-chain USDC transfer first.
 */

const PurchaseBody = z.object({
  sku: z.string(),
  paymentMethod: z.enum(['mock', 'usdc']).default('mock'),
  txSig: z.string().optional(), // Required for 'usdc' method
});

export async function POST(req: NextRequest) {
  try {
    // 1) Verify authenticated user via JWT
    const accessToken = cookies().get('propsim_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Decode JWT to get user ID
    let userId: string;
    try {
      const payload = JSON.parse(
        Buffer.from(accessToken.split('.')[1], 'base64').toString()
      );
      userId = payload.sub;
      if (!userId) throw new Error('No sub in JWT');
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2) Parse & validate body
    const body = await req.json();
    const parsed = PurchaseBody.parse(body);
    const { sku, paymentMethod, txSig } = parsed;

    // 3) Look up catalog item
    const item = getCatalogItem(sku);
    if (!item) {
      return NextResponse.json({ error: `Unknown challenge: ${sku}` }, { status: 400 });
    }

    // 4) Verify payment
    if (paymentMethod === 'usdc') {
      if (!txSig) {
        return NextResponse.json({ error: 'Transaction signature required for USDC payment' }, { status: 400 });
      }
      // TODO: Verify on-chain USDC transfer via verifyUsdcTransfer()
      // For now, accept the tx sig as-is
    }
    // paymentMethod === 'mock' always succeeds

    // 5) Create PropSim account for this user
    const propsimUrl = env.propsimBaseUrl || 'http://localhost:3000';
    const apiKey = env.propsimApiKey;
    if (!apiKey) {
      return NextResponse.json({ error: 'PropSim not configured' }, { status: 500 });
    }

    const label = `${item.name} – ${item.accountSize}`;
    const createRes = await fetch(`${propsimUrl}/api/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        userId,
        templateId: item.templateId,
        label,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error('PropSim account creation failed:', createRes.status, errText);
      return NextResponse.json(
        { error: 'Failed to provision trading account. Please contact support.' },
        { status: 502 },
      );
    }

    const createJson = await createRes.json();
    const account = createJson?.data ?? createJson;

    // 6) Return success
    return NextResponse.json({
      message: 'Challenge purchased successfully',
      account: {
        id: account.id,
        label: account.label,
        status: account.status,
        phase: account.phase,
        startingBalance: account.startingBalance,
        balance: account.balance,
        equity: account.equity,
        currency: account.currency,
        leverage: account.leverage,
      },
      challenge: {
        sku: item.sku,
        name: item.name,
        accountSize: item.accountSize,
        priceUsdc: item.priceUsdc,
      },
      paymentMethod,
    }, { status: 201 });
  } catch (error) {
    console.error('Challenge purchase error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
