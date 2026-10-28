// Small typed helper for talking to the Express/Prisma backend.
// Centralizing fetch logic here means every page uses the same base URL,
// error handling, and TypeScript types instead of repeating fetch() everywhere.

export const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4000/api';

type Lang = 'en' | 'sr';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface RecipeSummary {
  id: string;
  title: string;
  titleSr?: string | null;
  slug: string;
  description: string | null;
  descriptionSr?: string | null;
  imageUrl: string | null;
  imagePosX?: number;
  imagePosY?: number;
  imageZoom?: number;
  videoUrl?: string | null;
  createdAt?: string;
  category: Category | null;
}

export interface RecipeLine {
  id: string;
  text: string;
  textSr?: string | null;
  order: number;
}

export interface RecipeDetail extends RecipeSummary {
  ingredients: RecipeLine[];
  steps: RecipeLine[];
  images: { id: string; url: string; caption: string | null; order: number; posX?: number; posY?: number; zoom?: number }[];
  author: { firstName: string | null; lastName: string | null };
}

export interface BlogPostSummary {
  id: string;
  title: string;
  titleSr: string | null;
  slug: string;
  content: string;
  contentSr: string | null;
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

const pick = (sr: string | null | undefined, en: string) => (sr && sr.trim() ? sr : en);

// Swap in the Serbian fields (when present) so components can always read
// `title`, `description`, `text` regardless of language. English is the fallback.
export function localizeRecipe<T extends RecipeSummary>(recipe: T, lang: Lang): T {
  if (lang !== 'sr') return recipe;
  const r: any = {
    ...recipe,
    title: pick(recipe.titleSr, recipe.title),
    description: recipe.descriptionSr?.trim() ? recipe.descriptionSr : recipe.description,
  };
  const lines = (list?: RecipeLine[]) => list?.map((l) => ({ ...l, text: pick(l.textSr, l.text) }));
  if ('ingredients' in recipe) r.ingredients = lines((recipe as any).ingredients);
  if ('steps' in recipe) r.steps = lines((recipe as any).steps);
  return r as T;
}

export async function getRecipes(lang: Lang = 'en'): Promise<RecipeSummary[]> {
  const list = (await apiFetch<RecipeSummary[]>('/recipes')) ?? [];
  return list.map((r) => localizeRecipe(r, lang));
}

export async function getRecipeBySlug(slug: string, lang: Lang = 'en'): Promise<RecipeDetail | null> {
  const r = await apiFetch<RecipeDetail>(`/recipes/${slug}`);
  return r ? localizeRecipe(r, lang) : null;
}

export async function getPosts(): Promise<BlogPostSummary[]> {
  return (await apiFetch<BlogPostSummary[]>('/blog')) ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPostSummary | null> {
  return apiFetch<BlogPostSummary>(`/blog/${slug}`);
}

