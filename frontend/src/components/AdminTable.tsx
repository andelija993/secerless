// AdminTable — reusable table for the admin dashboard (recipes & blog posts).
// Features: row checkboxes + "select all", bulk publish / draft / feature / delete,
// search, status & category filters, date column with sorting,
// and (recipes) a "Custom order" mode with drag & drop + ⭐ homepage toggle.

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
  featured?: boolean;
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
  /** Enables ⭐ column + feature bulk actions. */
  onToggleFeatured?: (id: string, featured: boolean) => void;
  /** Enables the "Custom order" sort with drag & drop. Receives ALL ids in the new order. */
  onReorder?: (ids: string[]) => Promise<boolean>;
}

type StatusFilter = 'all' | 'published' | 'draft' | 'featured';
type Sort = 'custom' | 'newest' | 'oldest' | 'title';

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

export default function AdminTable({
  rows, noun, showCategory = false, onEdit, onDelete, onBulk, onToggleFeatured, onReorder,
}: Props) {
  const canReorder = !!onReorder;
  const canFeature = !!onToggleFeatured;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<Sort>(canReorder ? 'custom' : 'newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Drag & drop working copy of the order (ids). null = not edited.
  const [order, setOrder] = useState<string[] | null>(null);
  const dragId = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => setOrder(null), [rows]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);
  const orderedRows = useMemo(
    () => (order ? (order.map((id) => byId.get(id)).filter(Boolean) as AdminRow[]) : rows),
    [order, rows, byId]
  );

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category).filter(Boolean) as string[])].sort(),
    [rows]
  );

  const filtersActive = search.trim() !== '' || status !== 'all' || category !== 'all';
  const dragEnabled = canReorder && sort === 'custom' && !filtersActive;
  const dirty = order !== null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = orderedRows.filter(
      (r) =>
        (!q || r.title.toLowerCase().includes(q) || r.slug.includes(q)) &&
        (status === 'all' ||
          (status === 'featured' ? !!r.featured : (status === 'published') === r.published)) &&
        (category === 'all' || (r.category ?? '') === category)
    );
    if (sort === 'custom') return list;
    return [...list].sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : sort === 'newest'
        ? +new Date(b.date) - +new Date(a.date)
        : +new Date(a.date) - +new Date(b.date)
    );
  }, [orderedRows, search, status, category, sort]);

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

  // ----- ordering -----
  const currentIds = () => orderedRows.map((r) => r.id);

  function moveTo(id: string, targetIndex: number) {
    const ids = currentIds().filter((x) => x !== id);
    ids.splice(Math.max(0, Math.min(targetIndex, ids.length)), 0, id);
    setOrder(ids);
  }

  function moveBy(id: string, delta: number) {
    const ids = currentIds();
    moveTo(id, ids.indexOf(id) + delta);
  }

  function moveSelectedToTop() {
    const ids = currentIds();
    const sel = ids.filter((id) => selected.has(id));
    setOrder([...sel, ...ids.filter((id) => !selected.has(id))]);
  }

  function onDrop(targetId: string) {
    const from = dragId.current;
    dragId.current = null;
    setDragOverId(null);
    if (!from || from === targetId) return;
    const ids = currentIds();
    moveTo(from, ids.indexOf(targetId));
  }

  async function saveOrder() {
    if (!order || !onReorder) return;
    setBusy(true);
    const ok = await onReorder(order);
    setBusy(false);
    if (ok) setOrder(null);
  }

  const counts = {
    all: rows.length,
    published: rows.filter((r) => r.published).length,
    draft: rows.filter((r) => !r.published).length,
    featured: rows.filter((r) => r.featured).length,
  };
  const statusTabs: StatusFilter[] = canFeature ? ['all', 'published', 'draft', 'featured'] : ['all', 'published', 'draft'];
  const statusLabel: Record<StatusFilter, string> = { all: 'All', published: 'Published', draft: 'Drafts', featured: '⭐ Homepage' };
  const colCount = 5 + (showCategory ? 1 : 0) + (canFeature ? 1 : 0) + (canReorder ? 1 : 0);

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
          {statusTabs.map((s) => (
            <button
              key={s}
              type="button"
              className={`join-item btn btn-sm ${status === s ? 'btn-primary' : 'btn-ghost bg-base-200'}`}
              onClick={() => setStatus(s)}
            >
              {statusLabel[s]}
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
          {canReorder && <option value="custom">Custom order (site order)</option>}
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="title">Title A–Z</option>
        </select>

        <span className="text-xs opacity-60 ml-auto">
          Showing {filtered.length} of {rows.length}
        </span>
      </div>

      {/* Reorder hint / save bar */}
      {canReorder && sort === 'custom' && (
        <div
          className={`flex flex-wrap items-center gap-3 rounded-2xl px-4 py-2 text-sm ${
            dirty ? 'sticky top-20 z-20 border border-secondary/40 bg-base-100/95 shadow-lg backdrop-blur' : 'bg-base-200/60'
          }`}
        >
          {dirty ? (
            <>
              <span className="font-semibold">↕ You changed the order</span>
              <button className="btn btn-sm btn-primary" disabled={busy} onClick={saveOrder}>Save order</button>
              <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => setOrder(null)}>Undo</button>
              {busy && <span className="loading loading-spinner loading-sm text-primary" />}
            </>
          ) : filtersActive ? (
            <span className="opacity-70">Clear the search and filters to reorder recipes.</span>
          ) : (
            <span className="opacity-70">
              This is the order recipes appear on the site. Drag rows by <b>⋮⋮</b> or use the arrows, then click <b>Save order</b>.
            </span>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-20 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/30 bg-base-100/95 px-4 py-2 shadow-lg backdrop-blur">
          <span className="text-sm font-semibold mr-2">
            {selected.size} {selected.size === 1 ? noun.one : noun.many} selected
          </span>
          <button className="btn btn-sm btn-success" disabled={busy} onClick={() => bulk('publish')}>Publish</button>
          <button className="btn btn-sm btn-warning" disabled={busy} onClick={() => bulk('unpublish')}>Move to drafts</button>
          {canFeature && (
            <>
              <button className="btn btn-sm btn-outline" disabled={busy} onClick={() => bulk('feature')}>⭐ Show on homepage</button>
              <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => bulk('unfeature')}>Remove from homepage</button>
            </>
          )}
          {dragEnabled && (
            <button className="btn btn-sm btn-ghost" disabled={busy} onClick={moveSelectedToTop}>⤒ Move to top</button>
          )}
          <button className="btn btn-sm btn-error btn-outline" disabled={busy} onClick={() => bulk('delete')}>Delete</button>
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
                {canReorder && <th className="w-16">{sort === 'custom' ? '#' : ''}</th>}
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
                {canFeature && <th className="text-center" title="Shown in the homepage slider">Home</th>}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={colCount} className="text-center py-10 opacity-60">
                    No {noun.many} match these filters.
                  </td>
                </tr>
              )}
              {filtered.map((r, index) => {
                const isSel = selected.has(r.id);
                return (
                  <tr
                    key={r.id}
                    draggable={dragEnabled}
                    onDragStart={(e) => {
                      dragId.current = r.id;
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      if (!dragEnabled) return;
                      e.preventDefault();
                      if (dragOverId !== r.id) setDragOverId(r.id);
                    }}
                    onDragLeave={() => dragOverId === r.id && setDragOverId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      onDrop(r.id);
                    }}
                    onDragEnd={() => {
                      dragId.current = null;
                      setDragOverId(null);
                    }}
                    className={`transition-colors ${isSel ? 'bg-primary/10' : 'hover:bg-base-200/60'} ${
                      dragOverId === r.id ? 'outline outline-2 -outline-offset-2 outline-primary' : ''
                    }`}
                  >
                    {canReorder && (
                      <td>
                        {sort === 'custom' && (
                          <div className="flex items-center gap-1">
                            <span
                              className={`select-none text-lg leading-none ${dragEnabled ? 'cursor-grab active:cursor-grabbing opacity-60 hover:opacity-100' : 'opacity-20'}`}
                              title={dragEnabled ? 'Drag to reorder' : 'Clear filters to reorder'}
                            >
                              ⋮⋮
                            </span>
                            <span className="w-6 text-xs tabular-nums opacity-50">{index + 1}</span>
                            {dragEnabled && (
                              <span className="flex flex-col">
                                <button type="button" className="text-[10px] leading-none opacity-50 hover:opacity-100 disabled:opacity-10" disabled={index === 0} onClick={() => moveBy(r.id, -1)} title="Move up">▲</button>
                                <button type="button" className="text-[10px] leading-none opacity-50 hover:opacity-100 disabled:opacity-10" disabled={index === filtered.length - 1} onClick={() => moveBy(r.id, 1)} title="Move down">▼</button>
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={isSel}
                        onChange={() => toggle(r.id)}
                        aria-label={`Select ${r.title}`}
                      />
                    </td>
                    <td className="cursor-pointer" onClick={() => toggle(r.id)}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-base-300 flex items-center justify-center text-xl">
                          {r.image ? (
                            <img src={r.image} alt="" draggable={false} className="h-full w-full object-cover" style={r.imageStyle} />
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
                    {canFeature && (
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => onToggleFeatured!(r.id, !r.featured)}
                          className={`text-xl transition-transform hover:scale-125 ${r.featured ? '' : 'opacity-25 grayscale hover:opacity-70'}`}
                          title={r.featured ? 'Shown on homepage — click to remove' : 'Click to show on homepage'}
                          aria-pressed={!!r.featured}
                        >
                          ⭐
                        </button>
                      </td>
                    )}
                    <td>
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

