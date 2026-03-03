import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { env } from '@/lib/env';
import { createAdminToken, setAdminCookie } from '@/lib/admin-auth';

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/admin/auth/login
 * Admin login with email + admin password.
 * The admin password is a shared server secret (ADMIN_PASSWORD env var).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = LoginBody.parse(body);

    // Verify admin password
    if (password !== env.adminPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Find or create admin user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Not an admin user' }, { status: 403 });
    }

    const token = await createAdminToken(email, user.id);
    setAdminCookie(token);

    return NextResponse.json({ message: 'Logged in', email: user.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
