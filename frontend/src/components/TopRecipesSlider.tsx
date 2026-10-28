import { useEffect, useMemo, useState } from 'react';
import { coverFraming, frameStyle } from '../lib/imageFrame';

interface Recipe {
  slug: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePosX?: number;
  imagePosY?: number;
  imageZoom?: number;
  category?: { name?: string } | null;
}

interface Props {
  recipes: Recipe[];
  basePath: string;
}

const AUTOPLAY_MS = 5500;

export default function TopRecipesSlider({ recipes, basePath }: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const safeRecipes = useMemo(() => recipes.filter((recipe) => recipe && recipe.slug), [recipes]);
  const count = safeRecipes.length;

  // Autoplay (pauses on hover/focus and respects reduced-motion)
  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setTimeout(() => setCurrent((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [current, paused, count]);

  if (!count) return null;

  const prev = () => setCurrent((i) => (i - 1 + count) % count);
  const next = () => setCurrent((i) => (i + 1) % count);
  const active = safeRecipes[current];

  return (
    <div
      className="relative overflow-hidden rounded-[2.5rem] bg-neutral text-neutral-content shadow-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
    >
      {/* Slides (cross-fade) */}
      <div className="relative h-[440px] sm:h-[520px]">
        {safeRecipes.map((recipe, index) => (
          <a
            key={recipe.slug}
            href={`${basePath}/${recipe.slug}`}
            className={`group absolute inset-0 transition-opacity duration-700 ${
              index === current ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'
            }`}
            aria-hidden={index !== current}
            tabIndex={index === current ? 0 : -1}
          >
            <img
              src={recipe.imageUrl ?? '/logo.png'}
              alt={recipe.title}
              style={frameStyle(coverFraming(recipe))}
              className={`h-full w-full object-cover transition-[scale] duration-[6000ms] ease-out ${
                index === current ? 'scale-105' : 'scale-100'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-end p-8 sm:p-12 text-white">
              {recipe.category?.name && (
                <span className="mb-4 w-fit rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  {recipe.category.name}
                </span>
              )}
              <h3 className="font-display text-3xl sm:text-5xl font-semibold leading-tight">{recipe.title}</h3>
              {recipe.description && (
                <p className="mt-3 text-base sm:text-lg text-white/80 line-clamp-2">{recipe.description}</p>
              )}
              <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-content shadow-lg transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Controls */}
      {count > 1 && (
        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-4 sm:bottom-10 sm:right-10">
          <div className="hidden sm:flex items-center gap-2">
            {safeRecipes.map((r, index) => (
              <button
                key={r.slug}
                type="button"
                onClick={() => setCurrent(index)}
                aria-label={`Go to ${r.title}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === current ? 'w-10 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prev}
              className="btn btn-circle border-0 bg-white/15 text-white backdrop-blur hover:bg-white/30"
              aria-label="Previous recipe"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              className="btn btn-circle border-0 bg-white/15 text-white backdrop-blur hover:bg-white/30"
              aria-label="Next recipe"
            >
              ›
            </button>
          </div>
        </div>
      )}

      {/* Thumbnails (desktop) */}
      {count > 1 && (
        <div className="absolute right-6 top-6 z-20 hidden lg:flex flex-col gap-3">
          {safeRecipes.map((r, index) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => setCurrent(index)}
              aria-label={r.title}
              className={`h-16 w-16 overflow-hidden rounded-2xl ring-2 transition-all ${
                index === current ? 'ring-white scale-105' : 'ring-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={r.imageUrl ?? '/logo.png'} alt="" className="h-full w-full object-cover" style={frameStyle(coverFraming(r))} />
            </button>
          ))}
        </div>
      )}

      <span className="sr-only" aria-live="polite">{active.title}</span>
    </div>
  );
}

