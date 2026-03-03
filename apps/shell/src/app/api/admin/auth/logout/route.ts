import { NextResponse } from 'next/server';
import { clearAdminCookie } from '@/lib/admin-auth';

/**
 * POST /api/admin/auth/logout
 */
export async function POST() {
  clearAdminCookie();
  return NextResponse.json({ message: 'Logged out' });
}
