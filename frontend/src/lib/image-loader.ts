import { currentMediaPath } from "@/lib/public-path";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Photos that exist as 480, 960, 1200 and 1600 pixel files. */
const RESPONSIVE = new Set([
  "/images/site/rosi-hero.webp",
  "/images/site/rosi-desk.webp",
  "/images/site/rosi-smile.webp",
  "/images/site/rosi-about.webp",
  "/images/site/rosi-with-cards.webp",
  "/images/site/rosi-session.webp",
  "/images/site/rosi-cards-desk.webp",
  "/images/site/rosi-cards-detail.webp",
  "/images/site/rosi-cards-shelf.webp",
  "/images/cards-fan.webp",
  "/images/cards-sections.webp",
]);

function logicalPath(src: string) {
  const clean = currentMediaPath(src).split("?")[0];
  if (BASE && clean.startsWith(`${BASE}/`)) return clean.slice(BASE.length);
  return clean;
}

function variant(width: number) {
  if (width <= 480) return 480;
  if (width <= 960) return 960;
  if (width <= 1200) return 1200;
  return 1600;
}

/** Picks a pre-built file for the width Next.js asks for. */
export default function imageLoader({ src, width }: { src: string; width: number }) {
  const path = logicalPath(src);
  if (RESPONSIVE.has(path)) {
    return `${BASE}${path.replace(/\.webp$/, `-${variant(width)}.webp`)}`;
  }
  if (path.startsWith("/images/cards/") && path.endsWith(".webp") && width <= 480) {
    return `${BASE}${path.replace(/\.webp$/, "-480.webp")}`;
  }
  return `${BASE}${path}`;
}
