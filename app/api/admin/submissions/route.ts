import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const password = url.searchParams.get('password');
  const type = url.searchParams.get('type') || undefined;
  const minScore = url.searchParams.get('minScore');
  const maxScore = url.searchParams.get('maxScore');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const where: any = {};

  if (type) where.type = type;
  if (minScore) where.aiScore = { ...where.aiScore, gte: Number(minScore) };
  if (maxScore) where.aiScore = { ...where.aiScore, lte: Number(maxScore) };
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ submissions });
}
