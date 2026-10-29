// Admin-only API helpers (the backend checks the ADMIN role)
import { request } from './api';

export type BulkAction = 'publish' | 'unpublish' | 'delete' | 'feature' | 'unfeature';

const list = async (path: string) => {
  const { ok, data } = await request(path);
  return ok ? data : [];
};

export const adminGetAllRecipes = () => list('/admin/recipes');
export const adminGetAllPosts = () => list('/admin/posts');
export const adminGetCategories = () => list('/categories');

export const adminCreateRecipe = (body: object) => request('/recipes', 'POST', body);
export const adminUpdateRecipe = (id: string, body: object) => request(`/recipes/${id}`, 'PUT', body);
export const adminDeleteRecipe = (id: string) => request(`/recipes/${id}`, 'DELETE');

export const adminCreatePost = (body: object) => request('/blog', 'POST', body);
export const adminUpdatePost = (id: string, body: object) => request(`/blog/${id}`, 'PUT', body);
export const adminDeletePost = (id: string) => request(`/blog/${id}`, 'DELETE');

export const adminBulkRecipes = (ids: string[], action: BulkAction) => request('/admin/recipes/bulk', 'POST', { ids, action });
export const adminBulkPosts = (ids: string[], action: BulkAction) => request('/admin/posts/bulk', 'POST', { ids, action });
export const adminReorderRecipes = (ids: string[]) => request('/admin/recipes/order', 'PUT', { ids });

