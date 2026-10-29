import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes.js';
import { authenticate } from './middleware/auth.js';
import { clearCache } from './lib/cache.js';

// Refuse to start with a missing or placeholder secret — anyone could forge login tokens
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32 || secret.startsWith('replace_this')) {
  console.error('JWT_SECRET must be set to a random string of at least 32 characters (see .env.example).');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4321', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(authenticate);

// Successful content writes clear the read cache so edits show up immediately
const CONTENT_WRITE = /^\/api\/(recipes|blog|categories|admin|auth)\b/;
app.use((req, res, next) => {
  if (req.method !== 'GET' && CONTENT_WRITE.test(req.path)) {
    res.on('finish', () => res.statusCode < 400 && clearCache());
  }
  next();
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

// Express 5 forwards errors from async handlers here
app.use((err, req, res, next) => {
  if (err.code === 'P2002') return res.status(409).json({ error: 'This already exists (e.g. the slug is taken)' });
  if (err.code === 'P2025') return res.status(404).json({ error: 'Not found' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File too large — maximum size is 25 MB.' });
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

