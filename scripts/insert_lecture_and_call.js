(async () => {
  try {
    // attempt to populate DATABASE_URL from .env.local when running standalone
    try {
      const fs = require('fs');
      const envText = fs.readFileSync('.env.local', 'utf8');
      const mdb = envText.match(/^\s*DATABASE_URL\s*=\s*(?:\"([^\"]*)\"|'([^']*)'|([^#\n]*))/m);
      if (mdb) process.env.DATABASE_URL = mdb[1] || mdb[2] || (mdb[3] || '').trim();
    } catch (e) {
      // ignore
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const userId = 'debug-user-1';

    // upsert a user so foreign key exists
    await prisma.user.upsert({
      where: { email: 'debug+user@example.com' },
      update: {},
      create: {
        id: userId,
        name: 'Debug User',
        email: 'debug+user@example.com',
        password: 'changeme'
      }
    });

    const lecture = await prisma.lecture.create({
      data: {
        userId,
        moduleName: 'Debug Module',
        fileName: 'debug.txt',
        fileUrl: '',
        textContent: 'This is debug lecture content about stacks and queues. Use this to generate outputs.'
      }
    });

    console.log('Inserted lecture id:', lecture.id);

    // call the API
    const fetch = global.fetch || require('node-fetch');
    const endpoint = 'http://localhost:3000/api/exam-tutor/generate';
    const body = {
      lectureIds: [lecture.id],
      selectedOutputs: ['cheatSheet']
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
        'x-user-email': 'debug+user@example.com',
        'x-user-name': 'Debug User'
      },
      body: JSON.stringify(body)
    });

    const text = await res.text();
    console.log('API STATUS', res.status);
    console.log('API RAW RESPONSE:\n', text);

    await prisma.$disconnect();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
