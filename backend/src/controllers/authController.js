import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { COOKIE_NAME, signToken } from '../utils/token.js';

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, // not readable from JS — protects against XSS token theft
    sameSite: 'lax', // sent on top-level navigation & same-site fetches (fine for localhost ports)
    secure: process.env.NODE_ENV === 'production', // HTTPS-only once deployed
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, in ms
  });
}

// Never send the password hash to the frontend.
function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

// POST /api/auth/register
export async function register(req, res) {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, firstName, lastName },
    });

    setAuthCookie(res, signToken(user));
    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to register' });
  }
}

// POST /api/auth/login
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    // Same error message for "no such user" and "wrong password" —
    // avoids leaking which emails have accounts.
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    setAuthCookie(res, signToken(user));
    res.json(sanitizeUser(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log in' });
  }
}

// POST /api/auth/logout
export function logout(req, res) {
  res.clearCookie(COOKIE_NAME);
  res.status(204).send();
}

// GET /api/auth/me — who am I? (req.user set by the `authenticate` middleware)
export function me(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(sanitizeUser(req.user));
}

// PUT /api/auth/me — update your own profile (name, avatar)
export async function updateMe(req, res) {
  try {
    const { firstName, lastName, avatarUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, avatarUrl },
    });
    res.json(sanitizeUser(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

