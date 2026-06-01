import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(request);
  const url = new URL(request.url);
  const email = url.searchParams.get('email')?.trim();
  const userId = session?.user?.id;

  if (!userId && !email) {
    return NextResponse.json({ error: 'Authentication or email query required.' }, { status: 401 });
  }

  const searchCondition = userId
    ? { userId }
    : { email: { equals: email!, mode: 'insensitive' as const } };

  const submissions = await prisma.submission.findMany({
    where: searchCondition,
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ submissions });
}
