import { Router } from 'express';
import {
  getAllRecipes,
  getRecipeBySlug,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../controllers/recipeController.js';

const router = Router();

router.get('/', getAllRecipes);
router.get('/:slug', getRecipeBySlug);
router.post('/', createRecipe);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;

