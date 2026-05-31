import { z } from 'zod';

const evaluationSchema = z.object({
  score: z.number().int().min(0).max(100),
  grade: z.enum(['A', 'B', 'C', 'D', 'F']),
  criteria: z.object({
    understanding: z.number().min(0).max(100),
    code_quality: z.number().min(0).max(100),
    creativity: z.number().min(0).max(100),
    completeness: z.number().min(0).max(100),
    documentation: z.number().min(0).max(100),
    real_world: z.number().min(0).max(100)
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  improvements: z.array(z.string()),
  plagiarism_flag: z.boolean(),
  ai_generated_flag: z.boolean(),
  final_feedback: z.string()
});

const extractJson = (text: string) => {
  if (!text || typeof text !== 'string') throw new Error('No text to extract JSON from.');

  let trimmed = text.trim();
  // strip common fences
  trimmed = trimmed.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();

  // If AI returned the JSON as a quoted string, unquote it first
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      const unquoted = JSON.parse(trimmed);
      if (typeof unquoted === 'string' && unquoted.trim().length) {
        trimmed = unquoted.trim();
      }
    } catch (e) {
      // ignore and continue
    }
  }

  const idx = trimmed.search(/[\{\[]/);
  if (idx === -1) throw new Error('AI response did not contain JSON object');

  const open = trimmed[idx];
  const close = open === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = idx; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) {
        return trimmed.slice(idx, i + 1);
      }
    }
  }

  throw new Error('AI response did not contain JSON object');
};

const parseAICandidate = (responseBody: any) => {
  if (!responseBody) {
    throw new Error('Empty AI response body');
  }

  const candidateText =
    responseBody?.candidates?.[0]?.content?.parts?.[0]?.text ||
    responseBody?.candidates?.[0]?.output ||
    responseBody?.candidates?.[0]?.content ||
    responseBody?.output?.[0]?.content?.[0]?.text ||
    responseBody?.output_text ||
    responseBody?.text ||
    responseBody?.result?.[0]?.content ||
    responseBody?.response?.output_text;

  if (!candidateText || typeof candidateText !== 'string') {
    throw new Error('Cannot parse AI response text');
  }

  return candidateText;
};

const buildSystemPrompt = (content: string) => {
  return `You are an expert assignment evaluator for software development and product-focused submissions.
Evaluate the submission exactly on these dimensions:
- understanding of problem
- code quality / logic
- creativity
- completeness
- documentation
- real-world applicability

Only respond with valid JSON containing the exact fields below.
Do not add prose, commentary, or markdown outside the JSON.

Output schema:
{
  "score": 0-100,
  "grade": "A" | "B" | "C" | "D" | "F",
  "criteria": {
    "understanding": number,
    "code_quality": number,
    "creativity": number,
    "completeness": number,
    "documentation": number,
    "real_world": number
  },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvements": ["..."],
  "plagiarism_flag": boolean,
  "ai_generated_flag": boolean,
  "final_feedback": "..."
}

Submission content:
${content}
`;
};

export const evaluateSubmission = async (contentText: string) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const systemPrompt = buildSystemPrompt(contentText);
  const models = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'];
  let lastError: Error | null = null;

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    // retry per-model for transient errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1024
            }
          })
        });

        const responseText = await response.text();

        if (!response.ok) {
          // transient statuses: retry
          if (response.status === 429 || response.status === 503 || response.status === 502 || response.status === 504) {
            lastError = new Error(`Gemini API transient error (model=${model} attempt=${attempt}): ${response.status} ${responseText}`);
            // exponential backoff
            await sleep(500 * attempt);
            continue;
          }
          // if model not found or permanently failing, break to try next model
          if (response.status === 404) {
            lastError = new Error(`Gemini model not found: ${model} (${response.status})`);
            break;
          }
          throw new Error(`Gemini API call failed: ${response.status} ${responseText}`);
        }

        const data = (() => {
          try {
            return JSON.parse(responseText);
          } catch (e) {
            // some responses may already be plain text; keep raw
            return { text: responseText };
          }
        })();

        const rawText = parseAICandidate(data);

        if (!rawText) {
          throw new Error('Empty response from Gemini API');
        }

        const jsonText = extractJson(rawText);
        const parsed = JSON.parse(jsonText);
        const validated = evaluationSchema.parse(parsed);

        return validated;
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          throw new Error(`Evaluation validation failed: ${error.message}`);
        }
        lastError = error;
        // if last attempt for this model, break to try the next model
        if (attempt < 3) {
          await sleep(300 * attempt);
          continue;
        }
        break;
      }
    }
  }

  throw lastError ?? new Error('Gemini API request failed for all supported models.');
};
