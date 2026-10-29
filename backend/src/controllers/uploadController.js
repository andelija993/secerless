import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Files stay in memory and are streamed straight to Cloudinary
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(Object.assign(new Error('Only image files are allowed'), { status: 400 }));
  },
});

export async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const safeName = req.file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
  const result = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: 'secerless', resource_type: 'image', public_id: `${Date.now()}-${safeName}`, overwrite: false },
        (error, result) => (error ? reject(error) : resolve(result))
      )
      .end(req.file.buffer);
  });

  res.json({ url: result.secure_url, publicId: result.public_id });
}

