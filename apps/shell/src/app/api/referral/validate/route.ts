import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/referral/validate?code=XXXXX
 * Returns whether a referral code is valid and exists.
 */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')?.toUpperCase();
    if (!code) {
      return NextResponse.json({ valid: false, error: 'code required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });

    return NextResponse.json({ valid: !!user });
  } catch (error) {
    console.error('Referral validate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
