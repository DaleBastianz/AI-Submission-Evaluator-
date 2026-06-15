import { NextResponse } from 'next/server';
import { toUserFacingDbError } from '../../../../lib/dbErrors';
import prisma from '../../../../lib/prisma';
import { getServerSession } from '../../../../lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const lectures = await prisma.lecture.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ lectures });
  } catch (error) {
    return NextResponse.json({ error: toUserFacingDbError(error) }, { status: 503 });
  }
}
