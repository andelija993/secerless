// Prisma 7 moved CLI/migration configuration out of schema.prisma and into
// this dedicated config file. The PrismaClient itself (used in our app code,
// see src/lib/prisma.js) is configured separately via a driver adapter.
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

