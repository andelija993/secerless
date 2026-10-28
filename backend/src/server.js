import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import recipeRoutes from './routes/recipes.js';
import blogRoutes from './routes/blog.js';
import categoryRoutes from './routes/categories.js';
import contactRoutes from './routes/contact.js';
import favoriteRoutes from './routes/favorites.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import uploadRoutes from './routes/upload.js';
import { authenticate } from './middleware/auth.js';
import { clearCache } from './lib/cache.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// --- Core middleware ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4321', // Astro's default dev port
    credentials: true, // allow cookies (needed for our JWT-in-cookie auth strategy)
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(authenticate); // attaches req.user (or null) on every request

// Any successful write to content (admin edits, profile updates…) clears the
// in-memory read cache so changes appear immediately.
const CONTENT_WRITE = /^\/api\/(recipes|blog|categories|admin|auth)\b/;
app.use((req, res, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && CONTENT_WRITE.test(req.path)) {
    res.on('finish', () => {
      if (res.statusCode < 400) clearCache();
    });
  }
  next();
});

// --- Health check (useful to confirm the server is alive) ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Šećerless API is running' });
});

// --- Translation endpoint for blog content ---
app.post('/api/translate', async (req, res) => {
  try {
    const { text, sourceLang = 'en', targetLang = 'sr' } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }
    if (sourceLang === targetLang) {
      return res.json({ text: String(text).trim() });
    }
    return res.json({
      text: String(text).trim(),
      warning: 'OpenAI is not configured. The English text was copied into the Serbian fields for manual review.',
      fallback: true,
    });
  } catch (error) {
    console.error('Translation failed:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/favorites', favoriteRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
