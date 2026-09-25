const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Public file path, including the GitHub Pages project prefix when publishing. */
export function publicPath(path: string) {
  if (!path.startsWith("/") || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}

export function mediaSrc(url: string) {
  if (!url || url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) return url;
  return publicPath(url.startsWith("/") ? url : `/${url}`);
}
