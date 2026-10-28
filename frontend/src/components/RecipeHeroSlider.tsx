// RecipeHeroSlider — the big square photo next to the recipe title.
// Shows the cover photo first, then any gallery photos, with left/right arrows,
// dots, keyboard and swipe support. Each photo keeps its admin framing.

import { useRef, useState } from 'react';
import { frameStyle, optimizeImage, type Framing } from '../lib/imageFrame';

interface Slide {
  url: string;
  alt: string;
  frame: Framing;
}

interface Props {
  slides: Slide[];
}

export default function RecipeHeroSlider({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = slides.length;
  const many = count > 1;

  const go = (i: number) => setCurrent((i + count) % count);
  const prev = () => go(current - 1);
  const next = () => go(current + 1);

  return (
    <div
      className="group relative aspect-square w-full overflow-hidden rounded-[2.5rem] shadow-2xl outline-none"
      tabIndex={many ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) (dx > 0 ? prev() : next());
        touchX.current = null;
      }}
    >
      {slides.map((s, i) => (
        <img
          key={s.url + i}
          src={optimizeImage(s.url, 1100)}
          alt={s.alt}
          decoding="async"
          loading={i === 0 ? 'eager' : 'lazy'}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            i === current ? 'opacity-100' : 'opacity-0'
          }`}
          style={frameStyle(s.frame)}
        />
      ))}

      {many && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-base-100/85 text-base-content shadow-lg backdrop-blur hover:bg-base-100 hover:scale-110 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next photo"
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-base-100/85 text-base-content shadow-lg backdrop-blur hover:bg-base-100 hover:scale-110 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 rounded-full bg-black/30 px-3 py-2 backdrop-blur">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Photo ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

