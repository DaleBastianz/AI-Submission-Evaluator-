import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '../../../../lib/session';
import prisma from '../../../../lib/prisma';
import { callGemini } from '../../../../lib/gemini';
import { toUserFacingGeminiError, truncateForPrompt } from '../../../../lib/geminiModels';
import { normalizeMindMapData } from '../../../../lib/mindMap';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const lectureIds = Array.isArray(body.lectureIds) ? body.lectureIds.map(String) : [];
    const selectedOutputs = Array.isArray(body.selectedOutputs) ? body.selectedOutputs.map(String) : [];

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

    const prompt = `You are an exam tutor assistant. Use only the lecture content below to generate the requested study resources. If a requested resource is not possible, return an empty structure.

Lecture content:
${sourceText}

Generate the following outputs exactly in JSON with these keys: cheatSheet, flashcards, shortNotes, sampleExam, mcqs, mindMap, examTips.

Only include the keys exactly as described. Do not write any markdown, commentary, or extraneous text.

Selected outputs: ${JSON.stringify(selectedOutputs)}

Output format example:
{
  "cheatSheet": { "sections": [{ "title": "", "points": [""] }] },
  "flashcards": { "cards": [{ "front": "", "back": "" }] },
  "shortNotes": { "summary": "", "keyPoints": [""], "definitions": [{ "term": "", "def": "" }] },
  "sampleExam": { "questions": [{ "q": "", "answer": "", "explanation": "" }] },
  "mcqs": { "questions": [{ "q": "", "options": ["A","B","C","D"], "correct": "A", "explanation": "" }] },
  "mindMap": {
    "root": "Topic Name",
    "branches": [
      {
        "id": "b1",
        "label": "Branch Title",
        "color": "teal",
        "subtopics": [
          { "id": "s1", "label": "Subtopic text" },
          { "id": "s2", "label": "Subtopic text" }
        ]
      }
    ]
  },
  "examTips": { "tips": [""], "commonMistakes": [""], "timeManagement": "" }
}

Only include data for the selected outputs. For unselected outputs, return null.

When generating mindMap (if selected):
- Use the exact mindMap schema above with id, label, color, and subtopics array of { id, label } objects.
- color must be one of: "teal", "purple", "amber", "coral", "blue" — assign a different color to each branch.
- Maximum 6 branches. Maximum 5 subtopics per branch.
- Keep all labels SHORT — maximum 5 words each.

Return ONLY raw JSON. No markdown, no code blocks, no explanation. Start your response with { and end with }`

    const aiResult = await callGemini(prompt, undefined, 4096);

    if (selectedOutputs.includes('mindMap') && aiResult.mindMap) {
      const normalized = normalizeMindMapData(aiResult.mindMap);
      aiResult.mindMap = normalized ?? aiResult.mindMap;
    }

    const stored = await prisma.examSession.create({
      data: {
        userId: session.user.id,
        moduleName: lectures[0].moduleName,
        lectureIds,
        cheatSheet: aiResult.cheatSheet ?? null,
        flashcards: aiResult.flashcards ?? null,
        shortNotes: aiResult.shortNotes ?? null,
        sampleExam: aiResult.sampleExam ?? null,
        mcqs: aiResult.mcqs ?? null,
        mindMap: aiResult.mindMap ?? null,
        examTips: aiResult.examTips ?? null
      }
    });

    return NextResponse.json({ success: true, outputs: aiResult, session: stored });
  } catch (error: any) {
    const message = error?.message || '';
    if (message.includes('prisma.') || message.includes('Prisma')) {
      return NextResponse.json(
        {
          error:
            'Could not save study materials to the database. If this persists, run: npx prisma db push — then try again.'
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: toUserFacingGeminiError(error) }, { status: 500 });
  }
}
