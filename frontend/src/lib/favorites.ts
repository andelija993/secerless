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

// Shared per page load: every heart button on the page reuses ONE request
// instead of each button calling /auth/me + /favorites/check separately.
let favoriteIdsPromise: Promise<Set<string> | null> | null = null;

/** Set of favorited recipe ids, or null for guests. Fetched once per page. */
export function getFavoriteIds(): Promise<Set<string> | null> {
  favoriteIdsPromise ??= favFetch('/favorites').then(({ ok, data }) =>
    ok && Array.isArray(data) ? new Set(data.map((r: { id: string }) => r.id)) : null
  ).catch(() => null);
  return favoriteIdsPromise;
}

/** Keep the shared set in sync after the user toggles a heart. */
function updateFavoriteIds(recipeId: string, saved: boolean) {
  favoriteIdsPromise?.then((ids) => {
    if (!ids) return;
    if (saved) ids.add(recipeId);
    else ids.delete(recipeId);
  });
}

export async function addFavorite(recipeId: string) {
  const result = await favFetch('/favorites', { method: 'POST', body: JSON.stringify({ recipeId }) });
  if (result.ok) updateFavoriteIds(recipeId, true);
  return result;
}

export async function removeFavorite(recipeId: string) {
  const result = await favFetch('/favorites', { method: 'DELETE', body: JSON.stringify({ recipeId }) });
  if (result.ok) updateFavoriteIds(recipeId, false);
  return result;
}

