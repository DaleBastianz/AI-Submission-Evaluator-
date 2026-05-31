(async () => {
  try {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // try to read from .env.local
      try {
        const fs = require('fs');
        const envText = fs.readFileSync('.env.local', 'utf8');
        const m = envText.match(/^\s*GEMINI_API_KEY\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^#\n]*))/m);
        if (m) apiKey = m[1] || m[2] || (m[3] || '').trim();
      } catch (e) {
        // ignore
      }
    }
    if (!apiKey) {
      console.error('No GEMINI_API_KEY in env or .env.local');
      process.exit(2);
    }

    const prompt = `You are an exam tutor assistant. Use only the lecture content below to generate the requested study resources. If a requested resource is not possible, return an empty structure.\n\nLecture content:\nLecture 1 (Test Lecture):\nThis is a short test lecture about stacks and queues.\n\nGenerate the following outputs exactly in JSON with these keys: cheatSheet, flashcards, shortNotes, sampleExam, mcqs, mindMap, examTips.\n\nOnly include the keys exactly as described. Do not write any markdown, commentary, or extraneous text.\n\nSelected outputs: [\"cheatSheet\"]\n`;

    const model = process.argv[2] || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    console.log('Using model:', model);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800, candidateCount: 1 }
      })
    });

    const text = await res.text();
    console.log('STATUS', res.status);
    console.log('RAW RESPONSE:\n', text);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
