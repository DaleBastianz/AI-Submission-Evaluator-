import { NextResponse } from 'next/server';
import { applySessionCookies, clearSessionCookies } from '../../../../lib/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ success: true });
  return applySessionCookies(response, clearSessionCookies());
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  return applySessionCookies(response, clearSessionCookies());
}
