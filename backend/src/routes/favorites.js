import { Router } from 'express';
import { getMyFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getMyFavorites);
router.post('/', requireAuth, addFavorite);
router.delete('/', requireAuth, removeFavorite);

export default router;

