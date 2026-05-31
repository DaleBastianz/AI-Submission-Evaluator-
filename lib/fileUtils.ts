import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

const textExtensions = ['.txt', '.md', '.html', '.htm', '.py', '.js', '.ts', '.jsx', '.tsx', '.java', '.cpp', '.c', '.h', '.rb', '.go', '.rs', '.php', '.sql', '.json', '.xml', '.yaml', '.yml', '.css', '.scss', '.sh', '.bash'];

export const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '-');

export const saveUploadedFile = async (filename: string, buffer: Buffer) => {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
};

const htmlToText = (html: string) => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const extractTextFromBuffer = async (filename: string, buffer: Buffer) => {
  const extension = path.extname(filename).toLowerCase();

  if (extension === '.pdf') {
    const parsed = await pdfParse(buffer);
    return parsed.text.trim();
  }

  if (extension === '.docx') {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value.trim();
  }

  if (extension === '.html' || extension === '.htm') {
    return htmlToText(buffer.toString('utf-8'));
  }

  if (textExtensions.includes(extension)) {
    return buffer.toString('utf-8').trim();
  }

  return '';
};

export const buildPublicUrl = (filename: string) => {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || '';
  return `${base}/uploads/${filename}`;
};

export const normalizeDriveFolderLink = (link: string) => {
  const match = link.match(/[-\w]{25,}/);
  return match ? `https://drive.google.com/drive/folders/${match[0]}` : null;
};
