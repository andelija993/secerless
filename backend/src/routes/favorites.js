import { Router } from 'express';
import { getUserFavorites, addFavorite, removeFavorite } from '../controllers/favoriteController.js';

const router = Router();

router.get('/:userId', getUserFavorites);
router.post('/', addFavorite);
router.delete('/', removeFavorite);

export default router;

