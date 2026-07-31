import prisma from '../lib/prisma.js';

// GET /api/favorites/check/:recipeId — returns { favorited: bool }, safe for guests
export async function checkFavorite(req, res) {
  try {
    if (!req.user) return res.json({ favorited: false });
    const fav = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId: req.user.id, recipeId: req.params.recipeId } },
    });
    res.json({ favorited: !!fav });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check favorite' });
  }
}

// GET /api/favorites — the logged-in user's favorited recipes
export async function getMyFavorites(req, res) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: { recipe: { include: { category: true } } },
    });
    res.json(favorites.map((f) => f.recipe));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
}

// POST /api/favorites — body: { recipeId }
export async function addFavorite(req, res) {
  try {
    const { recipeId } = req.body;
    const favorite = await prisma.favorite.create({
      data: { userId: req.user.id, recipeId },
    });
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

// DELETE /api/favorites — body: { recipeId }
export async function removeFavorite(req, res) {
  try {
    const { recipeId } = req.body;
    await prisma.favorite.delete({
      where: { userId_recipeId: { userId: req.user.id, recipeId } },
    });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
}

