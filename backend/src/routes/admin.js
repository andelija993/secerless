import { Router } from 'express';
import { adminGetRecipes, adminGetPosts } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Both routes are protected — only an ADMIN user can reach them.
// The `requireAdmin` middleware (from auth.js) returns 403 for non-admins.
router.get('/recipes', requireAdmin, adminGetRecipes);
router.get('/posts', requireAdmin, adminGetPosts);

export default router;

