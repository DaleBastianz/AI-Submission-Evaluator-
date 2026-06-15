import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const lectures = await prisma.lecture.count();
  console.log(JSON.stringify({ ok: true, users, lectures }));
}

main()
  .catch((error) => {
    console.error(JSON.stringify({ ok: false, code: error.code, message: error.message }));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
