// Prisma CLI/migration config (the app's client is set up in src/lib/prisma.js)
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    seed: 'node prisma/seed.js',
  },
});

