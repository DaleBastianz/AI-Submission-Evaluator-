import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email')?.trim();

  if (!email) {
    return NextResponse.json({ error: 'Email query required.' }, { status: 400 });
  }

  const submissions = await prisma.submission.findMany({
    where: { email: { equals: email, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ submissions });
}
