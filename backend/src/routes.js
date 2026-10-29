import { Router } from 'express';
import { requireAuth, requireAdmin } from './middleware/auth.js';
import * as auth from './controllers/authController.js';
import * as recipes from './controllers/recipeController.js';
import * as blog from './controllers/blogController.js';
import * as admin from './controllers/adminController.js';
import * as favorites from './controllers/favoriteController.js';
import { getAllCategories } from './controllers/categoryController.js';
import { submitContactMessage } from './controllers/contactController.js';
import { upload, uploadImage } from './controllers/uploadController.js';

const router = Router();

router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', auth.me);
router.put('/auth/me', requireAuth, auth.updateMe);

router.get('/recipes', recipes.getAllRecipes);
router.get('/recipes/:slug', recipes.getRecipeBySlug);
router.post('/recipes', requireAdmin, recipes.createRecipe);
router.put('/recipes/:id', requireAdmin, recipes.updateRecipe);
router.delete('/recipes/:id', requireAdmin, recipes.deleteRecipe);

router.get('/blog', blog.getAllPosts);
router.get('/blog/:slug', blog.getPostBySlug);
router.post('/blog', requireAdmin, blog.createPost);
router.put('/blog/:id', requireAdmin, blog.updatePost);
router.delete('/blog/:id', requireAdmin, blog.deletePost);

router.get('/categories', getAllCategories);
router.post('/contact', submitContactMessage);

router.get('/favorites', requireAuth, favorites.getMyFavorites);
router.post('/favorites', requireAuth, favorites.addFavorite);
router.delete('/favorites', requireAuth, favorites.removeFavorite);

router.get('/admin/recipes', requireAdmin, admin.getRecipes);
router.get('/admin/posts', requireAdmin, admin.getPosts);
router.post('/admin/recipes/bulk', requireAdmin, admin.bulkRecipes);
router.post('/admin/posts/bulk', requireAdmin, admin.bulkPosts);
router.put('/admin/recipes/order', requireAdmin, admin.reorderRecipes);

router.post('/upload', requireAdmin, upload.single('image'), uploadImage);

export default router;

