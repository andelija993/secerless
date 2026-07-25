import prisma from '../lib/prisma.js';

// GET /api/favorites/:userId — a user's favorited recipes
export async function getUserFavorites(req, res) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.params.userId },
      include: { recipe: true },
    });
    res.json(favorites.map((f) => f.recipe));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
}

// POST /api/favorites — body: { userId, recipeId }
export async function addFavorite(req, res) {
  try {
    const { userId, recipeId } = req.body;
    const favorite = await prisma.favorite.create({ data: { userId, recipeId } });
    res.status(201).json(favorite);
  } catch (err) {
    if (err.code === 'P2002') {
      // Prisma's "unique constraint violation" code — already favorited
      return res.status(409).json({ error: 'Already in favorites' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
}

// DELETE /api/favorites — body: { userId, recipeId }
export async function removeFavorite(req, res) {
  try {
    const { userId, recipeId } = req.body;
    await prisma.favorite.delete({
      where: { userId_recipeId: { userId, recipeId } },
    });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
}

