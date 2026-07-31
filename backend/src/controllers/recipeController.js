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

// POST /api/recipes — create a new recipe (admin only)
export async function createRecipe(req, res) {
  try {
    const { title, slug, description, imageUrl, categoryId, ingredients = [], steps = [] } = req.body;

    const recipe = await prisma.recipe.create({
      data: {
        title,
        slug,
        description,
        imageUrl,
        categoryId: categoryId || undefined,
        authorId: req.user.id, // always the logged-in admin — never trust the body
        ingredients: { create: ingredients.map((text, i) => ({ text, order: i })) },
        steps: { create: steps.map((text, i) => ({ text, order: i })) },
      },
      include: {
        category: true,
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { order: 'asc' } },
      },
    });
    res.status(201).json(recipe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
}

// PUT /api/recipes/:id — full update including ingredient/step replacement (admin only)
export async function updateRecipe(req, res) {
  try {
    const { title, slug, description, imageUrl, categoryId, published, ingredients, steps } = req.body;
    const id = req.params.id;

    // Update the main recipe record (only fields that were sent)
    await prisma.recipe.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(published !== undefined && { published }),
      },
    });

    // Replace ingredients if provided — delete all, then re-insert in order
    if (Array.isArray(ingredients)) {
      await prisma.ingredient.deleteMany({ where: { recipeId: id } });
      if (ingredients.length) {
        await prisma.ingredient.createMany({
          data: ingredients.map((text, i) => ({ text, order: i, recipeId: id })),
        });
      }
    }

    // Replace steps if provided
    if (Array.isArray(steps)) {
      await prisma.step.deleteMany({ where: { recipeId: id } });
      if (steps.length) {
        await prisma.step.createMany({
          data: steps.map((text, i) => ({ text, order: i, recipeId: id })),
        });
      }
    }

    // Return the fully-populated recipe so the UI can update without a page reload
    const updated = await prisma.recipe.findUnique({
      where: { id },
      include: {
        category: true,
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { order: 'asc' } },
      },
    });
    res.json(updated);
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

