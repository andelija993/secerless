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

import { useEffect, useState } from 'react';
import { getMe, type AuthUser } from '../lib/auth';
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
} from '../lib/admin';
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
  const [modalTab, setModalTab] = useState<Tab>('recipes'); // which form to show
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);

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

  // ----- Delete handlers -----

  async function handleDeleteRecipe(id: string, title: string) {
    if (!confirm(`Delete recipe "${title}"? This cannot be undone.`)) return;
    const { ok } = await adminDeleteRecipe(id);
    if (ok) setRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleDeletePost(id: string, title: string) {
    if (!confirm(`Delete post "${title}"? This cannot be undone.`)) return;
    const { ok } = await adminDeletePost(id);
    if (ok) setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  // ----- Open modal helpers -----

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

  // ----- Save handlers (called from form components) -----

  async function handleSaveRecipe(data: object) {
    if (editingRecipe) {
      const { ok, data: updated } = await adminUpdateRecipe(editingRecipe.id, data);
      if (ok) {
        setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        closeModal();
      }
      return { ok, error: ok ? undefined : updated?.error };
    } else {
      const { ok, data: created } = await adminCreateRecipe(data);
      if (ok) {
        setRecipes((prev) => [created, ...prev]);
        closeModal();
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
      }
      return { ok, error: ok ? undefined : updated?.error };
    } else {
      const { ok, data: created } = await adminCreatePost(data);
      if (ok) {
        setPosts((prev) => [created, ...prev]);
        closeModal();
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
    <div className="max-w-5xl mx-auto px-4 py-12">
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
      <div role="tablist" className="tabs tabs-boxed mb-6 w-fit">
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
        <RecipeTable
          recipes={recipes}
          onEdit={openEditRecipe}
          onDelete={handleDeleteRecipe}
        />
      ) : (
        <PostTable
          posts={posts}
          onEdit={openEditPost}
          onDelete={handleDeletePost}
        />
      )}

      {/* Modal (DaisyUI) */}
      {modalOpen && (
        <div className="modal modal-open" role="dialog">
          <div className="modal-box max-w-2xl max-h-[92vh] overflow-y-auto relative">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10"
              onClick={closeModal}
              aria-label="Close"
            >
              ✕
            </button>
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
          {/* Clicking backdrop closes modal */}
          <div className="modal-backdrop bg-black/40" onClick={closeModal} />
        </div>
      )}
    </div>
  );
}

// ----- Sub-components for the tables -----

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span className={`badge badge-sm ${published ? 'badge-success' : 'badge-warning'}`}>
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

function RecipeTable({
  recipes,
  onEdit,
  onDelete,
}: {
  recipes: any[];
  onEdit: (r: any) => void;
  onDelete: (id: string, title: string) => void;
}) {
  if (!recipes.length) {
    return (
      <div className="text-center py-16 opacity-60">
        <p className="text-lg">No recipes yet.</p>
        <p className="text-sm">Click "+ New Recipe" to add the first one.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-box border border-base-300">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Recipe</th>
            <th>Category</th>
            <th>Ingredients</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {recipes.map((r) => (
            <tr key={r.id}>
              <td>
                <div className="flex items-center gap-3 min-w-0">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center flex-shrink-0 text-xl">🍴</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.title}</p>
                    <p className="text-xs opacity-50 font-mono truncate">{r.slug}</p>
                  </div>
                </div>
              </td>
              <td>
                <span className="badge badge-ghost badge-sm">{r.category?.name ?? '—'}</span>
              </td>
              <td>
                <span className="text-sm opacity-70">{r.ingredients?.length ?? 0} items</span>
              </td>
              <td><StatusBadge published={r.published} /></td>
              <td>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(r)} className="btn btn-xs btn-outline">Edit</button>
                  <button onClick={() => onDelete(r.id, r.title)} className="btn btn-xs btn-error btn-outline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PostTable({
  posts,
  onEdit,
  onDelete,
}: {
  posts: any[];
  onEdit: (p: any) => void;
  onDelete: (id: string, title: string) => void;
}) {
  if (!posts.length) {
    return (
      <div className="text-center py-16 opacity-60">
        <p className="text-lg">No blog posts yet.</p>
        <p className="text-sm">Click "+ New Post" to add the first one.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-box border border-base-300">
      <table className="table table-zebra w-full">
        <thead>
          <tr>
            <th>Post</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="flex items-center gap-3 min-w-0">
                  {p.coverImageUrl ? (
                    <img src={p.coverImageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-base-300 flex items-center justify-center flex-shrink-0 text-xl">📝</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.title}</p>
                    <p className="text-xs opacity-50 font-mono truncate">{p.slug}</p>
                  </div>
                </div>
              </td>
              <td>
                <span className="text-sm opacity-60">
                  {new Date(p.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </td>
              <td><StatusBadge published={p.published} /></td>
              <td>
                <div className="flex gap-1">
                  <button onClick={() => onEdit(p)} className="btn btn-xs btn-outline">Edit</button>
                  <button onClick={() => onDelete(p.id, p.title)} className="btn btn-xs btn-error btn-outline">Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

