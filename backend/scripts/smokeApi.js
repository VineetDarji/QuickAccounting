const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { createV1Router } = require('../apiV1');

const main = async () => {
  const prisma = new PrismaClient();
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/v1', createV1Router({ prisma }));

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  try {
    const port = server.address().port;
    const resp = await fetch(`http://127.0.0.1:${port}/api/v1/health`);
    const json = await resp.json();
    // eslint-disable-next-line no-console
    console.log('API OK', { status: resp.status, json });
  } finally {
    server.close();
    await prisma.$disconnect();
  }
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('API FAIL', err);
  process.exitCode = 1;
});

