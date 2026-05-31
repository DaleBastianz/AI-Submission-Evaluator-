import { z } from 'zod';
import {
  geminiEndpoint,
  isDailyQuotaExhausted,
  isModelNotFoundError,
  isQuotaError,
  toUserFacingGeminiError
} from './geminiModels';
import { parseGeminiJSON } from './parseGeminiJSON';

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
Return ONLY raw JSON. No markdown, no code blocks, no explanation. Start your response with { and end with }.

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
  const models = ['gemini-2.0-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.5-pro'];
  let lastError: Error | null = null;

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  for (const model of models) {
    const endpoint = geminiEndpoint(model, apiKey);

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
              maxOutputTokens: 2048,
              responseMimeType: 'application/json'
            }
          })
        });

        const responseText = await response.text();

        if (!response.ok) {
          if (isModelNotFoundError(response.status, responseText) || isQuotaError(response.status, responseText)) {
            if (isDailyQuotaExhausted(responseText) || isModelNotFoundError(response.status, responseText)) {
              lastError = new Error(`Model unavailable or quota exhausted: ${model}`);
              break;
            }
            if (attempt < 3) {
              await sleep(1000 * attempt);
              continue;
            }
            lastError = new Error(`Rate limited on ${model}`);
            break;
          }
          if (response.status === 503 || response.status === 502 || response.status === 504) {
            lastError = new Error(`Gemini API transient error (model=${model}): ${response.status}`);
            await sleep(500 * attempt);
            continue;
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

        const parsed = parseGeminiJSON(rawText);
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

  throw new Error(toUserFacingGeminiError(lastError ?? new Error('Gemini API request failed for all supported models.')));
};
