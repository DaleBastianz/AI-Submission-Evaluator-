import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import prisma from '../../../../lib/prisma';
import { callGemini } from '../../../../lib/gemini';
import { toUserFacingGeminiError, truncateForPrompt } from '../../../../lib/geminiModels';
import { extractTextFromBuffer, sanitizeFileName, saveUploadedFile, buildPublicUrl } from '../../../../lib/fileUtils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let lectureIds: string[] = [];
    let fileUrl: string | null = null;
    let fileName = '';
    let textContent = '';
    let questionText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const rawLectureIds = formData.getAll('lectureIds');
      if (rawLectureIds.length === 1) {
        try {
          lectureIds = JSON.parse(String(rawLectureIds[0]));
        } catch {
          lectureIds = [];
        }
      } else {
        lectureIds = rawLectureIds.map((item) => String(item));
      }
      questionText = String(formData.get('questionText') || '').trim();
      const file = formData.get('pastPaperFile') as File | null;

      if (file && file.name) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${sanitizeFileName(file.name)}`;
        await saveUploadedFile(filename, buffer);
        fileUrl = buildPublicUrl(filename);
        fileName = file.name;
        textContent = await extractTextFromBuffer(file.name, buffer);
      }
    } else {
      const body = await request.json();
      lectureIds = Array.isArray(body.lectureIds) ? body.lectureIds.map(String) : [];
      questionText = String(body.questionText || '').trim();
    }

    if (!fileUrl && !questionText) {
      return NextResponse.json({ error: 'Upload a past paper or provide a manual question.' }, { status: 400 });
    }

    const lectures = await prisma.lecture.findMany({ where: { id: { in: lectureIds }, userId: session.user.id } });
    const lectureText = truncateForPrompt(
      lectures.map((lecture, idx) => `Lecture ${idx + 1} (${lecture.fileName}):\n${lecture.textContent ?? '[no text]'}\n`).join('\n')
    );
    const paperText = truncateForPrompt(textContent || questionText, 8000);

    let prompt = '';
    if (fileUrl) {
      prompt = `You are an AI tutor that solves past paper questions. Extract up to 5 of the most important individual questions from the paper content below, then generate structured answers.

Paper text:\n${paperText}\n
If lecture content is available, cross-reference concepts with the lectures.

Rules:
- Maximum 5 questions in the array.
- Keep each question text under 40 words.
- Keep shortAnswer under 50 words.
- Keep detailedAnswer under 120 words.
- markSchemeHints: maximum 3 short bullet strings per question.

Output only valid JSON:
{ "questions": [ { "question": "...", "shortAnswer": "...", "detailedAnswer": "...", "markSchemeHints": ["..."], "relatedTopics": ["..."], "difficulty": "easy|medium|hard", "lectureReference": "filename or null" } ] }

Lecture content:\n${lectureText}
Return ONLY raw JSON. No markdown, no code blocks, no explanation. Start your response with { and end with }`;
    } else {
      prompt = `You are an AI tutor answering a manual exam-style question. Use the lecture content below if it is relevant. If the exact answer is not in the lectures, say so clearly in the detailedAnswer. Output only valid JSON in the form:
{ "questions": [ { "question": "${questionText}", "shortAnswer": "...", "detailedAnswer": "...", "markSchemeHints": ["..."], "relatedTopics": ["..."], "difficulty": "medium", "lectureReference": "filename or null" } ] }

Lecture content:\n${lectureText}
Return ONLY raw JSON. No markdown, no code blocks, no explanation. Start your response with { and end with }`;
    }

    const aiResult = await callGemini(prompt, undefined, 8192);
    const record = await prisma.pastPaper.create({
      data: {
        userId: session.user.id,
        fileName: fileUrl ? fileName : 'Manual question',
        fileUrl: fileUrl ?? 'manual-question',
        textContent: textContent || questionText || null,
        aiAnswers: aiResult
      }
    });

    return NextResponse.json({ success: true, aiAnswers: aiResult, pastPaper: record });
  } catch (error: any) {
    return NextResponse.json({ error: toUserFacingGeminiError(error) }, { status: 500 });
  }
}
