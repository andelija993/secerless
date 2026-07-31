import { Router } from 'express';
import { getMyFavorites, addFavorite, removeFavorite, checkFavorite } from '../controllers/favoriteController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/check/:recipeId', checkFavorite); // no auth — returns false for guests
router.get('/', requireAuth, getMyFavorites);
router.post('/', requireAuth, addFavorite);
router.delete('/', requireAuth, removeFavorite);

export default router;

