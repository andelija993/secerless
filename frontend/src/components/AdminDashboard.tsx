// AdminDashboard — the main React island for the /admin page.
//
// On mount it calls GET /api/auth/me to verify the user is ADMIN.
// If not → shows a "not authorised" screen instead of the CMS.
//
// Tabs:
//   Recipes  — table of all recipes (including drafts), Edit / Delete / New
//   Blog     — table of all posts  (including drafts), Edit / Delete / New
//
// Edit / New opens a DaisyUI modal that renders RecipeForm or BlogForm.

import { useEffect, useRef, useState } from 'react';
import { getMe, type AuthUser } from '../lib/auth';
import { showToast } from '../lib/toast';
import { confirmDialog } from '../lib/confirm';
import {
  adminGetAllRecipes,
  adminGetAllPosts,
  adminGetCategories,
  adminCreateRecipe,
  adminUpdateRecipe,
  adminDeleteRecipe,
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost,
  adminBulkRecipes,
  adminBulkPosts,
  adminReorderRecipes,
  type BulkAction,
} from '../lib/admin';
import AdminTable, { type AdminRow } from './AdminTable';
import { coverFraming, frameStyle } from '../lib/imageFrame';
import RecipeForm from './RecipeForm';
import BlogForm from './BlogForm';

type Tab = 'recipes' | 'blog';

