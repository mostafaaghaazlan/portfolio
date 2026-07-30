/*
 * Resolve an internal route against the deployment base path.
 *
 * The sibling of `asset()`, and needed for the same reason: the site is served from
 * '/' as a user site and from '/portfolio/' as a project site. `<NuxtLink to>` and
 * `<RouterLink>` prepend the base for you, but a hand written `<a href>` does not, so
 * a literal `href="/#work"` points at the *domain* root. Under a base path that
 * leaves the site entirely.
 *
 * With JS running the click handlers intercept and scroll, which is what hid this:
 * only the things that read the real href broke, namely the status bar preview,
 * middle click, open in new tab, and the whole page with JS disabled.
 *
 * Use this for any internal href written by hand. Use `asset()` for files in public/.
 */
export function link(path: string): string {
  const base = useRuntimeConfig().app.baseURL || '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  // A bare fragment is already relative to the current document, so leave it alone.
  if (path.startsWith('#')) return path
  return prefix + path.replace(/^\/+/, '')
}
