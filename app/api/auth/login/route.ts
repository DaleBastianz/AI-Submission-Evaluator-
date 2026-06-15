import { NextResponse } from 'next/server';
import { toUserFacingDbError } from '../../../../lib/dbErrors';
import { verifyPassword } from '../../../../lib/password';
import prisma from '../../../../lib/prisma';
import { applySessionCookies, getSessionCookies } from '../../../../lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const cookies = getSessionCookies({ id: user.id, email: user.email, name: user.name });
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
    return applySessionCookies(response, cookies);
  } catch (error: any) {
    const message = toUserFacingDbError(error);
    const status = message.includes('unreachable') || message.includes('waking up') ? 503 : 500;
    return NextResponse.json({ error: message || 'Login failed.' }, { status });
  }
}
