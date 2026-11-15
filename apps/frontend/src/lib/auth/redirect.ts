const DEFAULT_POST_AUTH_PATH = "/dashboard";

/**
 * Reads the `next` query parameter at event/effect time. We deliberately avoid
 * useSearchParams so these pages don't need an extra Suspense boundary.
 */
export function getPostAuthPath(): string {
  if (typeof window === "undefined") return DEFAULT_POST_AUTH_PATH;

  const next = new URLSearchParams(window.location.search).get("next");

  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  return next;
}

export function buildAuthHref(path: "/signin" | "/signup", nextPath: string): string {
  if (nextPath === DEFAULT_POST_AUTH_PATH) return path;
  return `${path}?next=${encodeURIComponent(nextPath)}`;
}
