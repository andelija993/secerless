// Client-side helper for talking to the auth endpoints.
// These run in the browser (React islands), so requests must include
// `credentials: 'include'` — that's what tells the browser to send/accept
// the httpOnly JWT cookie set by the Express backend.

import { API_URL } from './api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
}

async function authFetch(path: string, options: RequestInit = {}): Promise<{ ok: boolean; data: any }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, data };
}

export async function login(email: string, password: string) {
  return authFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function register(email: string, password: string, firstName: string, lastName: string) {
  return authFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, firstName, lastName }),
  });
}

export async function logout() {
  return authFetch('/auth/logout', { method: 'POST' });
}

export async function getMe(): Promise<AuthUser | null> {
  const { ok, data } = await authFetch('/auth/me');
  return ok ? data : null;
}

export async function updateMe(fields: { firstName?: string; lastName?: string; avatarUrl?: string }) {
  return authFetch('/auth/me', { method: 'PUT', body: JSON.stringify(fields) });
}

