const JSON_RULES =
  'Return ONLY raw JSON. No markdown, no code blocks, no explanation. Start your response with { and end with }';

export function buildExamTutorPrompt(sourceText: string, outputKey: string) {
  const base = `You are an exam tutor assistant. Use only the lecture content below. If the resource cannot be generated, return an empty structure for the requested key.

Lecture content:
${sourceText}

`;

  const prompts: Record<string, string> = {
    cheatSheet: `${base}Generate a cheat sheet as JSON with exactly this shape:
{ "cheatSheet": { "sections": [{ "title": "short title", "points": ["brief point"] }] } }
Maximum 6 sections, 5 points each. Keep every string under 15 words.
${JSON_RULES}`,

    flashcards: `${base}Generate flashcards as JSON with exactly this shape:
{ "flashcards": { "cards": [{ "front": "term or question", "back": "short answer" }] } }
Maximum 10 cards. Keep front and back under 20 words each.
${JSON_RULES}`,

    shortNotes: `${base}Generate short notes as JSON with exactly this shape:
{ "shortNotes": { "summary": "2-3 sentences", "keyPoints": ["point"], "definitions": [{ "term": "", "def": "" }] } }
Maximum 8 keyPoints and 6 definitions. Keep each string concise.
${JSON_RULES}`,

    sampleExam: `${base}Generate a sample exam as JSON with exactly this shape:
{ "sampleExam": { "questions": [{ "q": "question", "answer": "model answer", "explanation": "brief explanation" }] } }
Maximum 5 questions. Keep q under 35 words; answer and explanation under 60 words each.
${JSON_RULES}`,

    mcqs: `${base}Generate multiple-choice questions as JSON with exactly this shape:
{ "mcqs": { "questions": [{ "q": "question", "options": ["A text","B text","C text","D text"], "correct": "A", "explanation": "why" }] } }
Maximum 8 questions. correct must be exactly "A", "B", "C", or "D". Keep q and options short.
${JSON_RULES}`,

    mindMap: `${base}Generate a mind map as JSON with exactly this shape:
{ "mindMap": {
  "root": "Topic Name",
  "branches": [
    { "id": "b1", "label": "Branch Title", "color": "teal", "subtopics": [{ "id": "s1", "label": "Subtopic" }] }
  ]
}}
color must be one of: teal, purple, amber, coral, blue — use a different color per branch.
Maximum 6 branches, 5 subtopics per branch. All labels max 5 words.
${JSON_RULES}`,

    examTips: `${base}Generate exam tips as JSON with exactly this shape:
{ "examTips": { "tips": ["tip"], "commonMistakes": ["mistake"], "timeManagement": "short paragraph" } }
Maximum 6 tips and 5 commonMistakes. Keep strings short.
${JSON_RULES}`
  };

  return prompts[outputKey] ?? '';
}

export const EXAM_TUTOR_OUTPUT_TOKEN_LIMITS: Record<string, number> = {
  cheatSheet: 2048,
  flashcards: 2048,
  shortNotes: 2048,
  sampleExam: 3072,
  mcqs: 3072,
  mindMap: 2048,
  examTips: 1536
};
