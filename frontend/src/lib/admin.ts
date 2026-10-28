
// Admin-only API helpers — all requests include the JWT cookie so the backend
// can verify the caller is ADMIN before responding.
// These are used exclusively by React islands inside the /admin pages.

import { API_URL } from './api';

interface FetchResult {
  ok: boolean;
  status: number;
  data: any;
}

async function adminFetch(path: string, options: RequestInit = {}): Promise<FetchResult> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include', // send the httpOnly JWT cookie
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // Network error (backend down, CORS, etc.) — return a normal failure so the UI can show a toast
    console.error(err);
    return { ok: false, status: 0, data: { error: 'Cannot reach the server. Is the backend running?' } };
  }
}

// --- Admin read endpoints (include drafts) ---

export async function adminGetAllRecipes() {
  const { ok, data } = await adminFetch('/admin/recipes');
  return ok ? data : [];
}

export async function adminGetAllPosts() {
  const { ok, data } = await adminFetch('/admin/posts');
  return ok ? data : [];
}

export async function adminGetCategories() {
  const { ok, data } = await adminFetch('/categories');
  return ok ? data : [];
}

// --- Recipe CRUD ---

export async function adminCreateRecipe(body: object): Promise<FetchResult> {
  return adminFetch('/recipes', { method: 'POST', body: JSON.stringify(body) });
}

export async function adminUpdateRecipe(id: string, body: object): Promise<FetchResult> {
  return adminFetch(`/recipes/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function adminDeleteRecipe(id: string): Promise<FetchResult> {
  return adminFetch(`/recipes/${id}`, { method: 'DELETE' });
}

// --- Blog post CRUD ---

export async function adminCreatePost(body: object): Promise<FetchResult> {
  return adminFetch('/blog', { method: 'POST', body: JSON.stringify(body) });
}

export async function adminUpdatePost(id: string, body: object): Promise<FetchResult> {
  return adminFetch(`/blog/${id}`, { method: 'PUT', body: JSON.stringify(body) });
}

export async function adminDeletePost(id: string): Promise<FetchResult> {
  return adminFetch(`/blog/${id}`, { method: 'DELETE' });
}


// --- Bulk actions (selected rows in the admin tables) ---

export type BulkAction = 'publish' | 'unpublish' | 'delete' | 'feature' | 'unfeature';

export async function adminBulkRecipes(ids: string[], action: BulkAction): Promise<FetchResult> {
  return adminFetch('/admin/recipes/bulk', { method: 'POST', body: JSON.stringify({ ids, action }) });
}

export async function adminBulkPosts(ids: string[], action: BulkAction): Promise<FetchResult> {
  return adminFetch('/admin/posts/bulk', { method: 'POST', body: JSON.stringify({ ids, action }) });
}

/** Save the manual recipe order (ids from first to last). */
export async function adminReorderRecipes(ids: string[]): Promise<FetchResult> {
  return adminFetch('/admin/recipes/order', { method: 'PUT', body: JSON.stringify({ ids }) });
}
