import { Router } from 'express';
import { register, login, logout, me, updateMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me); // req.user is already attached globally in server.js
router.put('/me', requireAuth, updateMe);

export default router;

