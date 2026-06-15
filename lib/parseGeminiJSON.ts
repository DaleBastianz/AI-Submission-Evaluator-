function stripCodeFences(text: string) {
  return text
    .replace(/```(?:json)?/gi, '')
    .replace(/^```/gm, '')
    .replace(/```$/gm, '')
    .trim();
}

function normalizeJsonCandidate(text: string) {
  const start = text.search(/[\[{]/);
  if (start === -1) return text.trim();
  return text.slice(start).trim();
}

function fixTrailingCommas(text: string) {
  return text
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');
}

/** Close truncated strings/arrays/objects so JSON.parse can recover partial Gemini output. */
function repairTruncatedJson(text: string, startIndex = 0) {
  let inString = false;
  let escaped = false;
  const stack: Array<'{' | '['> = [];

  for (let i = startIndex; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') stack.push('{');
    else if (char === '[') stack.push('[');
    else if (char === '}' && stack[stack.length - 1] === '{') stack.pop();
    else if (char === ']' && stack[stack.length - 1] === '[') stack.pop();
  }

  let repaired = text.slice(startIndex);
  if (inString) repaired += '"';
  repaired = repaired.replace(/,\s*$/, '');

  while (stack.length) {
    const open = stack.pop();
    repaired += open === '{' ? '}' : ']';
  }

  return fixTrailingCommas(repaired);
}

function tryParse(text: string) {
  return JSON.parse(fixTrailingCommas(text));
}

function extractBalancedJson(text: string) {
  const start = text.search(/[\[{]/);
  if (start === -1) return null;

  const opening = text[start];
  const closing = opening === '{' ? '}' : ']';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === opening) depth += 1;
    else if (char === closing) {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

export function parseGeminiJSON(text: string) {
  const cleaned = normalizeJsonCandidate(stripCodeFences(text));

  if (!cleaned) {
    throw new Error('Empty response received from Gemini.');
  }

  const attempts = [
    cleaned,
    extractBalancedJson(cleaned),
    repairTruncatedJson(cleaned)
  ].filter((value): value is string => Boolean(value));

  const uniqueAttempts = [...new Set(attempts)];

  let lastError: unknown;

  for (const candidate of uniqueAttempts) {
    try {
      return tryParse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  const preview = cleaned.substring(0, 300);
  const hint =
    cleaned.includes('"questions"') || cleaned.length > 1500
      ? ' The AI response may have been cut off — try again with fewer items or shorter source content.'
      : '';

  throw new Error(
    `Unable to parse Gemini JSON: malformed structure. First 300 chars: ${preview}${hint}`
  );
}
