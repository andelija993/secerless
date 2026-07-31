import { Router } from 'express';
import {
  getAllRecipes,
  getRecipeBySlug,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../controllers/recipeController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllRecipes);
router.get('/:slug', getRecipeBySlug);
router.post('/', requireAdmin, createRecipe);
router.put('/:id', requireAdmin, updateRecipe);
router.delete('/:id', requireAdmin, deleteRecipe);

export default router;

