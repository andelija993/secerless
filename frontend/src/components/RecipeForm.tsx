import { useState } from 'react';
import ImageUpload from './ImageUpload';
import PhotoPosition from './PhotoPosition';
import { coverPos, galleryPos } from '../lib/image';
import { slugify } from '../lib/slugify';

interface Props {
  initial: any | null;
  categories: { id: string; name: string }[];
  onSave: (data: object) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
}

type Line = { text: string; textSr: string };
type Photo = { url: string; caption: string; posY: number };

const toLines = (rows?: any[]): Line[] =>
  rows?.length ? rows.map((r) => ({ text: r.text ?? '', textSr: r.textSr ?? '' })) : [{ text: '', textSr: '' }];

const cleanLines = (list: Line[]) =>
  list
    .filter((l) => l.text.trim() || l.textSr.trim())
    .map((l) => ({ text: l.text.trim() || l.textSr.trim(), textSr: l.textSr.trim() || null }));

function LineList({ label, hint, lines, onChange, multiline, placeholders, addLabel }: {
  label: string;
  hint?: React.ReactNode;
  lines: Line[];
  onChange: (lines: Line[]) => void;
  multiline?: boolean;
  placeholders: (i: number) => [string, string];
  addLabel: string;
}) {
  const update = (i: number, patch: Partial<Line>) => onChange(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const Input = multiline ? 'textarea' : 'input';
  const cls = multiline ? 'textarea textarea-sm flex-1 min-w-0' : 'input input-sm flex-1 min-w-0';

  return (
    <div>
      <p className="fieldset-legend justify-start">{label} <span className="opacity-50 font-normal">(EN | SR)</span></p>
      {hint && <p className="text-xs opacity-60 mb-2">{hint}</p>}
      {lines.map((line, i) => {
        const [en, sr] = placeholders(i);
        return (
          <div key={i} className={`flex gap-2 mb-2 ${multiline ? 'items-start' : 'items-center'}`}>
            <span className={`text-xs opacity-50 w-5 text-right shrink-0 ${multiline ? 'mt-2' : ''}`}>{i + 1}.</span>
            <Input className={cls} rows={multiline ? 3 : undefined} value={line.text} placeholder={en} onChange={(e) => update(i, { text: e.target.value })} />
            <Input className={cls} rows={multiline ? 3 : undefined} value={line.textSr} placeholder={sr} onChange={(e) => update(i, { textSr: e.target.value })} />
            <button
              type="button" className="btn btn-xs btn-ghost text-error" disabled={lines.length === 1}
              onClick={() => onChange(lines.filter((_, j) => j !== i))}
            >✕</button>
          </div>
        );
      })}
      <button type="button" className="btn btn-sm btn-outline btn-primary mt-1" onClick={() => onChange([...lines, { text: '', textSr: '' }])}>
        {addLabel}
      </button>
    </div>
  );
}

export default function RecipeForm({ initial, categories, onSave, onCancel }: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    titleSr: initial?.titleSr ?? '',
    slug: initial?.slug ?? '',
    description: initial?.description ?? '',
    descriptionSr: initial?.descriptionSr ?? '',
    imageUrl: initial?.imageUrl ?? '',
    videoUrl: initial?.videoUrl ?? '',
    categoryId: initial?.categoryId ?? '',
    published: initial?.published ?? true,
    featured: initial?.featured ?? false,
  });
  const [coverY, setCoverY] = useState(coverPos(initial ?? {}));
  const [ingredients, setIngredients] = useState(toLines(initial?.ingredients));
  const [steps, setSteps] = useState(toLines(initial?.steps));
  const [photos, setPhotos] = useState<Photo[]>(
    (initial?.images ?? []).map((img: any) => ({ url: img.url, caption: img.caption ?? '', posY: galleryPos(img) }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const updatePhoto = (i: number, patch: Partial<Photo>) => setPhotos((list) => list.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const result = await onSave({
      ...form,
      titleSr: form.titleSr || null,
      description: form.description || null,
      descriptionSr: form.descriptionSr || null,
      imageUrl: form.imageUrl || null,
      videoUrl: form.videoUrl.trim() || null,
      categoryId: form.categoryId || null,
      imagePosY: coverY,
      ingredients: cleanLines(ingredients),
      steps: cleanLines(steps),
      images: photos.filter((p) => p.url).map(({ url, caption, posY }) => ({ url, caption, posY })),
    });
    setSaving(false);
    if (!result.ok) setError(result.error ?? 'Something went wrong — check the console.');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">{initial ? 'Edit Recipe' : 'New Recipe'}</h2>
      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}
      {initial?.instagramId && (
        <div className="badge badge-outline badge-secondary">Imported from Instagram ({initial.instagramId})</div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="fieldset">
          <span className="fieldset-legend justify-start">Title (EN) *</span>
          <input
            type="text" className="input w-full" value={form.title} required
            onChange={(e) => set({ title: e.target.value, ...(!initial && { slug: slugify(e.target.value) }) })}
          />
        </label>
        <label className="fieldset">
          <span className="fieldset-legend justify-start">Naslov (SR)</span>
          <input
            type="text" className="input w-full" value={form.titleSr} placeholder="Optional — falls back to English"
            onChange={(e) => set({ titleSr: e.target.value })}
          />
        </label>
      </div>

      <label className="fieldset">
        <span className="fieldset-legend justify-start">
          Slug <span className="opacity-50 font-normal">(URL path — must be unique)</span>
        </span>
        <input type="text" className="input w-full font-mono text-sm" value={form.slug} required onChange={(e) => set({ slug: e.target.value })} />
        <span className="text-xs opacity-50 mt-1">Preview: /recipes/{form.slug || '��'}</span>
      </label>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="fieldset">
          <span className="fieldset-legend justify-start">Short Description (EN)</span>
          <textarea
            className="textarea w-full" rows={3} value={form.description} placeholder="One or two sentences shown on the recipe card..."
            onChange={(e) => set({ description: e.target.value })}
          />
        </label>
        <label className="fieldset">
          <span className="fieldset-legend justify-start">Kratak opis (SR)</span>
          <textarea className="textarea w-full" rows={3} value={form.descriptionSr} onChange={(e) => set({ descriptionSr: e.target.value })} />
        </label>
      </div>

      <ImageUpload
        value={form.imageUrl}
        onUpload={(url) => {
          set({ imageUrl: url });
          setCoverY(50);
        }}
        label="Main photo"
        hint="Shown on recipe cards, the homepage, and first in the photo slider on the recipe page."
      />
      {form.imageUrl && <PhotoPosition url={form.imageUrl} value={coverY} onChange={setCoverY} />}

      <label className="fieldset">
        <span className="fieldset-legend justify-start">
          Video URL <span className="opacity-50 font-normal">(optional — .mp4 / Cloudinary link)</span>
        </span>
        <input
          type="url" className="input w-full text-sm" value={form.videoUrl} placeholder="https://res.cloudinary.com/…/video.mp4"
          onChange={(e) => set({ videoUrl: e.target.value })}
        />
        {form.videoUrl && <video src={form.videoUrl} controls muted playsInline className="mt-2 rounded-xl max-h-64 w-auto bg-black" />}
      </label>

      <label className="fieldset">
        <span className="fieldset-legend justify-start">Category</span>
        <select className="select w-full" value={form.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
          <option value="">— No category —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>

      <LineList
        label="Ingredients"
        hint={<>Tip: start a line with <code>##</code> to make a section heading, e.g. <code>## For the crust</code>.</>}
        lines={ingredients}
        onChange={setIngredients}
        placeholders={() => ['e.g. 200 g almond flour', 'npr. 200 g bademovog brašna']}
        addLabel="+ Add Ingredient"
      />
      <LineList
        label="Steps"
        lines={steps}
        onChange={setSteps}
        multiline
        placeholders={(i) => [`Step ${i + 1}...`, `Korak ${i + 1}...`]}
        addLabel="+ Add Step"
      />

      <div>
        <p className="fieldset-legend justify-start">
          More Photos <span className="opacity-50 font-normal text-xs">(optional — shown in the photo slider next to the title)</span>
        </p>
        {photos.map((photo, i) => (
          <div key={i} className="border border-base-300 rounded-xl p-3 mb-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-60">Photo {i + 1}</span>
              <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => setPhotos((list) => list.filter((_, j) => j !== i))}>
                ✕ Remove
              </button>
            </div>
            <ImageUpload value={photo.url} onUpload={(url) => updatePhoto(i, { url })} label="Photo" />
            {photo.url && <PhotoPosition url={photo.url} value={photo.posY} onChange={(posY) => updatePhoto(i, { posY })} />}
            <input
              type="text" className="input input-sm w-full" placeholder="Caption (optional)" value={photo.caption}
              onChange={(e) => updatePhoto(i, { caption: e.target.value })}
            />
          </div>
        ))}
        <button
          type="button" className="btn btn-sm btn-outline btn-secondary"
          onClick={() => setPhotos((list) => [...list, { url: '', caption: '', posY: 50 }])}
        >
          + Add Photo
        </button>
      </div>

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" className="toggle toggle-primary" checked={form.published} onChange={(e) => set({ published: e.target.checked })} />
        <span className="text-sm">{form.published ? '🟢 Published (visible on site)' : '🟡 Draft (hidden from visitors)'}</span>
      </label>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" className="toggle toggle-warning" checked={form.featured} onChange={(e) => set({ featured: e.target.checked })} />
        <span className="text-sm">{form.featured ? '⭐ Shown in the homepage slider' : 'Not on the homepage'}</span>
      </label>

      <div className="flex justify-end gap-3 pt-2 border-t border-base-300">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Recipe'}
        </button>
      </div>
    </form>
  );
}

