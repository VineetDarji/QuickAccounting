const { PrismaClient } = require('@prisma/client');

const main = async () => {
  const prisma = new PrismaClient();
  try {
    const result = await prisma.$queryRawUnsafe('SELECT 1 AS ok');
    // eslint-disable-next-line no-console
    console.log('DB OK', result);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('DB FAIL', err);
  process.exitCode = 1;
});

