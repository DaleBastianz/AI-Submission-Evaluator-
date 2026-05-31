export function parseGeminiJSON(text: string) {
  const cleaned = text.replace(/```(?:json)?/gi, '').trim();
  if (!cleaned) {
    throw new Error('Empty response received from Gemini.');
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstBracket = cleaned.search(/[\[{]/);
    if (firstBracket === -1) {
      throw new Error(`Unable to parse Gemini JSON response: ${cleaned}`);
    }

    const opening = cleaned[firstBracket];
    const closing = opening === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = firstBracket; i < cleaned.length; i += 1) {
      const char = cleaned[i];
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
      }
      if (inString) {
        continue;
      }
      if (char === opening) {
        depth += 1;
      } else if (char === closing) {
        depth -= 1;
        if (depth === 0) {
          const candidate = cleaned.slice(firstBracket, i + 1);
          return JSON.parse(candidate);
        }
      }
    }

    throw new Error(`Unable to parse Gemini JSON response: ${cleaned}`);
  }
}
