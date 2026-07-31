import prisma from '../lib/prisma.js';

// GET /api/admin/recipes — ALL recipes including drafts, with full detail
// (The public GET /api/recipes only returns published ones)
export async function adminGetRecipes(req, res) {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        category: true,
        author: { select: { firstName: true, lastName: true } },
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
}

// GET /api/admin/posts — ALL blog posts including drafts
export async function adminGetPosts(req, res) {
  try {
    const posts = await prisma.blogPost.findMany({
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
}

