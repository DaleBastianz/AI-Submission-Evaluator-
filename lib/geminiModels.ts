/** Models to try in order (v1beta generateContent). Prefer 2.0-flash — separate free-tier quota. */
export const GEMINI_MODEL_FALLBACKS = [
  'gemini-2.0-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
] as const;

export const GEMINI_MAX_LECTURE_CHARS = 14_000;

export function geminiEndpoint(model: string, apiKey: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

export function modelsToTry(preferred?: string) {
  if (!preferred) return [...GEMINI_MODEL_FALLBACKS];
  return [preferred, ...GEMINI_MODEL_FALLBACKS.filter((m) => m !== preferred)];
}

export function isModelNotFoundError(status: number, responseText: string) {
  return status === 404 || /not found|NOT_FOUND/i.test(responseText);
}

export function isQuotaError(status: number, responseText: string) {
  return status === 429 || /RESOURCE_EXHAUSTED|quota exceeded|rate limit/i.test(responseText);
}

export function isDailyQuotaExhausted(responseText: string) {
  return /PerDay|free_tier|GenerateRequestsPerDay/i.test(responseText);
}

export function truncateForPrompt(text: string, maxChars = GEMINI_MAX_LECTURE_CHARS) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[Content truncated to stay within AI limits.]`;
}

export function toUserFacingGeminiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/GEMINI_API_KEY is not configured/i.test(message)) {
    return 'AI is not configured. Add GEMINI_API_KEY to your .env.local file and restart the server.';
  }

  if (/429|RESOURCE_EXHAUSTED|quota/i.test(message)) {
    return (
      'Google AI quota limit reached. The free tier allows limited requests per day per model. ' +
      'Wait a few minutes and try again, switch to a paid API key in Google AI Studio, or try again tomorrow. ' +
      'Details: https://ai.google.dev/gemini-api/docs/rate-limits'
    );
  }

  if (/404|not found|NOT_FOUND/i.test(message)) {
    return 'The requested AI model is unavailable. Please refresh the page and try again.';
  }

  if (message.startsWith('Gemini API error')) {
    return toUserFacingGeminiError(message.replace(/^Gemini API error \d+:\s*/, ''));
  }

  try {
    const parsed = JSON.parse(message);
    const apiMessage = parsed?.error?.message;
    if (apiMessage) return toUserFacingGeminiError(apiMessage);
  } catch {
    // not JSON
  }

  if (message.length > 320) {
    return `${message.slice(0, 320)}…`;
  }

  return message || 'AI request failed. Please try again.';
}