export default function AdminDashboard({ lang }: { lang: string }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<Tab>('recipes');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<Tab>('recipes');
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open/close the native <dialog> whenever modalOpen changes
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (modalOpen && !dialog.open) dialog.showModal();
    if (!modalOpen && dialog.open) dialog.close();
  }, [modalOpen]);

  useEffect(() => {
    getMe().then((u) => {
      setUser(u);
      setAuthChecked(true);
      if (u?.role === 'ADMIN') loadData();
    });
  }, []);

  async function loadData() {
    setDataLoading(true);
    const [r, p, c] = await Promise.all([
      adminGetAllRecipes(),
      adminGetAllPosts(),
      adminGetCategories(),
    ]);
    setRecipes(r);
    setPosts(p);
    setCategories(c);
    setDataLoading(false);
  }

  async function handleDeleteRecipe(id: string, title: string) {
    if (!(await confirmDialog(`"${title}" will be permanently deleted.`, { title: 'Delete recipe?' }))) return;
    const { ok, data } = await adminDeleteRecipe(id);
    if (ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== id));
      showToast('Recipe deleted');
    } else {
      showToast(data?.error || 'Failed to delete recipe', 'error');
    }
  }

  async function handleDeletePost(id: string, title: string) {
    if (!(await confirmDialog(`"${title}" will be permanently deleted.`, { title: 'Delete blog post?' }))) return;
    const { ok, data } = await adminDeletePost(id);
    if (ok) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
      showToast('Blog post deleted');
    } else {
      showToast(data?.error || 'Failed to delete post', 'error');
    }
  }

  async function handleBulk(kind: Tab, ids: string[], action: BulkAction): Promise<boolean> {
    const what = kind === 'recipes' ? (ids.length === 1 ? 'recipe' : 'recipes') : ids.length === 1 ? 'post' : 'posts';
    if (
      action === 'delete' &&
      !(await confirmDialog(`${ids.length} ${what} will be permanently deleted. This cannot be undone.`, {
        title: `Delete ${ids.length} ${what}?`,
      }))
    )
      return false;
    const { ok, data } = kind === 'recipes' ? await adminBulkRecipes(ids, action) : await adminBulkPosts(ids, action);
    if (!ok) {
      showToast(data?.error || 'Bulk action failed', 'error');
      return false;
    }
    const idSet = new Set(ids);
    const patchFor = (): Record<string, boolean> =>
      action === 'feature' || action === 'unfeature'
        ? { featured: action === 'feature' }
        : { published: action === 'publish' };
    const apply = (list: any[]) =>
      action === 'delete'
        ? list.filter((x) => !idSet.has(x.id))
        : list.map((x) => (idSet.has(x.id) ? { ...x, ...patchFor() } : x));
    if (kind === 'recipes') setRecipes(apply);
    else setPosts(apply);
    const verb = {
      delete: 'deleted',
      publish: 'published',
      unpublish: 'moved to drafts',
      feature: 'added to the homepage',
      unfeature: 'removed from the homepage',
    }[action];
    showToast(`${data?.count ?? ids.length} ${what} ${verb}`);
    return true;
  }

  async function handleToggleFeatured(id: string, featured: boolean) {
    const { ok, data } = await adminUpdateRecipe(id, { featured });
    if (!ok) {
      showToast(data?.error || 'Failed to update recipe', 'error');
      return;
    }
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, featured } : r)));
    showToast(featured ? '⭐ Shown on the homepage' : 'Removed from the homepage');
  }

  async function handleReorder(ids: string[]): Promise<boolean> {
    const { ok, data } = await adminReorderRecipes(ids);
    if (!ok) {
      showToast(data?.error || 'Failed to save the order', 'error');
      return false;
    }
    const pos = new Map(ids.map((id, i) => [id, i + 1]));
    setRecipes((prev) =>
      prev.map((r) => ({ ...r, position: pos.get(r.id) ?? r.position })).sort((x, y) => x.position - y.position)
    );
    showToast('Recipe order saved');
    return true;
  }

  const recipeRows: AdminRow[] = recipes.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    image: r.imageUrl,
    imageStyle: frameStyle(coverFraming(r)),
    date: r.createdAt,
    published: r.published,
    featured: r.featured,
    category: r.category?.name ?? null,
    meta: `${r.ingredients?.filter((i: any) => !i.text?.startsWith('## ')).length ?? 0} ingredients${r.videoUrl ? ' · ▶ video' : ''}`,
  }));

  const postRows: AdminRow[] = posts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    image: p.coverImageUrl,
    date: p.publishedAt ?? p.createdAt,
    published: p.published,
    meta: p.titleSr ? 'EN + SR' : 'EN only',
  }));

  function openNewRecipe() {
    setEditingRecipe(null);
    setModalTab('recipes');
    setModalOpen(true);
  }

  function openEditRecipe(recipe: any) {
    setEditingRecipe(recipe);
    setModalTab('recipes');
    setModalOpen(true);
  }

  function openNewPost() {
    setEditingPost(null);
    setModalTab('blog');
    setModalOpen(true);
  }

  function openEditPost(post: any) {
    setEditingPost(post);
    setModalTab('blog');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingRecipe(null);
    setEditingPost(null);
  }

  async function handleSaveRecipe(data: object) {
    if (editingRecipe) {
      const { ok, data: updated } = await adminUpdateRecipe(editingRecipe.id, data);
      if (ok) {
        setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        closeModal();
        showToast('Recipe saved successfully');
      } else {
        showToast(updated?.error || 'Failed to save recipe', 'error');
      }
      return { ok, error: ok ? undefined : updated?.error };
    } else {
      const { ok, data: created } = await adminCreateRecipe(data);
      if (ok) {
        setRecipes((prev) => [created, ...prev]);
        closeModal();
        showToast('Recipe created successfully');
      } else {
        showToast(created?.error || 'Failed to create recipe', 'error');
      }
      return { ok, error: ok ? undefined : created?.error };
    }
  }

  async function handleSavePost(data: object) {
    if (editingPost) {
      const { ok, data: updated } = await adminUpdatePost(editingPost.id, data);
      if (ok) {
        setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        closeModal();
        showToast('Blog post saved successfully');
      } else {
        showToast(updated?.error || 'Failed to save post', 'error');
      }
      return { ok, error: ok ? undefined : updated?.error };
    } else {
      const { ok, data: created } = await adminCreatePost(data);
      if (ok) {
        setPosts((prev) => [created, ...prev]);
        closeModal();
        showToast('Blog post created successfully');
      } else {
        showToast(created?.error || 'Failed to create post', 'error');
      }
      return { ok, error: ok ? undefined : created?.error };
    }
  }

  // ----- Render: auth loading -----

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center py-32">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  // ----- Render: not authorised -----

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center py-32 gap-4 text-center px-4">
        <span className="text-5xl">🔒</span>
        <h2 className="text-2xl font-bold">Admin access required</h2>
        <p className="opacity-60">Log in with an admin account to reach this page.</p>
        <a href={lang === 'sr' ? '/sr/login' : '/login'} className="btn btn-primary mt-2">
          Log In
        </a>
      </div>
    );
  }

  // ----- Render: dashboard -----

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="opacity-60 text-sm mt-1">
            Logged in as <strong>{user.firstName || user.email}</strong>
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={tab === 'recipes' ? openNewRecipe : openNewPost}
        >
          + New {tab === 'recipes' ? 'Recipe' : 'Post'}
        </button>
      </div>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-box mb-6 w-fit">
        <button
          role="tab"
          className={`tab ${tab === 'recipes' ? 'tab-active' : ''}`}
          onClick={() => setTab('recipes')}
        >
          🍴 Recipes <span className="badge badge-sm ml-1">{recipes.length}</span>
        </button>
        <button
          role="tab"
          className={`tab ${tab === 'blog' ? 'tab-active' : ''}`}
          onClick={() => setTab('blog')}
        >
          📝 Blog Posts <span className="badge badge-sm ml-1">{posts.length}</span>
        </button>
      </div>

      {/* Content */}
      {dataLoading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : tab === 'recipes' ? (
        <AdminTable
          key="recipes"
          rows={recipeRows}
          noun={{ one: 'recipe', many: 'recipes', emoji: '🍴' }}
          showCategory
          onEdit={(id) => openEditRecipe(recipes.find((r) => r.id === id))}
          onDelete={handleDeleteRecipe}
          onBulk={(ids, action) => handleBulk('recipes', ids, action)}
          onToggleFeatured={handleToggleFeatured}
          onReorder={handleReorder}
        />
      ) : (
        <AdminTable
          key="posts"
          rows={postRows}
          noun={{ one: 'post', many: 'posts', emoji: '📝' }}
          onEdit={(id) => openEditPost(posts.find((p) => p.id === id))}
          onDelete={handleDeletePost}
          onBulk={(ids, action) => handleBulk('blog', ids, action)}
        />
      )}

      {/* Modal — native <dialog> with daisyUI classes: Esc closes it, focus stays inside */}
      <dialog ref={dialogRef} className="modal" onClose={closeModal}>
        {modalOpen && (
          <div className="modal-box max-w-2xl max-h-[92vh]">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10" aria-label="Close">
                ✕
              </button>
            </form>
            {modalTab === 'recipes' ? (
              <RecipeForm
                initial={editingRecipe}
                categories={categories}
                onSave={handleSaveRecipe}
                onCancel={closeModal}
              />
            ) : (
              <BlogForm
                initial={editingPost}
                onSave={handleSavePost}
                onCancel={closeModal}
              />
            )}
          </div>
        )}
        {/* Clicking the backdrop closes the modal */}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
