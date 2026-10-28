// RecipeForm — create or edit a recipe from the admin dashboard.
// `initial` is the existing recipe object when editing, or null when creating.
// `onSave` is called with the cleaned form data and returns { ok, error? }.
// Every text field has an English (main) and optional Serbian version.

import { useState } from 'react';
import ImageUpload from './ImageUpload';
import ImageFramer from './ImageFramer';
import { coverFraming, galleryFraming, type Framing } from '../lib/imageFrame';

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD') // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '') // strip accent marks
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

interface Category {
  id: string;
  name: string;
}

interface SaveResult {
  ok: boolean;
  error?: string;
}

interface Props {
  initial: any | null;
  categories: Category[];
  onSave: (data: object) => Promise<SaveResult>;
  onCancel: () => void;
}

type Line = { text: string; textSr: string };

const toLines = (rows: any[] | undefined): Line[] =>
  rows?.length ? rows.map((r) => ({ text: r.text ?? '', textSr: r.textSr ?? '' })) : [{ text: '', textSr: '' }];

export default function RecipeForm({ initial, categories, onSave, onCancel }: Props) {
  const [title, setTitle] = useState<string>(initial?.title ?? '');
  const [titleSr, setTitleSr] = useState<string>(initial?.titleSr ?? '');
  const [slug, setSlug] = useState<string>(initial?.slug ?? '');
  const [description, setDescription] = useState<string>(initial?.description ?? '');
  const [descriptionSr, setDescriptionSr] = useState<string>(initial?.descriptionSr ?? '');
  const [imageUrl, setImageUrl] = useState<string>(initial?.imageUrl ?? '');
  const [videoUrl, setVideoUrl] = useState<string>(initial?.videoUrl ?? '');
  const [cover, setCover] = useState<Framing>(coverFraming(initial ?? {}));
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? '');
  const [published, setPublished] = useState<boolean>(initial?.published ?? true);
  const [ingredients, setIngredients] = useState<Line[]>(toLines(initial?.ingredients));
  const [steps, setSteps] = useState<Line[]>(toLines(initial?.steps));
  // Gallery: array of { url, caption }
  const [galleryImages, setGalleryImages] = useState<{ url: string; caption: string; frame: Framing }[]>(
    initial?.images?.length
      ? initial.images.map((img: any) => ({ url: img.url, caption: img.caption ?? '', frame: galleryFraming(img) }))
      : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!initial) setSlug(slugify(v));
  }

  function updateLine(list: Line[], index: number, key: keyof Line, value: string, setter: (v: Line[]) => void) {
    setter(list.map((l, i) => (i === index ? { ...l, [key]: value } : l)));
  }

  function addLine(list: Line[], setter: (v: Line[]) => void) {
    setter([...list, { text: '', textSr: '' }]);
  }

  function removeLine(list: Line[], index: number, setter: (v: Line[]) => void) {
    setter(list.filter((_, i) => i !== index));
  }

  function addGallerySlot() {
    setGalleryImages((prev) => [...prev, { url: '', caption: '', frame: { x: 50, y: 50, zoom: 1 } }]);
  }

  function removeGallerySlot(index: number) {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGalleryUrl(index: number, url: string) {
    setGalleryImages((prev) => prev.map((img, i) => (i === index ? { ...img, url } : img)));
  }

  function updateGalleryFrame(index: number, frame: Framing) {
    setGalleryImages((prev) => prev.map((img, i) => (i === index ? { ...img, frame } : img)));
  }

  function updateGalleryCaption(index: number, caption: string) {
    setGalleryImages((prev) => prev.map((img, i) => (i === index ? { ...img, caption } : img)));
  }

  const cleanLines = (list: Line[]) =>
    list
      .filter((l) => l.text.trim() || l.textSr.trim())
      // English is required by the DB — fall back to the Serbian text if only that was filled in
      .map((l) => ({ text: l.text.trim() || l.textSr.trim(), textSr: l.textSr.trim() || null }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const result = await onSave({
      title,
      titleSr: titleSr || null,
      slug,
      description: description || null,
      descriptionSr: descriptionSr || null,
      imageUrl: imageUrl || null,
      imagePosX: cover.x,
      imagePosY: cover.y,
      imageZoom: cover.zoom,
      videoUrl: videoUrl.trim() || null,
      categoryId: categoryId || null,
      published,
      ingredients: cleanLines(ingredients),
      steps: cleanLines(steps),
      images: galleryImages
        .filter((img) => img.url)
        .map((img) => ({ url: img.url, caption: img.caption, posX: img.frame.x, posY: img.frame.y, zoom: img.frame.zoom })),
    });
    setSaving(false);
    if (result && !result.ok) {
      setError(result.error ?? 'Something went wrong — check the console.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">{initial ? 'Edit Recipe' : 'New Recipe'}</h2>

      {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}

      {initial?.instagramId && (
        <div className="badge badge-outline badge-secondary">Imported from Instagram ({initial.instagramId})</div>
      )}

      {/* Title */}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="form-control">
          <span className="label-text font-semibold mb-1">Title (EN) *</span>
          <input
            type="text" className="input input-bordered" value={title} required
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </label>
        <label className="form-control">
          <span className="label-text font-semibold mb-1">Naslov (SR)</span>
          <input
            type="text" className="input input-bordered" value={titleSr}
            onChange={(e) => setTitleSr(e.target.value)}
            placeholder="Optional — falls back to English"
          />
        </label>
      </div>

      {/* Slug */}
      <label className="form-control">
        <span className="label-text font-semibold mb-1">
          Slug <span className="opacity-50 font-normal">(URL path — must be unique)</span>
        </span>
        <input
          type="text" className="input input-bordered font-mono text-sm" value={slug} required
          onChange={(e) => setSlug(e.target.value)}
        />
        <span className="text-xs opacity-50 mt-1">Preview: /recipes/{slug || '…'}</span>
      </label>

      {/* Description */}
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="form-control">
          <span className="label-text font-semibold mb-1">Short Description (EN)</span>
          <textarea
            className="textarea textarea-bordered" rows={3} value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One or two sentences that appear on the recipe card..."
          />
        </label>
        <label className="form-control">
          <span className="label-text font-semibold mb-1">Kratak opis (SR)</span>
          <textarea
            className="textarea textarea-bordered" rows={3} value={descriptionSr}
            onChange={(e) => setDescriptionSr(e.target.value)}
          />
        </label>
      </div>

      {/* Cover Image — uploads to Cloudinary */}
      <ImageUpload
        value={imageUrl}
        onUpload={(url) => { setImageUrl(url); setCover({ x: 50, y: 50, zoom: 1 }); }}
        label="Main photo"
        hint="Shown on recipe cards, the homepage, and first in the photo slider on the recipe page."
      />
      {imageUrl && <ImageFramer url={imageUrl} value={cover} onChange={setCover} />}

      {/* Video */}
      <label className="form-control">
        <span className="label-text font-semibold mb-1">
          Video URL <span className="opacity-50 font-normal">(optional — .mp4 / Cloudinary link)</span>
        </span>
        <input
          type="url" className="input input-bordered text-sm" value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://res.cloudinary.com/…/video.mp4"
        />
        {videoUrl && (
          <video src={videoUrl} controls muted playsInline className="mt-2 rounded-xl max-h-64 w-auto bg-black" />
        )}
      </label>

      {/* Category */}
      <label className="form-control">
        <span className="label-text font-semibold mb-1">Category</span>
        <select className="select select-bordered" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">— No category —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      {/* Ingredients */}
      <div>
        <p className="label-text font-semibold mb-1">Ingredients <span className="opacity-50 font-normal">(EN | SR)</span></p>
        <p className="text-xs opacity-60 mb-2">Tip: start a line with <code>##</code> to make a section heading, e.g. <code>## For the crust</code>.</p>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <span className="text-xs opacity-50 w-5 text-right flex-shrink-0">{i + 1}.</span>
            <input
              type="text" className="input input-bordered input-sm flex-1 min-w-0"
              value={ing.text} placeholder="e.g. 200 g almond flour"
              onChange={(e) => updateLine(ingredients, i, 'text', e.target.value, setIngredients)}
            />
            <input
              type="text" className="input input-bordered input-sm flex-1 min-w-0"
              value={ing.textSr} placeholder="npr. 200 g bademovog brašna"
              onChange={(e) => updateLine(ingredients, i, 'textSr', e.target.value, setIngredients)}
            />
            <button
              type="button" className="btn btn-xs btn-ghost text-error"
              onClick={() => removeLine(ingredients, i, setIngredients)}
              disabled={ingredients.length === 1}
            >✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-outline btn-primary mt-1" onClick={() => addLine(ingredients, setIngredients)}>
          + Add Ingredient
        </button>
      </div>

      {/* Steps */}
      <div>
        <p className="label-text font-semibold mb-2">Steps <span className="opacity-50 font-normal">(EN | SR)</span></p>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2 mb-2 items-start">
            <span className="text-xs opacity-50 w-5 text-right flex-shrink-0 mt-2">{i + 1}.</span>
            <textarea
              className="textarea textarea-bordered textarea-sm flex-1 min-w-0" rows={3}
              value={step.text} placeholder={`Step ${i + 1}...`}
              onChange={(e) => updateLine(steps, i, 'text', e.target.value, setSteps)}
            />
            <textarea
              className="textarea textarea-bordered textarea-sm flex-1 min-w-0" rows={3}
              value={step.textSr} placeholder={`Korak ${i + 1}...`}
              onChange={(e) => updateLine(steps, i, 'textSr', e.target.value, setSteps)}
            />
            <button
              type="button" className="btn btn-xs btn-ghost text-error mt-1"
              onClick={() => removeLine(steps, i, setSteps)}
              disabled={steps.length === 1}
            >✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-outline btn-primary mt-1" onClick={() => addLine(steps, setSteps)}>
          + Add Step
        </button>
      </div>

      {/* Gallery Images */}
      <div>
        <p className="label-text font-semibold mb-2">
          More Photos
          <span className="opacity-50 font-normal ml-2 text-xs">(optional — shown with the arrows in the photo slider next to the title)</span>
        </p>
        {galleryImages.map((img, i) => (
          <div key={i} className="border border-base-300 rounded-xl p-3 mb-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium opacity-60">Photo {i + 1}</span>
              <button
                type="button"
                className="btn btn-xs btn-ghost text-error"
                onClick={() => removeGallerySlot(i)}
              >✕ Remove</button>
            </div>
            <ImageUpload value={img.url} onUpload={(url) => updateGalleryUrl(i, url)} label="Photo" />
            {img.url && (
              <ImageFramer url={img.url} value={img.frame} onChange={(f) => updateGalleryFrame(i, f)} previews={['square']} />
            )}
            <input
              type="text"
              className="input input-bordered input-sm"
              placeholder="Caption (optional)"
              value={img.caption}
              onChange={(e) => updateGalleryCaption(i, e.target.value)}
            />
          </div>
        ))}
        <button
          type="button"
          className="btn btn-sm btn-outline btn-secondary"
          onClick={addGallerySlot}
        >
          + Add Photo
        </button>
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
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Recipe'}
        </button>
      </div>
    </form>
  );
}

