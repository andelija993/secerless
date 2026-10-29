import prisma from '../lib/prisma.js';
import { cached } from '../lib/cache.js';

const author = { select: { firstName: true, lastName: true } };
const ordered = { orderBy: { order: 'asc' } };
const fullInclude = { category: true, ingredients: ordered, steps: ordered, images: ordered };

const percent = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : 50;
};

const toLine = (item, order) =>
  typeof item === 'string'
    ? { text: item, textSr: null, order }
    : { text: item?.text ?? '', textSr: item?.textSr || null, order };

const toImage = (img, order) => ({ url: img.url, caption: img.caption || null, order, posY: percent(img.posY) });

// Builds Prisma data from the request body, only for fields that were sent.
// `replace` swaps out existing ingredients/steps/images (used when updating).
function recipeData(body, replace = false) {
  const data = {};
  for (const key of ['title', 'slug', 'description', 'imageUrl', 'published']) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  for (const key of ['titleSr', 'descriptionSr', 'videoUrl', 'categoryId']) {
    if (body[key] !== undefined) data[key] = body[key] || null;
  }
  if (body.featured !== undefined) data.featured = !!body.featured;
  if (body.imagePosY !== undefined) data.imagePosY = percent(body.imagePosY);

  const children = { ingredients: toLine, steps: toLine, images: toImage };
  for (const [key, map] of Object.entries(children)) {
    if (Array.isArray(body[key])) {
      data[key] = { ...(replace && { deleteMany: {} }), create: body[key].map(map) };
    }
  }
  return data;
}

export async function getAllRecipes(req, res) {
  const recipes = await cached('recipes:all', () =>
    prisma.recipe.findMany({
      where: { published: true },
      include: { category: true, author },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    })
  );
  res.json(recipes);
}

export async function getRecipeBySlug(req, res) {
  const { slug } = req.params;
  const recipe = await cached(`recipes:slug:${slug}`, () =>
    prisma.recipe.findUnique({ where: { slug }, include: { ...fullInclude, author } })
  );
  if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
  res.json(recipe);
}

export async function createRecipe(req, res) {
  // New recipes go to the top of the manual order
  const first = await prisma.recipe.findFirst({ orderBy: { position: 'asc' }, select: { position: true } });
  const recipe = await prisma.recipe.create({
    data: { ...recipeData(req.body), position: (first?.position ?? 1) - 1, authorId: req.user.id },
    include: fullInclude,
  });
  res.status(201).json(recipe);
}

export async function updateRecipe(req, res) {
  const recipe = await prisma.recipe.update({
    where: { id: req.params.id },
    data: recipeData(req.body, true),
    include: fullInclude,
  });
  res.json(recipe);
}

export async function deleteRecipe(req, res) {
  await prisma.recipe.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

