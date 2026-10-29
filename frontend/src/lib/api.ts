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
  imagePosY?: number;
  videoUrl?: string | null;
  createdAt?: string;
  position?: number;
  featured?: boolean;
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
  images: { id: string; url: string; caption: string | null; order: number; posY?: number }[];
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

export interface ApiResult<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

// Shared fetch for every API call: sends the auth cookie and never throws
export async function request<T = any>(path: string, method = 'GET', body?: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = res.status === 204 ? null : await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error(`API request failed: ${path}`, err);
    return { ok: false, status: 0, data: { error: 'Cannot reach the server. Is the backend running?' } as T };
  }
}

const CATEGORY_SR: Record<string, string> = {
  breakfast: 'Doručak',
  lunch: 'Ručak',
  dinner: 'Večera',
  drink: 'Pića',
  dessert: 'Deserti',
  'healthy-dessert': 'Zdravi deserti',
  'ice-cream': 'Sladoled',
};

const pick = (sr: string | null | undefined, en: string) => (sr?.trim() ? sr : en);

function localizeRecipe<T extends RecipeSummary>(recipe: T, lang: Lang): T {
  if (lang !== 'sr') return recipe;
  const lines = (list?: RecipeLine[]) => list?.map((l) => ({ ...l, text: pick(l.textSr, l.text) }));
  const r: any = {
    ...recipe,
    title: pick(recipe.titleSr, recipe.title),
    description: recipe.descriptionSr?.trim() ? recipe.descriptionSr : recipe.description,
    category: recipe.category && { ...recipe.category, name: CATEGORY_SR[recipe.category.slug] ?? recipe.category.name },
  };
  if ('ingredients' in r) r.ingredients = lines(r.ingredients);
  if ('steps' in r) r.steps = lines(r.steps);
  return r;
}

export async function getRecipes(lang: Lang = 'en'): Promise<RecipeSummary[]> {
  const { ok, data } = await request<RecipeSummary[]>('/recipes');
  return ok ? data.map((r) => localizeRecipe(r, lang)) : [];
}

export async function getRecipeBySlug(slug: string, lang: Lang = 'en'): Promise<RecipeDetail | null> {
  const { ok, data } = await request<RecipeDetail>(`/recipes/${slug}`);
  return ok ? localizeRecipe(data, lang) : null;
}

export async function getPosts(): Promise<BlogPostSummary[]> {
  const { ok, data } = await request<BlogPostSummary[]>('/blog');
  return ok ? data : [];
}

export async function getPostBySlug(slug: string): Promise<BlogPostSummary | null> {
  const { ok, data } = await request<BlogPostSummary>(`/blog/${slug}`);
  return ok ? data : null;
}

