export function parseGeminiJSON(text: string) {
  let cleaned = text
    .replace(/```(?:json)?/gi, '')
    .replace(/^[^\[{]*/, '') // remove any text before first bracket
    .replace(/[^\]{}]*$/, '') // remove any text after last bracket
    .trim();

  if (!cleaned) {
    throw new Error('Empty response received from Gemini.');
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const firstBracket = cleaned.search(/[\[{]/);
    if (firstBracket === -1) {
      throw new Error(`Unable to parse Gemini JSON: no JSON structure found in response. Raw: ${text.substring(0, 200)}`);
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
          try {
            return JSON.parse(candidate);
          } catch (innerError) {
            // If still failing, try to fix common issues
            const fixed = candidate
              .replace(/[\n\r]/g, ' ') // normalize whitespace
              .replace(/,\s*}/g, '}') // remove trailing commas in objects
              .replace(/,\s*]/g, ']'); // remove trailing commas in arrays
            return JSON.parse(fixed);
          }
        }
      }
    }

    throw new Error(`Unable to parse Gemini JSON: malformed structure. First 300 chars: ${cleaned.substring(0, 300)}`);
  }
}
