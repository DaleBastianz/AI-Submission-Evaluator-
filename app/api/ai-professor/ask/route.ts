import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import prisma from '../../../../lib/prisma';
import { callGemini } from '../../../../lib/gemini';
import { toUserFacingGeminiError, truncateForPrompt } from '../../../../lib/geminiModels';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const lectureIds = Array.isArray(body.lectureIds) ? body.lectureIds.map(String) : [];
    const question = String(body.question || '').trim();
    const chatHistory = Array.isArray(body.chatHistory) ? body.chatHistory : [];

    if (!lectureIds.length || !question) {
      return NextResponse.json({ error: 'lectureIds and question are required.' }, { status: 400 });
    }

    const lectures = await prisma.lecture.findMany({
      where: { id: { in: lectureIds }, userId: session.user.id }
    });

    if (!lectures.length) {
      return NextResponse.json({ error: 'No lectures found for the selected IDs.' }, { status: 404 });
    }

    const content = truncateForPrompt(
      lectures.map((lecture, idx) => `Lecture ${idx + 1} (${lecture.fileName}):\n${lecture.textContent ?? '[no text]'}\n`).join('\n')
    );

    const historyText = chatHistory
      .map((item: any) => `${item.role === 'student' ? 'Student' : 'Professor'}: ${item.message}`)
      .join('\n');

    const prompt = `You are a university professor. Answer ONLY using the provided lecture content below. If the answer is not in the content, say 'This is not covered in the uploaded lectures.' Always cite which document you are drawing from.

Lecture content:
${content}

Conversation history:
${historyText}

Question: ${question}

Output only valid JSON in the format:
{ "answer": "...", "source": "filename.pdf or lecture title", "confidence": "high|medium|low" }
Return ONLY raw JSON. No markdown, no code blocks, no explanation. Start your response with { and end with }`

    const result = await callGemini(prompt, undefined, 1200);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: toUserFacingGeminiError(error) }, { status: 500 });
  }
}
