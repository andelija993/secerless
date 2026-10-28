// AdminTable — reusable table for the admin dashboard (recipes & blog posts).
// Features: row checkboxes + "select all", bulk publish / draft / delete,
// search, status & category filters, date column with sorting.

import { useEffect, useMemo, useRef, useState } from 'react';
import type { BulkAction } from '../lib/admin';

export interface AdminRow {
  id: string;
  title: string;
  slug: string;
  image?: string | null;
  imageStyle?: React.CSSProperties;
  date: string;
  published: boolean;
  category?: string | null;
  meta?: string;
}

interface Props {
  rows: AdminRow[];
  noun: { one: string; many: string; emoji: string };
  showCategory?: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string, title: string) => void;
  /** Returns true when the action succeeded (clears the selection). */
  onBulk: (ids: string[], action: BulkAction) => Promise<boolean>;
}

type StatusFilter = 'all' | 'published' | 'draft';
type Sort = 'newest' | 'oldest' | 'title';

export function StatusChip({ published }: { published: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold leading-none ${
        published ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning-content'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${published ? 'bg-success' : 'bg-warning'}`} />
      {published ? 'Published' : 'Draft'}
    </span>
  );
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminTable({ rows, noun, showCategory = false, onEdit, onDelete, onBulk }: Props) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter(Boolean) as string[])].sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter(
      (r) =>
        (!q || r.title.toLowerCase().includes(q) || r.slug.includes(q)) &&
        (status === 'all' || (status === 'published') === r.published) &&
        (category === 'all' || (r.category ?? '') === category)
    );
    return list.sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : sort === 'newest'
        ? +new Date(b.date) - +new Date(a.date)
        : +new Date(a.date) - +new Date(b.date)
    );
  }, [rows, search, status, category, sort]);

  // Drop selections for rows that no longer exist (e.g. after delete)
  useEffect(() => {
    setSelected((prev) => new Set([...prev].filter((id) => rows.some((r) => r.id === id))));
  }, [rows]);

  const visibleSelected = filtered.filter((r) => selected.has(r.id)).length;
  const allVisibleSelected = filtered.length > 0 && visibleSelected === filtered.length;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = visibleSelected > 0 && !allVisibleSelected;
  }, [visibleSelected, allVisibleSelected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((r) => next.delete(r.id));
      else filtered.forEach((r) => next.add(r.id));
      return next;
    });
  }

  async function bulk(action: BulkAction) {
    const ids = [...selected];
    if (!ids.length) return;
    setBusy(true);
    const ok = await onBulk(ids, action);
    setBusy(false);
    if (ok) setSelected(new Set());
  }

  const counts = {
    all: rows.length,
    published: rows.filter((r) => r.published).length,
    draft: rows.filter((r) => !r.published).length,
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="input input-bordered input-sm flex items-center gap-2 w-full sm:w-64">
          <span className="opacity-50">🔍</span>
          <input
            type="search"
            className="grow"
            placeholder={`Search ${noun.many}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>

        <div className="join">
          {(['all', 'published', 'draft'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              className={`join-item btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost bg-base-200'}`}
              onClick={() => setStatus(s)}
            >
              {s === 'all' ? 'All' : s === 'published' ? 'Published' : 'Drafts'}
              <span className="opacity-60 text-xs">{counts[s]}</span>
            </button>
          ))}
        </div>

        {showCategory && categories.length > 0 && (
          <select className="select select-bordered select-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <select className="select select-bordered select-sm" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>

        <span className="text-xs opacity-60 ml-auto">
          Showing {filtered.length} of {rows.length}
        </span>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-20 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-base-100/95 px-4 py-2 shadow-lg backdrop-blur">
          <span className="text-sm font-semibold mr-2">
            {selected.size} {selected.size === 1 ? noun.one : noun.many} selected
          </span>
          <button className="btn btn-sm btn-success" disabled={busy} onClick={() => bulk('publish')}>
            Publish
          </button>
          <button className="btn btn-sm btn-warning" disabled={busy} onClick={() => bulk('unpublish')}>
            Move to drafts
          </button>
          <button className="btn btn-sm btn-error btn-outline" disabled={busy} onClick={() => bulk('delete')}>
            Delete
          </button>
          {busy && <span className="loading loading-spinner loading-sm text-primary" />}
          <button className="btn btn-sm btn-ghost ml-auto" disabled={busy} onClick={() => setSelected(new Set())}>
            Clear selection
          </button>
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div className="text-center py-16 opacity-60">
          <p className="text-lg">No {noun.many} yet.</p>
          <p className="text-sm">Click "+ New" to add the first one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-box border border-base-300">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th>{noun.one[0].toUpperCase() + noun.one.slice(1)}</th>
                {showCategory && <th>Category</th>}
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={showCategory ? 6 : 5} className="text-center py-10 opacity-60">
                    No {noun.many} match these filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const isSel = selected.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={`cursor-pointer transition-colors ${isSel ? 'bg-primary/10' : 'hover:bg-base-200/60'}`}
                    onClick={() => toggle(r.id)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={isSel}
                        onChange={() => toggle(r.id)}
                        aria-label={`Select ${r.title}`}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-base-300 flex items-center justify-center text-xl">
                          {r.image ? (
                            <img src={r.image} alt="" className="h-full w-full object-cover" style={r.imageStyle} />
                          ) : (
                            noun.emoji
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-xs">{r.title}</p>
                          <p className="text-xs opacity-50 font-mono truncate max-w-xs">
                            {r.slug}
                            {r.meta && <span className="font-sans"> · {r.meta}</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    {showCategory && (
                      <td>
                        <span className="text-sm">{r.category ?? '—'}</span>
                      </td>
                    )}
                    <td>
                      <span className="text-sm opacity-70 whitespace-nowrap">{formatDate(r.date)}</span>
                    </td>
                    <td>
                      <StatusChip published={r.published} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => onEdit(r.id)} className="btn btn-xs btn-outline">Edit</button>
                        <button onClick={() => onDelete(r.id, r.title)} className="btn btn-xs btn-error btn-outline">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

