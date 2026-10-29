import { useEffect, useRef, useState } from 'react';
import { getMe, type AuthUser } from '../lib/auth';
import { showToast } from '../lib/toast';
import { confirmDialog } from '../lib/confirm';
import * as api from '../lib/admin';
import AdminTable, { type AdminRow } from './AdminTable';
import { coverPos, posStyle } from '../lib/image';
import RecipeForm from './RecipeForm';
import BlogForm from './BlogForm';

type Kind = 'recipes' | 'blog';

const KINDS = {
  recipes: { one: 'recipe', many: 'recipes', create: api.adminCreateRecipe, update: api.adminUpdateRecipe, remove: api.adminDeleteRecipe, bulk: api.adminBulkRecipes },
  blog: { one: 'post', many: 'posts', create: api.adminCreatePost, update: api.adminUpdatePost, remove: api.adminDeletePost, bulk: api.adminBulkPosts },
};

const BULK_VERB: Record<api.BulkAction, string> = {
  delete: 'deleted',
  publish: 'published',
  unpublish: 'moved to drafts',
  feature: 'added to the homepage',
  unfeature: 'removed from the homepage',
};

export default function AdminDashboard({ lang }: { lang: string }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined); // undefined = checking
  const [tab, setTab] = useState<Kind>('recipes');
  const [items, setItems] = useState<Record<Kind, any[]>>({ recipes: [], blog: [] });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // What the modal is editing (item null = creating new); null = modal closed
  const [editing, setEditing] = useState<{ kind: Kind; item: any | null } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    getMe().then(async (u) => {
      setUser(u);
      if (u?.role !== 'ADMIN') return;
      const [recipes, blog, cats] = await Promise.all([api.adminGetAllRecipes(), api.adminGetAllPosts(), api.adminGetCategories()]);
      setItems({ recipes, blog });
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (editing && !dialog?.open) dialog?.showModal();
    if (!editing && dialog?.open) dialog.close();
  }, [editing]);

  const updateList = (kind: Kind, fn: (list: any[]) => any[]) => setItems((all) => ({ ...all, [kind]: fn(all[kind]) }));

  async function handleSave(data: object) {
    if (!editing) return { ok: false };
    const { kind, item } = editing;
    const { ok, data: saved } = item ? await KINDS[kind].update(item.id, data) : await KINDS[kind].create(data);
    if (!ok) {
      showToast(saved?.error || `Failed to save ${KINDS[kind].one}`, 'error');
      return { ok, error: saved?.error };
    }
    updateList(kind, (list) => (item ? list.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...list]));
    setEditing(null);
    showToast(`${item ? 'Saved' : 'Created'} ${KINDS[kind].one}`);
    return { ok };
  }

  async function handleDelete(kind: Kind, id: string, title: string) {
    const { one, remove } = KINDS[kind];
    if (!(await confirmDialog(`"${title}" will be permanently deleted.`, { title: `Delete ${one}?` }))) return;
    const { ok, data } = await remove(id);
    if (!ok) return showToast(data?.error || `Failed to delete ${one}`, 'error');
    updateList(kind, (list) => list.filter((x) => x.id !== id));
    showToast(`Deleted ${one}`);
  }

  async function handleBulk(kind: Kind, ids: string[], action: api.BulkAction) {
    const what = ids.length === 1 ? KINDS[kind].one : KINDS[kind].many;
    if (action === 'delete' && !(await confirmDialog(`This cannot be undone.`, { title: `Delete ${ids.length} ${what}?` }))) {
      return false;
    }
    const { ok, data } = await KINDS[kind].bulk(ids, action);
    if (!ok) {
      showToast(data?.error || 'Bulk action failed', 'error');
      return false;
    }
    const selected = new Set(ids);
    const patch = action === 'feature' || action === 'unfeature' ? { featured: action === 'feature' } : { published: action === 'publish' };
    updateList(kind, (list) =>
      action === 'delete' ? list.filter((x) => !selected.has(x.id)) : list.map((x) => (selected.has(x.id) ? { ...x, ...patch } : x))
    );
    showToast(`${data?.count ?? ids.length} ${what} ${BULK_VERB[action]}`);
    return true;
  }

  async function handleToggleFeatured(id: string, featured: boolean) {
    const { ok, data } = await api.adminUpdateRecipe(id, { featured });
    if (!ok) return showToast(data?.error || 'Failed to update recipe', 'error');
    updateList('recipes', (list) => list.map((r) => (r.id === id ? { ...r, featured } : r)));
    showToast(featured ? '⭐ Shown on the homepage' : 'Removed from the homepage');
  }

  async function handleReorder(ids: string[]) {
    const { ok, data } = await api.adminReorderRecipes(ids);
    if (!ok) {
      showToast(data?.error || 'Failed to save the order', 'error');
      return false;
    }
    const pos = new Map(ids.map((id, i) => [id, i + 1]));
    updateList('recipes', (list) =>
      list.map((r) => ({ ...r, position: pos.get(r.id) ?? r.position })).sort((a, b) => a.position - b.position)
    );
    showToast('Recipe order saved');
    return true;
  }

  if (user === undefined) {
    return (
      <div className="flex justify-center items-center py-32">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center py-32 gap-4 text-center px-4">
        <span className="text-5xl">🔒</span>
        <h2 className="text-2xl font-bold">Admin access required</h2>
        <p className="opacity-60">Log in with an admin account to reach this page.</p>
        <a href={lang === 'sr' ? '/sr/login' : '/login'} className="btn btn-primary mt-2">Log In</a>
      </div>
    );
  }

  const recipeRows: AdminRow[] = items.recipes.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    image: r.imageUrl,
    imageStyle: posStyle(coverPos(r)),
    date: r.createdAt,
    published: r.published,
    featured: r.featured,
    category: r.category?.name ?? null,
    meta: `${r.ingredients?.filter((i: any) => !i.text?.startsWith('## ')).length ?? 0} ingredients${r.videoUrl ? ' · ▶ video' : ''}`,
  }));

  const postRows: AdminRow[] = items.blog.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    image: p.coverImageUrl,
    date: p.publishedAt ?? p.createdAt,
    published: p.published,
    meta: p.titleSr ? 'EN + SR' : 'EN only',
  }));

  const find = (kind: Kind, id: string) => items[kind].find((x) => x.id === id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="opacity-60 text-sm mt-1">Logged in as <strong>{user.firstName || user.email}</strong></p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditing({ kind: tab, item: null })}>
          + New {tab === 'recipes' ? 'Recipe' : 'Post'}
        </button>
      </div>

      <div role="tablist" className="tabs tabs-box mb-6 w-fit">
        {(['recipes', 'blog'] as const).map((kind) => (
          <button key={kind} role="tab" className={`tab ${tab === kind ? 'tab-active' : ''}`} onClick={() => setTab(kind)}>
            {kind === 'recipes' ? '🍴 Recipes' : '📝 Blog Posts'} <span className="badge badge-sm ml-1">{items[kind].length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : tab === 'recipes' ? (
        <AdminTable
          key="recipes"
          rows={recipeRows}
          noun={{ one: 'recipe', many: 'recipes', emoji: '🍴' }}
          showCategory
          onEdit={(id) => setEditing({ kind: 'recipes', item: find('recipes', id) })}
          onDelete={(id, title) => handleDelete('recipes', id, title)}
          onBulk={(ids, action) => handleBulk('recipes', ids, action)}
          onToggleFeatured={handleToggleFeatured}
          onReorder={handleReorder}
        />
      ) : (
        <AdminTable
          key="posts"
          rows={postRows}
          noun={{ one: 'post', many: 'posts', emoji: '📝' }}
          onEdit={(id) => setEditing({ kind: 'blog', item: find('blog', id) })}
          onDelete={(id, title) => handleDelete('blog', id, title)}
          onBulk={(ids, action) => handleBulk('blog', ids, action)}
        />
      )}

      <dialog ref={dialogRef} className="modal" onClose={() => setEditing(null)}>
        {editing && (
          <div className="modal-box max-w-2xl max-h-[92vh]">
            <form method="dialog">
              <button className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3 z-10" aria-label="Close">✕</button>
            </form>
            {editing.kind === 'recipes' ? (
              <RecipeForm initial={editing.item} categories={categories} onSave={handleSave} onCancel={() => setEditing(null)} />
            ) : (
              <BlogForm initial={editing.item} onSave={handleSave} onCancel={() => setEditing(null)} />
            )}
          </div>
        )}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}

