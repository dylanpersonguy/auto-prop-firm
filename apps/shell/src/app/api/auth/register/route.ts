import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { setTokenCookies } from '@/lib/propsim';
import { prisma } from '@/lib/db';
import { generateReferralCode, isValidCodeFormat } from '@/lib/referral';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, referralCode, ...rest } = body;

    // --- Try PropSim self-registration first ---
    let propsimUserId: string | null = null;
    const registerRes = await fetch(`${env.propsimBaseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName, ...rest }),
    });

    if (registerRes.ok) {
      const regData = await registerRes.json();
      const reg = regData?.data ?? regData;
      propsimUserId = reg?.id ?? reg?.userId ?? null;
    } else {
      // PropSim registration may have a UUID bug — fall back to admin user creation
      if (env.propsimApiKey) {
        const adminRes = await fetch(`${env.propsimBaseUrl}/api/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.propsimApiKey}`,
          },
          body: JSON.stringify({ email, password, firstName, lastName }),
        });

        if (adminRes.ok) {
          const adminData = await adminRes.json();
          const user = adminData?.data ?? adminData;
          propsimUserId = user?.id ?? null;
        } else {
          const err = await adminRes.json().catch(() => ({}));
          const msg = err?.error?.message ?? err?.message ?? 'Registration failed';
          return NextResponse.json({ error: msg }, { status: adminRes.status });
        }
      } else {
        const err = await registerRes.json().catch(() => ({}));
        const msg = err?.error?.message ?? err?.message ?? 'Registration failed';
        return NextResponse.json({ error: msg }, { status: registerRes.status });
      }
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

    let user;
    try {
      user = await prisma.user.create({
        data: {
          email,
          referralCode: newCode,
          referredById,
        },
      });
    } catch (err: any) {
      // Handle unique constraint violation on referralCode (extremely rare race condition)
      if (err?.code === 'P2002' && err?.meta?.target?.includes('referralCode')) {
        // Retry once with a fresh code
        newCode = generateReferralCode();
        user = await prisma.user.create({
          data: {
            email,
            referralCode: newCode,
            referredById,
          },
        });
      } else {
        throw err;
      }
    }

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
    // PropSim wraps in { success, data: { accessToken, refreshToken } }
    const tokenData = tokens?.data ?? tokens;
    setTokenCookies(tokenData.accessToken, tokenData.refreshToken);

    return NextResponse.json(
      { message: 'Registered and logged in', userId: user.id, referralCode: user.referralCode },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
