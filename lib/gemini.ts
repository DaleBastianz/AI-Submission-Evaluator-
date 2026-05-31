import { parseGeminiJSON } from './parseGeminiJSON';
import {
  geminiEndpoint,
  isDailyQuotaExhausted,
  isModelNotFoundError,
  isQuotaError,
  modelsToTry,
  toUserFacingGeminiError
} from './geminiModels';

const parseAICandidate = (responseBody: any) => {
  const candidateText =
    responseBody?.candidates?.[0]?.content?.parts?.[0]?.text ||
    responseBody?.candidates?.[0]?.output ||
    responseBody?.candidates?.[0]?.content ||
    responseBody?.output?.[0]?.content?.[0]?.text ||
    responseBody?.output_text ||
    responseBody?.text ||
    responseBody?.response?.output_text;

  if (!candidateText || typeof candidateText !== 'string') {
    throw new Error('Unable to parse Gemini response content.');
  }

  return candidateText;
};

type GenerateOptions = {
  maxOutputTokens: number;
  jsonMode: boolean;
  temperature: number;
};

class GeminiModelError extends Error {
  modelNotFound?: boolean;
  quotaExhausted?: boolean;

  constructor(message: string, flags: { modelNotFound?: boolean; quotaExhausted?: boolean } = {}) {
    super(message);
    this.modelNotFound = flags.modelNotFound;
    this.quotaExhausted = flags.quotaExhausted;
  }
}

async function generateOnce(model: string, prompt: string, apiKey: string, options: GenerateOptions) {
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const endpoint = geminiEndpoint(model, apiKey);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
          topP: 0.95,
          candidateCount: 1,
          ...(options.jsonMode ? { responseMimeType: 'application/json' } : {})
        }
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      if (isModelNotFoundError(response.status, responseText)) {
        throw new GeminiModelError(`Gemini model not found: ${model}`, { modelNotFound: true });
      }

      if (isQuotaError(response.status, responseText)) {
        if (isDailyQuotaExhausted(responseText)) {
          throw new GeminiModelError(`Quota exhausted for ${model}`, { quotaExhausted: true });
        }
        if (attempt < 3) {
          const retryMatch = responseText.match(/"retryDelay":\s*"(\d+)s"/);
          const delayMs = retryMatch ? Number(retryMatch[1]) * 1000 + 500 : 2000 * attempt;
          await sleep(Math.min(delayMs, 15_000));
          continue;
        }
        throw new GeminiModelError(`Rate limited on ${model}`, { quotaExhausted: true });
      }

      if ([502, 503, 504].includes(response.status) && attempt < 3) {
        await sleep(500 * attempt);
        continue;
      }

      throw new Error(`Gemini API error ${response.status}: ${responseText}`);
    }

    const data = (() => {
      try {
        return JSON.parse(responseText);
      } catch {
        return { text: responseText };
      }
    })();

    return parseAICandidate(data);
  }

  throw new Error('Gemini API failed after retries.');
}

async function runWithModelFallback(
  prompt: string,
  preferredModel: string | undefined,
  maxOutputTokens: number,
  jsonMode: boolean
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  let lastError: Error | null = null;
  const temperature = jsonMode ? 0.2 : 0.3;

  for (const model of modelsToTry(preferredModel)) {
    try {
      const rawText = await generateOnce(model, prompt, apiKey, {
        maxOutputTokens,
        jsonMode,
        temperature
      });
      return jsonMode ? parseGeminiJSON(rawText) : rawText;
    } catch (error: any) {
      lastError = error;
      if (error instanceof GeminiModelError && (error.modelNotFound || error.quotaExhausted)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(toUserFacingGeminiError(lastError));
}

export const callGemini = async (prompt: string, preferredModel?: string, maxOutputTokens = 2048) => {
  return runWithModelFallback(prompt, preferredModel, maxOutputTokens, true);
};

export const callGeminiText = async (prompt: string, preferredModel?: string, maxOutputTokens = 2048) => {
  return runWithModelFallback(prompt, preferredModel, maxOutputTokens, false);
};
