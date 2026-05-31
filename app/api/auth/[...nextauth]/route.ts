import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect(new URL('/login', 'http://localhost:3000'));
}

export async function POST() {
  return NextResponse.json({ error: 'This authentication endpoint is not available.' }, { status: 404 });
}
