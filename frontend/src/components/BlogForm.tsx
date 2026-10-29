// BlogForm — create or edit a blog post from the admin dashboard.
// Content is plain Markdown. The "Preview" toggle renders a live HTML preview
// using the same tiny converter used by the public blog page (marked library).

import { useState } from 'react';
import ImageUpload from './ImageUpload';

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
  const [titleSr, setTitleSr] = useState<string>(initial?.titleSr ?? '');
  const [slug, setSlug] = useState<string>(initial?.slug ?? '');
  const [content, setContent] = useState<string>(initial?.content ?? '');
  const [contentSr, setContentSr] = useState<string>(initial?.contentSr ?? '');
  const [coverImageUrl, setCoverImageUrl] = useState<string>(initial?.coverImageUrl ?? '');
  const [published, setPublished] = useState<boolean>(initial?.published ?? true);
  const [preview, setPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState<'en' | 'sr'>('en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!initial) setSlug(slugify(v));
  }

  function copyEnglishToSerbian() {
    setTitleSr((prev) => (prev && prev.trim() ? prev : title));
    setContentSr((prev) => (prev && prev.trim() ? prev : content));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const result = await onSave({
      title,
      titleSr: titleSr || null,
      slug,
      content,
      contentSr: contentSr || null,
      coverImageUrl: coverImageUrl || null,
      published,
    });
    setSaving(false);
    if (result && !result.ok) {
      setError(result.error ?? 'Something went wrong — check the console.');
    }
  }

  const previewContent = previewLang === 'en' ? content : (contentSr || content);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">{initial ? 'Edit Blog Post' : 'New Blog Post'}</h2>

      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="fieldset">
          <span className="fieldset-legend justify-start">English title *</span>
          <input
            type="text" className="input w-full" value={title} required
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </label>

        <label className="fieldset">
          <span className="fieldset-legend justify-start">Srpski naslov (optional)</span>
          <input
            type="text" className="input w-full" value={titleSr}
            onChange={(e) => setTitleSr(e.target.value)}
            placeholder="Leave empty if you want to keep only the English version"
          />
        </label>
      </div>

      <label className="fieldset">
        <span className="fieldset-legend justify-start">
          Slug <span className="opacity-50 font-normal">(URL path — must be unique)</span>
        </span>
        <input
          type="text" className="input w-full font-mono text-sm" value={slug} required
          onChange={(e) => setSlug(e.target.value)}
        />
        <span className="text-xs opacity-50 mt-1">Preview: /blog/{slug || '…'}</span>
      </label>

      {/* Cover image — uploads to Cloudinary */}
      <ImageUpload value={coverImageUrl} onUpload={(url) => setCoverImageUrl(url)} />

      {/* Content with preview toggle */}
      <div>
        <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
          <span className="fieldset-legend justify-start">English content *</span>
          <div className="flex items-center gap-2">
            {preview && (
              <div className="join">
                <button type="button" className={`btn btn-xs join-item ${previewLang === 'en' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPreviewLang('en')}>EN</button>
                <button type="button" className={`btn btn-xs join-item ${previewLang === 'sr' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPreviewLang('sr')}>SR</button>
              </div>
            )}
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              onClick={() => setPreview((p) => !p)}
            >
              {preview ? '✏️ Edit' : '👁 Preview'}
            </button>
          </div>
        </div>

        {preview ? (
          <div
            className="border border-base-300 rounded-xl p-4 min-h-48 bg-base-200 text-sm leading-relaxed overflow-auto"
            dangerouslySetInnerHTML={{ __html: mdToHtml(previewContent) || '<p class="opacity-40">Nothing to preview yet…</p>' }}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-box border border-base-300 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">English</span>
                <button type="button" className="btn btn-xs btn-ghost" onClick={() => setContent((prev) => prev)}>
                  Main version
                </button>
              </div>
              <textarea
                className="textarea w-full font-mono text-sm leading-relaxed"
                rows={10}
                value={content}
                required
                placeholder={`# Post title\n\nWrite your post in **Markdown**...`}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="rounded-box border border-base-300 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Srpski content (optional)</span>
                <button type="button" className="btn btn-xs btn-outline" onClick={copyEnglishToSerbian}>
                  Copy EN to SR
                </button>
              </div>
              <textarea
                className="textarea w-full font-mono text-sm leading-relaxed"
                rows={10}
                value={contentSr}
                placeholder={`# Naslov\n\nOstavite prazno ako želite da objava ostane samo na engleskom...`}
                onChange={(e) => setContentSr(e.target.value)}
              />
            </div>
          </div>
        )}
        <p className="text-xs opacity-50 mt-1">
          You can write only in English, only in Serbian, or in both. If Serbian is left empty, the English version will still be shown.
        </p>
      </div>

      {/* Published toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox" className="toggle toggle-primary"
          checked={published} onChange={(e) => setPublished(e.target.checked)}
        />
        <span className="text-sm">
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
