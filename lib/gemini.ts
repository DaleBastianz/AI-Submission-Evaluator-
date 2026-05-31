import { z } from 'zod';

const extractJson = (text: string) => {
  if (!text || typeof text !== 'string') throw new Error('No text to extract JSON from.');

  // Remove common code fences
  let trimmed = text.trim();
  trimmed = trimmed.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();

  // find first JSON opener ({ or [) and extract the balanced JSON substring
  const idx = trimmed.search(/[\{\[]/);
  if (idx === -1) throw new Error('Gemini response did not contain valid JSON.');

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

  throw new Error('Gemini response did not contain valid JSON.');
};

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

export const callGemini = async (prompt: string, model = 'gemini-2.5-flash', maxOutputTokens = 1200) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens,
          topP: 0.95,
          candidateCount: 1
        }
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      if ([429, 502, 503, 504].includes(response.status) && attempt < 3) {
        await sleep(400 * attempt);
        continue;
      }
      throw new Error(`Gemini API error ${response.status}: ${responseText}`);
    }

    const data = (() => {
      try {
        return JSON.parse(responseText);
      } catch (e) {
        return { text: responseText };
      }
    })();

    const rawText = parseAICandidate(data);
    const jsonText = extractJson(rawText);
    return JSON.parse(jsonText);
  }
  throw new Error('Gemini API failed after retries.');
};

export const callGeminiText = async (prompt: string, model = 'gemini-2.5-flash', maxOutputTokens = 1200) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens,
          topP: 0.95,
          candidateCount: 1
        }
      })
    });

    const responseText = await response.text();
    if (!response.ok) {
      if ([429, 502, 503, 504].includes(response.status) && attempt < 3) {
        await sleep(400 * attempt);
        continue;
      }
      throw new Error(`Gemini API error ${response.status}: ${responseText}`);
    }

    const data = (() => {
      try {
        return JSON.parse(responseText);
      } catch (e) {
        return { text: responseText };
      }
    })();

    const rawText = parseAICandidate(data);
    return rawText;
  }

  throw new Error('Gemini API failed after retries.');
};
