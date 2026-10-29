export const coverPos = (r: { imagePosY?: number | null }) => r.imagePosY ?? 50;
export const galleryPos = (img: { posY?: number | null }) => img.posY ?? 50;

export const posStyle = (y: number) => ({ objectPosition: `50% ${y}%` });
export const posCss = (y: number) => `object-position: 50% ${y}%`;

export function optimizeImage<T extends string | null | undefined>(url: T, width = 800): T {
  if (!url?.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (/\/upload\/(?:[a-z]{1,3}_[^/]+,?)+\//.test(url)) return url; // already transformed
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`) as T;
}

