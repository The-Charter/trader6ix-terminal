/**
 * Where the API lives, as seen by the browser.
 *
 * Empty by default, which means same-origin — the normal single-deployment
 * setup where the Next app serves both pages and API routes. Set
 * `NEXT_PUBLIC_API_BASE_URL` when the frontend and the API are deployed
 * separately (e.g. pages on Netlify, API on Render): every client call then
 * targets that origin instead of a relative path.
 *
 * This is a build-time value, so changing it requires a rebuild.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

/** True when the client talks to a different origin than the one serving the page. */
export const API_IS_CROSS_ORIGIN = API_BASE !== "";

/** Resolves an API path against the configured base. */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
