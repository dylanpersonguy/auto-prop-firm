import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/auth/me
 * Returns the current admin session info.
 */
export async function GET() {
  const result = await requireAdmin();
  if (!result.authorized) return result.response;
  return NextResponse.json({ email: result.admin.email, userId: result.admin.userId });
}
