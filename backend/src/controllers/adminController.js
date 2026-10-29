import prisma from '../lib/prisma.js';

const author = { select: { firstName: true, lastName: true } };
const ordered = { orderBy: { order: 'asc' } };

// Admin lists include drafts (the public endpoints only return published items)
export async function getRecipes(req, res) {
  const recipes = await prisma.recipe.findMany({
    include: { category: true, author, ingredients: ordered, steps: ordered, images: ordered },
    orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
  });
  res.json(recipes);
}

export async function getPosts(req, res) {
  const posts = await prisma.blogPost.findMany({ include: { author }, orderBy: { createdAt: 'desc' } });
  res.json(posts);
}

// Body: { ids: string[], action: 'publish' | 'unpublish' | 'delete' | 'feature' | 'unfeature' }
function bulkAction(model) {
  return async (req, res) => {
    const { ids, action } = req.body ?? {};
    if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No items selected' });

    const where = { id: { in: ids.map(String) } };
    const updates = {
      publish: { published: true },
      unpublish: { published: false },
      ...(model === 'recipe' && { feature: { featured: true }, unfeature: { featured: false } }),
    };

    let result;
    if (action === 'delete') result = await prisma[model].deleteMany({ where });
    else if (updates[action]) result = await prisma[model].updateMany({ where, data: updates[action] });
    else return res.status(400).json({ error: 'Unknown action' });

    res.json({ count: result.count, action });
  };
}

export const bulkRecipes = bulkAction('recipe');
export const bulkPosts = bulkAction('blogPost');

// Body: { ids } in display order. One UPDATE for all rows — separate updates
// over the network exceeded Prisma's transaction timeout.
export async function reorderRecipes(req, res) {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'No order given' });

  const count = await prisma.$executeRaw`
    UPDATE "Recipe" AS r
    SET "position" = v.ord::int
    FROM unnest(${ids.map(String)}::text[]) WITH ORDINALITY AS v(id, ord)
    WHERE r.id = v.id`;
  res.json({ count });
}

