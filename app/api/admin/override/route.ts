import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { password, submissionId, grade, score } = body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (!submissionId || !grade || typeof score !== 'number') {
      return NextResponse.json({ error: 'Missing required override values.' }, { status: 400 });
    }

    const submission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        aiGrade: grade,
        aiScore: score
      }
    });

    return NextResponse.json({ success: true, submission });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to override grade.' }, { status: 500 });
  }
}
