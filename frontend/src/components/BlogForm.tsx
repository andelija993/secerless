import { useState } from 'react';
import { marked } from 'marked';
import ImageUpload from './ImageUpload';
import { slugify } from '../lib/slugify';

interface Props {
  initial: any | null;
  onSave: (data: object) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
}

export default function BlogForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    titleSr: initial?.titleSr ?? '',
    slug: initial?.slug ?? '',
    content: initial?.content ?? '',
    contentSr: initial?.contentSr ?? '',
    coverImageUrl: initial?.coverImageUrl ?? '',
    published: initial?.published ?? true,
  });
  const [preview, setPreview] = useState<'en' | 'sr' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const result = await onSave({
      ...form,
      titleSr: form.titleSr || null,
      contentSr: form.contentSr || null,
      coverImageUrl: form.coverImageUrl || null,
    });
    setSaving(false);
    if (!result.ok) setError(result.error ?? 'Something went wrong — check the console.');
  }

  const previewHtml = marked.parse((preview === 'sr' && form.contentSr) || form.content, { async: false });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">{initial ? 'Edit Blog Post' : 'New Blog Post'}</h2>
      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="fieldset">
          <span className="fieldset-legend justify-start">English title *</span>
          <input
            type="text" className="input w-full" value={form.title} required
            onChange={(e) => set({ title: e.target.value, ...(!initial && { slug: slugify(e.target.value) }) })}
          />
        </label>
        <label className="fieldset">
          <span className="fieldset-legend justify-start">Srpski naslov (optional)</span>
          <input
            type="text" className="input w-full" value={form.titleSr} placeholder="Leave empty to keep only English"
            onChange={(e) => set({ titleSr: e.target.value })}
          />
        </label>
      </div>

      <label className="fieldset">
        <span className="fieldset-legend justify-start">
          Slug <span className="opacity-50 font-normal">(URL path — must be unique)</span>
        </span>
        <input type="text" className="input w-full font-mono text-sm" value={form.slug} required onChange={(e) => set({ slug: e.target.value })} />
        <span className="text-xs opacity-50 mt-1">Preview: /blog/{form.slug || '…'}</span>
      </label>

      <ImageUpload value={form.coverImageUrl} onUpload={(url) => set({ coverImageUrl: url })} />

      <div>
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <span className="fieldset-legend justify-start">Content (Markdown)</span>
          <div className="join">
            {([null, 'en', 'sr'] as const).map((mode) => (
              <button
                key={mode ?? 'edit'}
                type="button"
                className={`btn btn-xs join-item ${preview === mode ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setPreview(mode)}
              >
                {mode ? `👁 ${mode.toUpperCase()}` : '✏️ Edit'}
              </button>
            ))}
          </div>
        </div>

        {preview ? (
          <div
            className="post-content rounded-xl border border-base-300 bg-base-200 p-4 min-h-48 overflow-auto"
            dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="opacity-40">Nothing to preview yet…</p>' }}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-box border border-base-300 p-3">
              <p className="font-medium mb-2">English *</p>
              <textarea
                className="textarea w-full font-mono text-sm leading-relaxed" rows={10} value={form.content} required
                placeholder={`# Post title\n\nWrite your post in **Markdown**...`}
                onChange={(e) => set({ content: e.target.value })}
              />
            </div>
            <div className="rounded-box border border-base-300 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Srpski (optional)</span>
                <button
                  type="button" className="btn btn-xs btn-outline"
                  onClick={() => set({ titleSr: form.titleSr.trim() || form.title, contentSr: form.contentSr.trim() || form.content })}
                >
                  Copy EN to SR
                </button>
              </div>
              <textarea
                className="textarea w-full font-mono text-sm leading-relaxed" rows={10} value={form.contentSr}
                placeholder={`# Naslov\n\nOstavite prazno ako želite da objava ostane samo na engleskom...`}
                onChange={(e) => set({ contentSr: e.target.value })}
              />
            </div>
          </div>
        )}
        <p className="text-xs opacity-50 mt-1">If Serbian is left empty, the English version is shown on the Serbian site.</p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" className="toggle toggle-primary" checked={form.published} onChange={(e) => set({ published: e.target.checked })} />
        <span className="text-sm">{form.published ? '🟢 Published (visible on site)' : '🟡 Draft (hidden from visitors)'}</span>
      </label>

      <div className="flex justify-end gap-3 pt-2 border-t border-base-300">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Post'}
        </button>
      </div>
    </form>
  );
}

