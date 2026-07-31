import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { upload, uploadImage } from '../controllers/uploadController.js';

const router = Router();

// POST /api/upload — multer parses the multipart body, then we push to Cloudinary
router.post('/', requireAdmin, upload.single('image'), uploadImage);

export default router;

