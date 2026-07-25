import prisma from '../lib/prisma.js';

// GET /api/categories — used for recipe filtering dropdowns
export async function getAllCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

