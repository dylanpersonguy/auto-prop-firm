import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { CHALLENGE_CATALOG } from '@/lib/catalog';
import { env } from '@/lib/env';

/**
 * GET /api/admin/settings
 * Return platform configuration (non-sensitive).
 */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.response;

  return NextResponse.json({
    catalog: CHALLENGE_CATALOG,
    environment: {
      solanaCluster: env.solanaRpcUrl.includes('mainnet') ? 'mainnet-beta' : env.solanaRpcUrl.includes('devnet') ? 'devnet' : 'localnet',
      treasuryWallet: env.treasuryWallet || '(not set)',
      propsimUrl: env.propsimBaseUrl,
      referralCommission: '15%',
      claimExpiry: `${env.claimTtlSeconds / 3600} hours`,
      dailyCapUsdc: `$${env.dailyCapUsdc}`,
    },
    adminSecurity: {
      jwtExpiry: '8 hours',
    },
  });
}
