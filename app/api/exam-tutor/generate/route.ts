import { NextResponse } from 'next/server';
import { buildExamTutorPrompt, EXAM_TUTOR_OUTPUT_TOKEN_LIMITS } from '../../../../lib/examTutorPrompts';
import { callGemini } from '../../../../lib/gemini';
import { toUserFacingGeminiError, truncateForPrompt } from '../../../../lib/geminiModels';
import { normalizeMindMapData } from '../../../../lib/mindMap';
import prisma from '../../../../lib/prisma';
import { toUserFacingDbError } from '../../../../lib/dbErrors';
import { getSessionFromRequest } from '../../../../lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_OUTPUTS = new Set([
  'cheatSheet',
  'flashcards',
  'shortNotes',
  'sampleExam',
  'mcqs',
  'mindMap',
  'examTips'
]);

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const lectureIds = Array.isArray(body.lectureIds) ? body.lectureIds.map(String) : [];
    const selectedOutputs = Array.isArray(body.selectedOutputs)
      ? body.selectedOutputs.map(String).filter((key: string) => VALID_OUTPUTS.has(key))
      : [];

    if (!lectureIds.length || !selectedOutputs.length) {
      return NextResponse.json({ error: 'lectureIds and selectedOutputs are required.' }, { status: 400 });
    }

    const lectures = await prisma.lecture.findMany({
      where: { id: { in: lectureIds }, userId: session.user.id }
    });

    if (!lectures.length) {
      return NextResponse.json({ error: 'No lectures found for the selected IDs.' }, { status: 404 });
    }

    const sourceText = truncateForPrompt(
      lectures
        .map((lecture, index) => `Lecture ${index + 1} (${lecture.fileName}):\n${lecture.textContent ?? '[no text extracted]'}\n`)
        .join('\n')
    );

    const aiResult: Record<string, unknown> = {};

    for (const outputKey of selectedOutputs) {
      const prompt = buildExamTutorPrompt(sourceText, outputKey);
      if (!prompt) continue;

      const tokenLimit = EXAM_TUTOR_OUTPUT_TOKEN_LIMITS[outputKey] ?? 2048;
      const partial = (await callGemini(prompt, undefined, tokenLimit)) as Record<string, unknown>;
      aiResult[outputKey] = partial[outputKey] ?? partial;
    }

    if (selectedOutputs.includes('mindMap') && aiResult.mindMap) {
      const normalized = normalizeMindMapData(aiResult.mindMap);
      aiResult.mindMap = normalized ?? aiResult.mindMap;
    }

    const stored = await prisma.examSession.create({
      data: {
        userId: session.user.id,
        moduleName: lectures[0].moduleName,
        lectureIds,
        cheatSheet: (aiResult.cheatSheet as object) ?? null,
        flashcards: (aiResult.flashcards as object) ?? null,
        shortNotes: (aiResult.shortNotes as object) ?? null,
        sampleExam: (aiResult.sampleExam as object) ?? null,
        mcqs: (aiResult.mcqs as object) ?? null,
        mindMap: (aiResult.mindMap as object) ?? null,
        examTips: (aiResult.examTips as object) ?? null
      }
    });

    return NextResponse.json({ success: true, outputs: aiResult, session: stored });
  } catch (error: any) {
    const message = error?.message || '';
    if (message.includes('prisma.') || message.includes('Prisma')) {
      return NextResponse.json({ error: toUserFacingDbError(error) }, { status: 503 });
    }
    return NextResponse.json({ error: toUserFacingGeminiError(error) }, { status: 500 });
  }
}
