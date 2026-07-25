import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

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

// --- Health check (useful to confirm the server is alive) ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Secerless API is running' });
});

// --- Routes will be mounted here as we build them ---
// import recipeRoutes from './routes/recipes.js';
// app.use('/api/recipes', recipeRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

