import prisma from '../lib/prisma.js';

export async function getMyFavorites(req, res) {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user.id },
    include: { recipe: { include: { category: true } } },
  });
  res.json(favorites.map((f) => f.recipe));
}

export async function addFavorite(req, res) {
  const favorite = await prisma.favorite.upsert({
    where: { userId_recipeId: { userId: req.user.id, recipeId: req.body.recipeId } },
    create: { userId: req.user.id, recipeId: req.body.recipeId },
    update: {},
  });
  res.status(201).json(favorite);
}

export async function removeFavorite(req, res) {
  await prisma.favorite.deleteMany({ where: { userId: req.user.id, recipeId: req.body.recipeId } });
  res.status(204).send();
}

