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
  images: { id: string; url: string; caption: string | null; order: number }[];
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

export interface TranslationResponse {
  text: string;
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

export async function translateText(text: string, sourceLang = 'en', targetLang = 'sr'): Promise<string> {
  if (!text.trim()) return text;
  const res = await fetch(`${API_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || 'Translation failed');
  }

  const data = (await res.json()) as TranslationResponse;
  return data.text || text;
}

export async function translateBlogPost(post: BlogPostSummary) {
  const title = post.titleSr?.trim() || post.title;
  const content = post.contentSr?.trim() || post.content;

  if (post.titleSr?.trim() && post.contentSr?.trim()) {
    return { title, content };
  }

  try {
    const combined = `${post.title}\n\n${post.content}`;
    const translated = await translateText(combined, 'en', 'sr');
    const [translatedTitle, ...rest] = translated.split('\n\n');
    return {
      title: translatedTitle?.trim() || title,
      content: rest.join('\n\n').trim() || content,
    };
  } catch (err) {
    console.warn('Falling back to original English content for Serbian blog view:', err);
    return { title, content };
  }
}
