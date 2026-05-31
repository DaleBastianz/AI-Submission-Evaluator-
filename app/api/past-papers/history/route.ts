import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import prisma from '../../../../lib/prisma';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const papers = await prisma.pastPaper.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ papers });
}
