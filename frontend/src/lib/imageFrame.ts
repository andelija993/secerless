// Image framing — lets the admin choose which part of a photo is visible
// inside the fixed-size frames (square on the recipe page, 4:3 on cards…).
//
//  x, y  → focus point in % (0 = left/top, 100 = right/bottom), used as
//          CSS object-position AND as the zoom origin so zooming keeps that spot.
//  zoom  → 1 = fill the frame (object-cover), up to 3× closer.
//
// The <img> must sit inside an element with `overflow: hidden` for zoom to be clipped.
// We use the CSS `transform` property, which composes with Tailwind's hover `scale-*`
// utilities (Tailwind 4 uses the separate `scale` property).

export interface Framing {
  x: number;
  y: number;
  zoom: number;
}

export const DEFAULT_FRAMING: Framing = { x: 50, y: 50, zoom: 1 };

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/** Framing of a recipe's cover image. */
export function coverFraming(r: { imagePosX?: number | null; imagePosY?: number | null; imageZoom?: number | null }): Framing {
  return { x: num(r.imagePosX, 50), y: num(r.imagePosY, 50), zoom: num(r.imageZoom, 1) };
}

/** Framing of a gallery image. */
export function galleryFraming(img: { posX?: number | null; posY?: number | null; zoom?: number | null }): Framing {
  return { x: num(img.posX, 50), y: num(img.posY, 50), zoom: num(img.zoom, 1) };
}

/** Style object for React components. */
export function frameStyle(f: Framing): Record<string, string> {
  return {
    objectPosition: `${f.x}% ${f.y}%`,
    transformOrigin: `${f.x}% ${f.y}%`,
    transform: f.zoom !== 1 ? `scale(${f.zoom})` : 'none',
  };
}

/** Same thing as an inline style string for .astro templates. */
export function frameCss(f: Framing): string {
  const s = frameStyle(f);
  return `object-position:${s.objectPosition};transform-origin:${s.transformOrigin};transform:${s.transform}`;
}

