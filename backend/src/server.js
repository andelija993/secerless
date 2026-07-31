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
import { authenticate } from './middleware/auth.js';

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
app.use(express.json());
app.use(cookieParser());
app.use(authenticate); // attaches req.user (or null) on every request

// --- Health check (useful to confirm the server is alive) ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Šećerless API is running' });
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/favorites', favoriteRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

