const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const legacyImages: Record<string, string> = {
  "/images/product-box.jpg": "/images/product-box.webp",
  "/images/cards-overview.jpg": "/images/cards-sections-1200.webp",
  "/images/cards/section-1-card-1.jpg": "/images/cards/section-1-card-1.webp",
  "/images/cards/section-2-card-1.jpg": "/images/cards/section-2-card-1.webp",
  "/images/cards/section-4-card-1.jpg": "/images/cards/section-4-card-1.webp",
  "/images/site/rosi-hero.jpg": "/images/site/rosi-hero-1200.webp",
  "/images/site/rosi-portrait.jpg": "/images/site/rosi-about-1200.webp",
  "/images/site/rosi-portrait-2.jpg": "/images/site/rosi-smile-1200.webp",
  "/images/site/rosi-wide.jpg": "/images/site/rosi-desk-1600.webp",
};

/** Public file path, including the GitHub Pages project prefix when publishing. */
export function publicPath(path: string) {
  if (!path.startsWith("/") || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

export function currentMediaPath(url: string) {
  const clean = url.split("?")[0];
  const logical = base && clean.startsWith(`${base}/`) ? clean.slice(base.length) : clean;
  const mapped = legacyImages[logical];
  if (!mapped) return url;
  return url.replace(logical, mapped);
}

export function mediaSrc(url: string) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) return url;
  return publicPath(currentMediaPath(url.startsWith("/") ? url : `/${url}`));
}
