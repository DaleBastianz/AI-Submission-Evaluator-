import { NextResponse } from 'next/server';
import { getServerSession } from '../../../lib/session';
import prisma from '../../../lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 30;

export async function GET(request: Request) {
  const session = await getServerSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const [submissionCount, averageScore, examCount, lectureCount, recentSubmissions, recentLectures] =
      await prisma.$transaction([
        prisma.submission.count({ where: { userId } }),
        prisma.submission.aggregate({ where: { userId }, _avg: { aiScore: true } }),
        prisma.examSession.count({ where: { userId } }),
        prisma.lecture.count({ where: { userId } }),
        prisma.submission.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 4 }),
        prisma.lecture.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 4 })
      ]);

    const avgScore = Math.round((averageScore._avg.aiScore ?? 0) * 10) / 10;

    const activityFeed = [
      ...recentSubmissions.map((item) => ({
        id: item.id,
        title: `Assignment: ${item.title}`,
        subtitle: `Score ${item.aiScore ?? 0}/100`,
        date: item.createdAt.toISOString()
      })),
      ...recentLectures.map((item) => ({
        id: item.id,
        title: `Lecture uploaded: ${item.fileName}`,
        subtitle: item.moduleName,
        date: item.createdAt.toISOString()
      }))
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);

    return NextResponse.json({
      user: session.user,
      stats: {
        submissionCount,
        avgScore,
        examCount,
        lectureCount
      },
      activityFeed
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load dashboard.' }, { status: 500 });
  }
}
