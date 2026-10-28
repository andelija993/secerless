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
        images: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
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


// Shared bulk handler: { ids: string[], action: 'publish' | 'unpublish' | 'delete' }
function bulkAction(model, label) {
  return async (req, res) => {
    try {
      const { ids, action } = req.body ?? {};
      if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No items selected' });
      const where = { id: { in: ids.map(String) } };
      let result;
      if ((action === 'feature' || action === 'unfeature') && model === 'recipe') {
        result = await prisma.recipe.updateMany({ where, data: { featured: action === 'feature' } });
      } else if (action === 'publish' || action === 'unpublish') {
        result = await prisma[model].updateMany({ where, data: { published: action === 'publish' } });
      } else if (action === 'delete') {
        result = await prisma[model].deleteMany({ where });
      } else {
        return res.status(400).json({ error: 'Unknown action' });
      }
      res.json({ count: result.count, action });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Bulk action on ${label} failed` });
    }
  };
}

// POST /api/admin/recipes/bulk and /api/admin/posts/bulk
export const adminBulkRecipes = bulkAction('recipe', 'recipes');
export const adminBulkPosts = bulkAction('blogPost', 'posts');

// PUT /api/admin/recipes/order — { ids: string[] } in the desired order (first = top).
// Recipes not in the list keep their position after the listed ones.
export async function adminReorderRecipes(req, res) {
  try {
    const { ids } = req.body ?? {};
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No order given' });
    // One single UPDATE for all rows (130+ separate updates over the network
    // exceeded Prisma's 5 s transaction timeout). WITH ORDINALITY gives 1, 2, 3…
    const list = ids.map(String);
    const count = await prisma.$executeRaw`
      UPDATE "Recipe" AS r
      SET "position" = v.ord::int
      FROM unnest(${list}::text[]) WITH ORDINALITY AS v(id, ord)
      WHERE r.id = v.id`;
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save the new order' });
  }
}
