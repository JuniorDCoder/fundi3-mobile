const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Lesson content stores root-relative paths (e.g. "/illustrations/foo.svg") that
 * only resolve against the Next.js app serving `public/`. Prefix them with the
 * web app's origin so the mobile app can load them too. Absolute URLs pass through.
 */
export function resolveAssetUrl(src: string): string {
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/")) return `${API_BASE}${src}`;
  return src;
}

export function isSvgUrl(url: string): boolean {
  return /\.svg(\?.*)?$/i.test(url);
}
