// Small typed helper for talking to the Express/Prisma backend.
// Centralizing fetch logic here means every page uses the same base URL,
// error handling, and TypeScript types instead of repeating fetch() everywhere.

export const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000/api';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface RecipeSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  category: Category | null;
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: { id: string; text: string; order: number }[];
  steps: { id: string; text: string; order: number }[];
  author: { firstName: string | null; lastName: string | null };
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string;
  author: { firstName: string | null; lastName: string | null };
}

// Generic fetch wrapper — returns `null` instead of throwing so a single
// backend hiccup doesn't crash the whole page (we just show an empty state).
async function apiFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.error(`API request failed: ${path}`, err);
    return null;
  }
}

export async function getRecipes(): Promise<RecipeSummary[]> {
  return (await apiFetch<RecipeSummary[]>('/recipes')) ?? [];
}

export async function getRecipeBySlug(slug: string): Promise<RecipeDetail | null> {
  return apiFetch<RecipeDetail>(`/recipes/${slug}`);
}

export async function getPosts(): Promise<BlogPostSummary[]> {
  return (await apiFetch<BlogPostSummary[]>('/blog')) ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPostSummary | null> {
  return apiFetch<BlogPostSummary>(`/blog/${slug}`);
}

