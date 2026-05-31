import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import prisma from '../../../../lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const bookmarks = await prisma.referenceBookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ bookmarks });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const topic = String(body.topic || '').trim();
    const title = String(body.title || '').trim();
    const channel = String(body.channel || '').trim();
    const videoId = String(body.videoId || '').trim();
    const thumbnail = String(body.thumbnail || '').trim();
    const videoUrl = String(body.videoUrl || '').trim();

    if (!topic || !title || !videoId || !videoUrl) {
      return NextResponse.json({ error: 'Missing bookmark data.' }, { status: 400 });
    }

    const bookmark = await prisma.referenceBookmark.create({
      data: {
        userId: session.user.id,
        topic,
        title,
        channel,
        videoId,
        thumbnail,
        videoUrl
      }
    });

    return NextResponse.json({ success: true, bookmark });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Bookmark failed.' }, { status: 500 });
  }
}
