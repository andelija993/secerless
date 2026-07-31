// BlogForm — create or edit a blog post from the admin dashboard.
// Content is plain Markdown. The "Preview" toggle renders a live HTML preview
// using the same tiny converter used by the public blog page (marked library).

import { useState } from 'react';

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Lightweight markdown → HTML for the live preview panel.
// The public blog pages use the full `marked` library; this inline version
// is fast enough for a typing preview and avoids async complexity.
function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-base-300 px-1 rounded text-sm">$1</code>')
    .replace(/\n\n/g, '</p><p class="mb-3">')
    .replace(/^(?!<[h|p|c])/gm, '')
    .replace(/^(.+)$/gm, (line) => (line.startsWith('<') ? line : `<p class="mb-3">${line}</p>`));
}

interface SaveResult {
  ok: boolean;
  error?: string;
}

interface Props {
  initial: any | null;
  onSave: (data: object) => Promise<SaveResult>;
  onCancel: () => void;
}

export default function BlogForm({ initial, onSave, onCancel }: Props) {
  const [title, setTitle] = useState<string>(initial?.title ?? '');
  const [slug, setSlug] = useState<string>(initial?.slug ?? '');
  const [content, setContent] = useState<string>(initial?.content ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState<string>(initial?.coverImageUrl ?? '');
  const [published, setPublished] = useState<boolean>(initial?.published ?? true);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!initial) setSlug(slugify(v));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const result = await onSave({
      title,
      slug,
      content,
      coverImageUrl: coverImageUrl || null,
      published,
    });
    setSaving(false);
    if (result && !result.ok) {
      setError(result.error ?? 'Something went wrong — check the console.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">{initial ? 'Edit Blog Post' : 'New Blog Post'}</h2>

      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}

      {/* Title */}
      <label className="form-control">
        <span className="label-text font-semibold mb-1">Title *</span>
        <input
          type="text" className="input input-bordered" value={title} required
          onChange={(e) => handleTitleChange(e.target.value)}
        />
      </label>

      {/* Slug */}
      <label className="form-control">
        <span className="label-text font-semibold mb-1">
          Slug <span className="opacity-50 font-normal">(URL path — must be unique)</span>
        </span>
        <input
          type="text" className="input input-bordered font-mono text-sm" value={slug} required
          onChange={(e) => setSlug(e.target.value)}
        />
        <span className="text-xs opacity-50 mt-1">Preview: /blog/{slug || '…'}</span>
      </label>

      {/* Cover image */}
      <label className="form-control">
        <span className="label-text font-semibold mb-1">Cover Image URL</span>
        <input
          type="url" className="input input-bordered" value={coverImageUrl} placeholder="https://..."
          onChange={(e) => setCoverImageUrl(e.target.value)}
        />
        {coverImageUrl && (
          <img src={coverImageUrl} alt="preview" className="mt-2 h-32 w-full object-cover rounded-xl" />
        )}
      </label>

      {/* Content with preview toggle */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="label-text font-semibold">Content (Markdown) *</span>
          <button
            type="button"
            className="btn btn-xs btn-ghost"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? '✏️ Edit' : '👁 Preview'}
          </button>
        </div>
        {preview ? (
          <div
            className="border border-base-300 rounded-xl p-4 min-h-48 bg-base-200 text-sm leading-relaxed overflow-auto"
            dangerouslySetInnerHTML={{ __html: mdToHtml(content) || '<p class="opacity-40">Nothing to preview yet…</p>' }}
          />
        ) : (
          <textarea
            className="textarea textarea-bordered w-full font-mono text-sm leading-relaxed"
            rows={14}
            value={content}
            required
            placeholder={`# Post title\n\nWrite your post in **Markdown**...\n\n## A subheading\n\nMore text here.`}
            onChange={(e) => setContent(e.target.value)}
          />
        )}
        <p className="text-xs opacity-50 mt-1">
          Supports **bold**, *italic*, # headings, and paragraph breaks (blank line between paragraphs).
        </p>
      </div>

      {/* Published toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox" className="toggle toggle-primary"
          checked={published} onChange={(e) => setPublished(e.target.checked)}
        />
        <span className="label-text">
          {published ? '🟢 Published (visible on site)' : '🟡 Draft (hidden from visitors)'}
        </span>
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-base-300">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Post'}
        </button>
      </div>
    </form>
  );
}

