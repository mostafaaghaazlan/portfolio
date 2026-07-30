/*
 * Resolve a path inside `public/` against the deployment base path.
 *
 * Nuxt rewrites asset URLs it owns, but a bare string in a `src` or
 * `background-image` is invisible to it. The site is served from '/' as a user
 * site and from '/portfolio/' as a project site, so every public asset has to
 * go through here or it breaks on one of the two.
 *
 * Store paths without a leading slash: `img/logos/wadeni.png`.
 */
export function asset(path: string): string {
  const base = useRuntimeConfig().app.baseURL || '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  return prefix + path.replace(/^\/+/, '')
}
