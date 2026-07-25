import prisma from '../lib/prisma.js';

// GET /api/recipes — list all published recipes (with category + author name)
export async function getAllRecipes(req, res) {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { published: true },
      include: { category: true, author: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
}

// GET /api/recipes/:slug — one recipe with full ingredients/steps
export async function getRecipeBySlug(req, res) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { order: 'asc' } },
        author: { select: { firstName: true, lastName: true } },
      },
    });
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
}

// POST /api/recipes — create a new recipe (admin-only, enforced later in Phase 3)
export async function createRecipe(req, res) {
  try {
    const { title, slug, description, imageUrl, categoryId, authorId, ingredients = [], steps = [] } = req.body;

    const recipe = await prisma.recipe.create({
      data: {
        title,
        slug,
        description,
        imageUrl,
        categoryId: categoryId || undefined,
        authorId,
        ingredients: { create: ingredients.map((text, i) => ({ text, order: i })) },
        steps: { create: steps.map((text, i) => ({ text, order: i })) },
      },
      include: { ingredients: true, steps: true },
    });
    res.status(201).json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
}

// PUT /api/recipes/:id — update a recipe (admin-only, enforced later in Phase 3)
export async function updateRecipe(req, res) {
  try {
    const { title, description, imageUrl, categoryId, published } = req.body;
    const recipe = await prisma.recipe.update({
      where: { id: req.params.id },
      data: { title, description, imageUrl, categoryId, published },
    });
    res.json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
}

// DELETE /api/recipes/:id — remove a recipe (admin-only, enforced later in Phase 3)
export async function deleteRecipe(req, res) {
  try {
    await prisma.recipe.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
}

