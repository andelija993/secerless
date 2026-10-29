import prisma from '../lib/prisma.js';
import { cached } from '../lib/cache.js';
import { COOKIE_NAME, verifyToken } from '../utils/token.js';

// Attaches the logged-in user (or null) to req.user; never blocks the request
export async function authenticate(req, res, next) {
  req.user = null;
  const token = req.cookies?.[COOKIE_NAME];
  if (token) {
    try {
      const { sub } = verifyToken(token);
      req.user = await cached(`user:${sub}`, () => prisma.user.findUnique({ where: { id: sub } }), 30_000);
    } catch {
      // invalid or expired token → treat as logged out
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'You must be logged in to do that' });
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'You must be logged in to do that' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
}

