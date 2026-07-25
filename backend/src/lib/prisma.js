import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

const { PrismaClient } = pkg;

dotenv.config();

// Prisma 7 requires an explicit driver adapter instead of reading
// DATABASE_URL directly from the schema file.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// A single shared Prisma Client instance for the whole app.
// (Creating a new one per request would exhaust database connections.)
const prisma = new PrismaClient({ adapter });

export default prisma;

