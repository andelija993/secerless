// RecipeGallery — horizontal image slider with arrow navigation and dot indicators.
// Rendered as a client:load React island on the recipe detail page.

import { useState } from 'react';

interface GalleryImage {
  url: string;
  caption?: string | null;
}

interface Props {
  images: GalleryImage[];
}

export default function RecipeGallery({ images }: Props) {
  const [current, setCurrent] = useState(0);

  if (!images || images.length === 0) return null;

  const prev = () => setCurrent((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrent((i) => (i + 1) % images.length);

  return (
    <div className="mb-10">
      {/* Main slide */}
      <div className="relative rounded-2xl overflow-hidden group">
        <img
          key={current}
          src={images[current].url}
          alt={images[current].caption ?? `Photo ${current + 1}`}
          className="w-full h-72 sm:h-96 object-cover transition-opacity duration-300"
        />

        {/* Gradient overlay so arrows are visible on bright photos */}
        {images.length > 1 && (
          <>
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/30 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/30 to-transparent" />

            {/* Prev arrow */}
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/50 border-0 text-white hover:bg-black/80 opacity-80 group-hover:opacity-100 transition-opacity"
              aria-label="Previous photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Next arrow */}
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-circle btn-sm bg-black/50 border-0 text-white hover:bg-black/80 opacity-80 group-hover:opacity-100 transition-opacity"
              aria-label="Next photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Counter badge */}
            <span className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
              {current + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Caption */}
      {images[current].caption && (
        <p className="text-center text-sm opacity-60 mt-2 italic">{images[current].caption}</p>
      )}

      {/* Dot indicators + thumbnail strip */}
      {images.length > 1 && (
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-lg overflow-hidden border-2 transition-all ${
                i === current ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
              aria-label={`Go to photo ${i + 1}`}
            >
              <img src={img.url} alt={`Thumbnail ${i + 1}`} className="h-14 w-20 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

