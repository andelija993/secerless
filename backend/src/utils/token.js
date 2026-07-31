import jwt from 'jsonwebtoken';

// Name of the httpOnly cookie that stores the JWT.
// Shared between the auth controller (sets it) and the auth middleware (reads it).
export const COOKIE_NAME = 'secerless_token';

// Encodes the user's id + role into a signed token.
// We keep the payload minimal — just enough to look the user back up.
export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

