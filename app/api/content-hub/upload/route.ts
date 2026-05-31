import { NextResponse } from 'next/server';
import { getServerSession } from '../../../../lib/session';
import prisma from '../../../../lib/prisma';
import { extractTextFromBuffer, sanitizeFileName, saveUploadedFile, buildPublicUrl, normalizeDriveFolderLink } from '../../../../lib/fileUtils';

const htmlToText = (html: string) => {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const fetchGoogleDriveFileList = async (folderLink: string) => {
  const normalized = normalizeDriveFolderLink(folderLink);
  if (!normalized) return [];

  const response = await fetch(normalized, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'text/html'
    }
  });

  if (!response.ok) {
    return [];
  }

  const html = await response.text();
  const driveFilePattern = /https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/g;
  const matches = Array.from(html.matchAll(driveFilePattern));
  const items = matches.slice(0, 10).map((match) => ({ fileUrl: match[0], fileName: 'Google Drive document' }));
  return items;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const formData = await request.formData();
    const moduleName = String(formData.get('moduleName') || '').trim();
    const folderLink = String(formData.get('folderLink') || '').trim();
    const files = formData.getAll('lectureFiles');

    if (!moduleName) {
      return NextResponse.json({ error: 'Module name is required.' }, { status: 400 });
    }

    const createdLectures: any[] = [];

    for (const item of files) {
      if (!(item instanceof File) || !item.name) continue;
      const buffer = Buffer.from(await item.arrayBuffer());
      const filename = `${Date.now()}-${sanitizeFileName(item.name)}`;
      await saveUploadedFile(filename, buffer);
      const fileUrl = buildPublicUrl(filename);
      const textContent = await extractTextFromBuffer(item.name, buffer);

      const lecture = await prisma.lecture.create({
        data: {
          userId: session.user.id,
          moduleName,
          fileName: item.name,
          fileUrl,
          textContent: textContent || null
        }
      });

      createdLectures.push(lecture);
    }

    if (folderLink) {
      const driveFiles = await fetchGoogleDriveFileList(folderLink);
      for (const item of driveFiles) {
        const lecture = await prisma.lecture.create({
          data: {
            userId: session.user.id,
            moduleName,
            fileName: item.fileName,
            fileUrl: item.fileUrl,
            textContent: htmlToText(item.fileName)
          }
        });
        createdLectures.push(lecture);
      }
    }

    if (createdLectures.length === 0) {
      return NextResponse.json({ error: 'No valid lecture files or Drive folder were provided.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, lectures: createdLectures });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lecture upload failed.' }, { status: 500 });
  }
}
