import { Router } from 'express';
import {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/blogController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllPosts);
router.get('/:slug', getPostBySlug);
router.post('/', requireAdmin, createPost);
router.put('/:id', requireAdmin, updatePost);
router.delete('/:id', requireAdmin, deletePost);

export default router;

