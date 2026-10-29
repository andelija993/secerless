import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { COOKIE_NAME, signToken } from '../utils/token.js';

function setAuthCookie(res, user) {
  res.cookie(COOKIE_NAME, signToken(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

// Never send the password hash to the client
const sanitize = ({ password, ...user }) => user;

export async function register(req, res) {
  const { email, password, firstName, lastName } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  if (await prisma.user.findUnique({ where: { email } })) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const user = await prisma.user.create({
    data: { email, password: await bcrypt.hash(password, 10), firstName, lastName },
  });
  setAuthCookie(res, user);
  res.status(201).json(sanitize(user));
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  // Same message for unknown email and wrong password
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  setAuthCookie(res, user);
  res.json(sanitize(user));
}

export function logout(req, res) {
  res.clearCookie(COOKIE_NAME);
  res.status(204).send();
}

export function me(req, res) {
  if (!req.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(sanitize(req.user));
}

export async function updateMe(req, res) {
  const { firstName, lastName, avatarUrl } = req.body;
  const user = await prisma.user.update({ where: { id: req.user.id }, data: { firstName, lastName, avatarUrl } });
  res.json(sanitize(user));
}

