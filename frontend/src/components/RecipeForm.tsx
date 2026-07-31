// RecipeForm — create or edit a recipe from the admin dashboard.
// `initial` is the existing recipe object when editing, or null when creating.
// `onSave` is called with the cleaned form data and returns { ok, error? }.

import { useState } from 'react';
import ImageUpload from './ImageUpload';

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

export default function RecipeForm({ initial, categories, onSave, onCancel }: Props) {
  const [title, setTitle] = useState<string>(initial?.title ?? '');
  const [slug, setSlug] = useState<string>(initial?.slug ?? '');
  const [description, setDescription] = useState<string>(initial?.description ?? '');
  const [imageUrl, setImageUrl] = useState<string>(initial?.imageUrl ?? '');
  const [categoryId, setCategoryId] = useState<string>(initial?.categoryId ?? '');
  const [published, setPublished] = useState<boolean>(initial?.published ?? true);
  const [ingredients, setIngredients] = useState<string[]>(
    initial?.ingredients?.length ? initial.ingredients.map((i: any) => i.text) : ['']
  );
  const [steps, setSteps] = useState<string[]>(
    initial?.steps?.length ? initial.steps.map((s: any) => s.text) : ['']
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleTitleChange(v: string) {
    setTitle(v);
    // Auto-generate slug only while creating — don't overwrite an existing slug
    if (!initial) setSlug(slugify(v));
  }

  function updateList(list: string[], index: number, value: string, setter: (v: string[]) => void) {
    const copy = [...list];
    copy[index] = value;
    setter(copy);
  }

  function addItem(list: string[], setter: (v: string[]) => void) {
    setter([...list, '']);
  }

  function removeItem(list: string[], index: number, setter: (v: string[]) => void) {
    setter(list.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const result = await onSave({
      title,
      slug,
      description: description || null,
      imageUrl: imageUrl || null,
      categoryId: categoryId || null,
      published,
      ingredients: ingredients.filter(Boolean),
      steps: steps.filter(Boolean),
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
        <span className="text-xs opacity-50 mt-1">Preview: /recipes/{slug || '…'}</span>
      </label>

      {/* Description */}
      <label className="form-control">
        <span className="label-text font-semibold mb-1">Short Description</span>
        <textarea
          className="textarea textarea-bordered" rows={2} value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="One or two sentences that appear on the recipe card..."
        />
      </label>

      {/* Cover Image — uploads to Cloudinary */}
      <ImageUpload value={imageUrl} onUpload={(url) => setImageUrl(url)} />

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
        <p className="label-text font-semibold mb-2">Ingredients</p>
        {ingredients.map((ing, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <span className="text-xs opacity-50 w-5 text-right flex-shrink-0">{i + 1}.</span>
            <input
              type="text" className="input input-bordered input-sm flex-1"
              value={ing} placeholder={`e.g. 200g almond flour`}
              onChange={(e) => updateList(ingredients, i, e.target.value, setIngredients)}
            />
            <button
              type="button" className="btn btn-xs btn-ghost text-error"
              onClick={() => removeItem(ingredients, i, setIngredients)}
              disabled={ingredients.length === 1}
            >✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-outline btn-primary mt-1" onClick={() => addItem(ingredients, setIngredients)}>
          + Add Ingredient
        </button>
      </div>

      {/* Steps */}
      <div>
        <p className="label-text font-semibold mb-2">Steps</p>
        {steps.map((step, i) => (
          <div key={i} className="flex gap-2 mb-2 items-start">
            <span className="text-xs opacity-50 w-5 text-right flex-shrink-0 mt-2">{i + 1}.</span>
            <textarea
              className="textarea textarea-bordered textarea-sm flex-1" rows={2}
              value={step} placeholder={`Step ${i + 1}...`}
              onChange={(e) => updateList(steps, i, e.target.value, setSteps)}
            />
            <button
              type="button" className="btn btn-xs btn-ghost text-error mt-1"
              onClick={() => removeItem(steps, i, setSteps)}
              disabled={steps.length === 1}
            >✕</button>
          </div>
        ))}
        <button type="button" className="btn btn-sm btn-outline btn-primary mt-1" onClick={() => addItem(steps, setSteps)}>
          + Add Step
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

