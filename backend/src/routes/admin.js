import { Router } from 'express';
import { adminGetRecipes, adminGetPosts, adminBulkRecipes, adminBulkPosts, adminReorderRecipes } from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// Both routes are protected — only an ADMIN user can reach them.
// The `requireAdmin` middleware (from auth.js) returns 403 for non-admins.
router.get('/recipes', requireAdmin, adminGetRecipes);
router.get('/posts', requireAdmin, adminGetPosts);

// Bulk publish / unpublish / delete
router.post('/recipes/bulk', requireAdmin, adminBulkRecipes);
router.post('/posts/bulk', requireAdmin, adminBulkPosts);

// Manual recipe order (drag & drop in the admin)
router.put('/recipes/order', requireAdmin, adminReorderRecipes);

export default router;

