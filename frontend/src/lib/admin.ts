
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
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include', // send the httpOnly JWT cookie
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
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

