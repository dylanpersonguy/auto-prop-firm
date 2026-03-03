import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { setTokenCookies } from '@/lib/propsim';
import { prisma } from '@/lib/db';
import { generateReferralCode, isValidCodeFormat } from '@/lib/referral';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, referralCode, ...rest } = body;

    // Register with PropSim
    const registerRes = await fetch(`${env.propsimBaseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, ...rest }),
    });

    if (!registerRes.ok) {
      const err = await registerRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || 'Registration failed' },
        { status: registerRes.status },
      );
    }

    // ── Create local User record with referral tracking ──
    let referredById: string | null = null;

    if (referralCode && isValidCodeFormat(referralCode)) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toUpperCase() },
        select: { id: true },
      });
      if (referrer) {
        referredById = referrer.id;
      }
      // Silently ignore invalid codes – don't block registration
    }

    // Generate a unique referral code for the new user (retry on collision)
    let newCode: string;
    let attempts = 0;
    do {
      newCode = generateReferralCode();
      const exists = await prisma.user.findUnique({ where: { referralCode: newCode } });
      if (!exists) break;
      attempts++;
    } while (attempts < 10);

    const user = await prisma.user.create({
      data: {
        email,
        referralCode: newCode,
        referredById,
      },
    });

    // Auto-login after registration
    const loginRes = await fetch(`${env.propsimBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      return NextResponse.json(
        { message: 'Registered but login failed. Please login manually.', userId: user.id },
        { status: 201 },
      );
    }

    const tokens = await loginRes.json();
    setTokenCookies(tokens.accessToken, tokens.refreshToken);

    return NextResponse.json(
      { message: 'Registered and logged in', userId: user.id, referralCode: user.referralCode },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
