import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import prisma from '../../../../lib/prisma';
import { callGemini } from '../../../../lib/gemini';
import { toUserFacingGeminiError, truncateForPrompt } from '../../../../lib/geminiModels';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const parseDuration = (duration: string) => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';
  const [, hours = '0', minutes = '0', seconds = '0'] = match;
  const h = Number(hours);
  const m = Number(minutes);
  const s = Number(seconds);
  return `${h ? `${h}:` : ''}${m.toString().padStart(h ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
};

type VideoResult = {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  videoUrl: string;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (!YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'YOUTUBE_API_KEY is not configured.' }, { status: 500 });
    }

    const body = await request.json();
    const lectureIds = Array.isArray(body.lectureIds) ? body.lectureIds.map(String) : [];
    if (!lectureIds.length) {
      return NextResponse.json({ error: 'lectureIds are required.' }, { status: 400 });
    }

    const lectures = await prisma.lecture.findMany({ where: { id: { in: lectureIds }, userId: session.user.id } });
    if (!lectures.length) {
      return NextResponse.json({ error: 'No lectures found for the selected IDs.' }, { status: 404 });
    }

    const lectureText = truncateForPrompt(
      lectures.map((lecture, index) => `Lecture ${index + 1} (${lecture.fileName}):\n${lecture.textContent ?? '[no text extracted]'}\n`).join('\n')
    );

    const topicPrompt = `Extract the top 5 most important study topics from the lecture content below. Output only valid JSON in the form: { "topics": ["topic1", "topic2", ...] }.

Lecture content:
${lectureText}
Return ONLY raw JSON. No markdown, no code blocks, no explanation. Start your response with { and end with }`;
    const topicResult = await callGemini(topicPrompt, undefined, 600);
    const topics = Array.isArray(topicResult.topics) ? topicResult.topics.slice(0, 5) : [];
    if (!topics.length) {
      return NextResponse.json({ error: 'Failed to extract topics from lecture content.' }, { status: 500 });
    }

    const topicResults = [];

    for (const topic of topics) {
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('videoCategoryId', '27');
      searchUrl.searchParams.set('maxResults', '3');
      searchUrl.searchParams.set('relevanceLanguage', 'en');
      searchUrl.searchParams.set('order', 'relevance');
      searchUrl.searchParams.set('q', topic);
      searchUrl.searchParams.set('key', YOUTUBE_API_KEY);

      const searchResponse = await fetch(searchUrl.toString());
      const searchData = await searchResponse.json();
      const videoItems = Array.isArray(searchData.items) ? searchData.items : [];
      const videoIds = videoItems.map((item: any) => item.id.videoId).filter(Boolean);

      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.set('part', 'contentDetails,snippet');
      detailsUrl.searchParams.set('id', videoIds.join(','));
      detailsUrl.searchParams.set('key', YOUTUBE_API_KEY);

      const detailsResponse = await fetch(detailsUrl.toString());
      const detailsData = await detailsResponse.json();
      const videos: VideoResult[] = Array.isArray(detailsData.items)
        ? detailsData.items.map((video: any) => ({
            videoId: video.id,
            title: video.snippet.title,
            channel: video.snippet.channelTitle,
            thumbnail: video.snippet.thumbnails?.high?.url ?? video.snippet.thumbnails?.default?.url,
            duration: parseDuration(video.contentDetails?.duration || ''),
            videoUrl: `https://www.youtube.com/watch?v=${video.id}`
          }))
        : [];

      const rankedVideos = videos
        .map((video, index) => ({
          ...video,
          relevanceScore: videos.length - index
        }))
        .slice(0, 2);

      topicResults.push({ topic, videos: rankedVideos });
    }

    return NextResponse.json({ success: true, topicResults });
  } catch (error: any) {
    return NextResponse.json({ error: toUserFacingGeminiError(error) }, { status: 500 });
  }
}
