import prisma from '../lib/prisma.js';
import { COOKIE_NAME, verifyToken } from '../utils/token.js';

// Reads the JWT cookie (if present) and attaches the matching user to
// req.user. Runs on EVERY request so any route can check `req.user` —
// it never blocks the request itself, it just tells us who (if anyone)
// is logged in. Use `requireAuth`/`requireAdmin` below to actually
// protect a route.
export async function authenticate(req, res, next) {
  req.user = null;
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return next();

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    req.user = user || null;
  } catch (err) {
    // Expired or tampered token — just treat the request as logged-out
    // rather than throwing an error.
    req.user = null;
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

