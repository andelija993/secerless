import prisma from '../lib/prisma.js';
import { cached } from '../lib/cache.js';

export async function getAllCategories(req, res) {
  res.json(await cached('categories:all', () => prisma.category.findMany({ orderBy: { name: 'asc' } })));
}

