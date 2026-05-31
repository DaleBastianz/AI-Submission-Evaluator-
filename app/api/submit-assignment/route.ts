import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { getServerSession } from '../../../lib/session';
import prisma from '../../../lib/prisma';
import { evaluateSubmission } from '../../../lib/evaluator';
import { toUserFacingGeminiError } from '../../../lib/geminiModels';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '-');

const htmlToText = (html: string) => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const fetchGitHubReadme = async (url: string) => {
  const githubMatch = url.match(/github\.com\/([^/]+)\/([^/]+)(?:\/tree\/[^/]+(?:\/(.*))?)?/i);
  if (!githubMatch) return null;

  const owner = githubMatch[1];
  const repo = githubMatch[2];
  const branch = 'main';
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;

  try {
    const res = await fetch(rawUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch {
    return null;
  }
};

const extractTextFromUrl = async (link: string) => {
  const normalized = link.trim();
  const githubReadme = await fetchGitHubReadme(normalized);
  if (githubReadme) return githubReadme;

  const response = await fetch(normalized, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) {
    throw new Error('Unable to fetch link content.');
  }

  const html = await response.text();
  return htmlToText(html);
};

const validateEmail = (value?: string) => {
  return Boolean(value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    const formData = await request.formData();
    const title = formData.get('title')?.toString().trim();
    const type = formData.get('type')?.toString();
    const contentText = formData.get('contentText')?.toString().trim();
    const link = formData.get('link')?.toString().trim();
    const file = formData.get('assignmentFile') as File | null;

    const name = session?.user?.name ?? formData.get('name')?.toString().trim();
    const email = session?.user?.email ?? formData.get('email')?.toString().trim();
    const userId = session?.user?.id ?? null;

    if (!email || !title || !type) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: 'Provide a valid email address.' }, { status: 400 });
    }

    const submitterName = name || email.split('@')[0] || 'Student';

    let extractedText = '';
    let fileUrl: string | null = null;

    if (type === 'text') {
      if (!contentText) {
        return NextResponse.json({ error: 'Assignment text is required.' }, { status: 400 });
      }
      extractedText = contentText;
    }

    if (type === 'link') {
      if (!link) {
        return NextResponse.json({ error: 'Assignment link is required.' }, { status: 400 });
      }
      extractedText = await extractTextFromUrl(link);
    }

    if (type === 'file') {
      if (!file || !file.name) {
        return NextResponse.json({ error: 'Assignment file is required.' }, { status: 400 });
      }

      const filename = `${Date.now()}-${sanitizeFileName(file.name)}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      fileUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''}/uploads/${filename}`;

      const extension = path.extname(file.name).toLowerCase();
      const textExtensions = ['.txt', '.md', '.html', '.htm', '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.h', '.rb', '.go', '.rs', '.php', '.sql', '.json', '.xml', '.yaml', '.yml', '.css', '.scss', '.sh', '.bash'];
      
      if (extension === '.pdf') {
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text;
      } else if (extension === '.docx') {
        const parsed = await mammoth.extractRawText({ buffer });
        extractedText = parsed.value;
      } else if (textExtensions.includes(extension)) {
        extractedText = buffer.toString('utf-8');
      } else {
        return NextResponse.json({ error: `Unsupported file type. Supported: PDF, DOCX, TXT, MD, HTML, Python, JavaScript, TypeScript, Java, C++, Ruby, Go, Rust, PHP, SQL, JSON, XML, YAML, CSS, Shell scripts and more.` }, { status: 400 });
      }
    }

    if (!extractedText || extractedText.length < 20) {
      return NextResponse.json({ error: 'Unable to extract enough content for evaluation.' }, { status: 400 });
    }

    const aiRequestContent = `Name: ${submitterName}\nEmail: ${email}\nTitle: ${title}\nType: ${type}\nLink: ${link || 'N/A'}\nFile URL: ${fileUrl || 'N/A'}\n\nContent:\n${extractedText}`;
    const aiFeedback = await evaluateSubmission(aiRequestContent);

    const submission = await prisma.submission.create({
      data: {
        userId,
        name: submitterName,
        email,
        title,
        type,
        contentText: extractedText,
        fileUrl,
        link: type === 'link' ? link : null,
        aiScore: aiFeedback.score,
        aiGrade: aiFeedback.grade,
        aiFeedback
      }
    });

    return NextResponse.json({ success: true, submissionId: submission.id, score: aiFeedback.score, grade: aiFeedback.grade, feedback: aiFeedback });
  } catch (error: any) {
    return NextResponse.json({ error: toUserFacingGeminiError(error) }, { status: 500 });
  }
}
