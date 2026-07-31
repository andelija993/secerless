import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.js';
import { upload, uploadImage } from '../controllers/uploadController.js';

const router = Router();

// Wrap multer so its errors come back as JSON (not an unhandled Express crash)
function multerMiddleware(req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large — maximum size is 25 MB.' });
    }
    return res.status(400).json({ error: err.message ?? 'File upload error' });
  });
}

// POST /api/upload
router.post('/', requireAdmin, multerMiddleware, uploadImage);

export default router;

