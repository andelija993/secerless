import prisma from '../lib/prisma.js';
import { cached } from '../lib/cache.js';

const fullInclude = {
  category: true,
  ingredients: { orderBy: { order: 'asc' } },
  steps: { orderBy: { order: 'asc' } },
  images: { orderBy: { order: 'asc' } },
};

// Ingredients/steps may be sent as plain strings (English only)
// or as { text, textSr } objects for bilingual content.
const toLine = (item, i) =>
  typeof item === 'string'
    ? { text: item, textSr: null, order: i }
    : { text: item?.text ?? '', textSr: item?.textSr || null, order: i };

const emptyToNull = (v) => (v === '' ? null : v);

// Image framing: focus point 0–100 % and zoom 1–3
const clamp = (v, min, max, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const toImage = (img, i) => ({
  url: img.url,
  caption: img.caption || null,
  order: i,
  posX: Math.round(clamp(img.posX, 0, 100, 50)),
  posY: Math.round(clamp(img.posY, 0, 100, 50)),
  zoom: clamp(img.zoom, 1, 3, 1),
});
const coverFraming = ({ imagePosX, imagePosY, imageZoom }) => ({
  ...(imagePosX !== undefined && { imagePosX: Math.round(clamp(imagePosX, 0, 100, 50)) }),
  ...(imagePosY !== undefined && { imagePosY: Math.round(clamp(imagePosY, 0, 100, 50)) }),
  ...(imageZoom !== undefined && { imageZoom: clamp(imageZoom, 1, 3, 1) }),
});

// GET /api/recipes — list all published recipes (with category + author name)
export async function getAllRecipes(req, res) {
  try {
    const recipes = await cached('recipes:all', () =>
      prisma.recipe.findMany({
        where: { published: true },
        include: { category: true, author: { select: { firstName: true, lastName: true } } },
        orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
      })
    );
    res.json(recipes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
}

// GET /api/recipes/:slug — one recipe with full ingredients/steps/gallery
export async function getRecipeBySlug(req, res) {
  try {
    const slug = req.params.slug;
    const recipe = await cached(`recipes:slug:${slug}`, () =>
      prisma.recipe.findUnique({
        where: { slug },
        include: { ...fullInclude, author: { select: { firstName: true, lastName: true } } },
      })
    );
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
    const {
      title, titleSr, slug, description, descriptionSr, imageUrl, videoUrl, categoryId, published,
      ingredients = [], steps = [], images = [],
    } = req.body;

    // New recipes go to the top of the manual order
    const first = await prisma.recipe.findFirst({ orderBy: { position: 'asc' }, select: { position: true } });

    const recipe = await prisma.recipe.create({
      data: {
        title,
        position: (first?.position ?? 1) - 1,
        featured: !!req.body.featured,
        titleSr: emptyToNull(titleSr),
        slug,
        description,
        descriptionSr: emptyToNull(descriptionSr),
        imageUrl,
        videoUrl: emptyToNull(videoUrl),
        ...coverFraming(req.body),
        ...(published !== undefined && { published }),
        categoryId: categoryId || undefined,
        authorId: req.user.id,
        ingredients: { create: ingredients.map(toLine) },
        steps: { create: steps.map(toLine) },
        images: { create: images.map(toImage) },
      },
      include: fullInclude,
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
    const {
      title, titleSr, slug, description, descriptionSr, imageUrl, videoUrl, categoryId, published,
      ingredients, steps, images,
    } = req.body;
    const id = req.params.id;

    // Update the main recipe record (only fields that were sent)
    await prisma.recipe.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(titleSr !== undefined && { titleSr: emptyToNull(titleSr) }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(descriptionSr !== undefined && { descriptionSr: emptyToNull(descriptionSr) }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(videoUrl !== undefined && { videoUrl: emptyToNull(videoUrl) }),
        ...coverFraming(req.body),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(published !== undefined && { published }),
        ...(req.body.featured !== undefined && { featured: !!req.body.featured }),
      },
    });

    // Replace ingredients if provided — delete all, then re-insert in order
    if (Array.isArray(ingredients)) {
      await prisma.ingredient.deleteMany({ where: { recipeId: id } });
      if (ingredients.length) {
        await prisma.ingredient.createMany({
          data: ingredients.map((item, i) => ({ ...toLine(item, i), recipeId: id })),
        });
      }
    }

    // Replace steps if provided
    if (Array.isArray(steps)) {
      await prisma.step.deleteMany({ where: { recipeId: id } });
      if (steps.length) {
        await prisma.step.createMany({
          data: steps.map((item, i) => ({ ...toLine(item, i), recipeId: id })),
        });
      }
    }

    // Replace images if provided
    if (Array.isArray(images)) {
      await prisma.recipeImage.deleteMany({ where: { recipeId: id } });
      if (images.length) {
        await prisma.recipeImage.createMany({
          data: images.map((img, i) => ({ ...toImage(img, i), recipeId: id })),
        });
      }
    }

    // Return the fully-populated recipe so the UI can update without a page reload
    const updated = await prisma.recipe.findUnique({ where: { id }, include: fullInclude });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
}

// DELETE /api/recipes/:id — remove a recipe (admin only)
export async function deleteRecipe(req, res) {
  try {
    await prisma.recipe.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
}

