import { request } from './api';

export async function getFavorites(): Promise<any[] | null> {
  const { ok, data } = await request('/favorites');
  return ok ? data : null;
}

let favoriteIds: Promise<Set<string> | null> | null = null;

export function getFavoriteIds() {
  favoriteIds ??= getFavorites().then((list) => list && new Set(list.map((r) => r.id)));
  return favoriteIds;
}

async function toggle(recipeId: string, saved: boolean) {
  const result = await request('/favorites', saved ? 'POST' : 'DELETE', { recipeId });
  if (result.ok) {
    const ids = await favoriteIds;
    if (saved) ids?.add(recipeId);
    else ids?.delete(recipeId);
  }
  return result;
}

export const addFavorite = (recipeId: string) => toggle(recipeId, true);
export const removeFavorite = (recipeId: string) => toggle(recipeId, false);

