// Client-side helpers for the favorites API.
// All calls include credentials: 'include' so the JWT cookie is sent.

import { API_URL } from './api';

async function favFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, data };
}

/** Returns all recipes the logged-in user has saved. */
export async function getFavorites(): Promise<any[]> {
  const { ok, data } = await favFetch('/favorites');
  return ok && Array.isArray(data) ? data : [];
}

/** Returns true if the logged-in user has saved this recipe (false for guests). */
export async function checkFavorite(recipeId: string): Promise<boolean> {
  const { data } = await favFetch(`/favorites/check/${recipeId}`);
  return data?.favorited ?? false;
}

export async function addFavorite(recipeId: string) {
  return favFetch('/favorites', { method: 'POST', body: JSON.stringify({ recipeId }) });
}

export async function removeFavorite(recipeId: string) {
  return favFetch('/favorites', { method: 'DELETE', body: JSON.stringify({ recipeId }) });
}

