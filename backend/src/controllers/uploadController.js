import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Keep files in RAM — no temp files on disk, upload directly to Cloudinary
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — covers full-res phone photos
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// POST /api/upload  (requires admin)
export async function uploadImage(req, res) {
  try {
    // Configure here (not at module level) — in ESM all imports are evaluated
    // before server.js runs dotenv.config(), so env vars would be empty at
    // module load time. Reading them inside the handler is always safe.
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Wrap the stream-based API in a promise so we can await it
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'secerless',
          resource_type: 'image',
          public_id: `${Date.now()}-${req.file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')}`,
          overwrite: false,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Image upload failed' });
  }
}

