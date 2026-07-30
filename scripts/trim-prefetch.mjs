/*
 * Post-build pass over the generated HTML: drop <link rel="prefetch"> hints for
 * chunks that are too big to be worth speculatively fetching.
 *
 *   run automatically by `npm run generate`
 *
 * Why this exists. Nuxt emits a prefetch hint for every lazily imported chunk.
 * That is a sensible default for small route chunks and a bad one for the Three.js
 * bundle, which is 483 KB raw and about 120 KB over the wire, roughly a fifth of
 * everything the home page fetches. It is also waste on exactly the devices least
 * able to afford it: WebglField declines to import Three below 768px or on a
 * save-data connection, so on a phone that payload is fetched and never executed.
 *
 * Dropping the hint does not disable the feature. The dynamic import still pulls
 * Three in on demand, at idle, on devices that will actually draw it.
 *
 * Why a separate step rather than a nitro `prerender:generate` hook: at prerender
 * time the client chunks are not on disk yet, so their sizes cannot be read and
 * every hint survives. Running after the build means the sizes are simply there.
 *
 * Matching by size rather than by filename is deliberate, because the filenames
 * are content hashed and change on every meaningful edit.
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'

const PUBLIC_DIR = '.output/public'
const MAX_BYTES = 100 * 1024

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* htmlFiles(path)
    else if (entry.name.endsWith('.html')) yield path
  }
}

async function sizeOf(href) {
  // Hrefs are site absolute and carry the deployment base path. Everything after
  // the first `_nuxt/` segment is the path inside the public directory.
  const index = href.indexOf('_nuxt/')
  if (index === -1) return null
  try {
    return (await stat(join(PUBLIC_DIR, href.slice(index)))).size
  } catch {
    return null
  }
}

let removed = 0
let bytesSaved = 0
const seen = new Set()

for await (const file of htmlFiles(PUBLIC_DIR)) {
  const original = await readFile(file, 'utf8')
  const tags = [...original.matchAll(/<link\b[^>]*\brel="prefetch"[^>]*>/g)]
  if (!tags.length) continue

  let updated = original
  for (const [tag] of tags) {
    const href = /href="([^"]+)"/.exec(tag)?.[1]
    if (!href) continue
    const bytes = await sizeOf(href)
    if (bytes === null || bytes <= MAX_BYTES) continue

    updated = updated.replaceAll(tag, '')
    removed += 1
    if (!seen.has(href)) {
      seen.add(href)
      bytesSaved += bytes
      console.log(
        `dropped prefetch  ${href}  (${Math.round(bytes / 1024)} KB)  ` +
          `in ${relative(PUBLIC_DIR, file).split(sep).join('/')}`,
      )
    }
  }

  if (updated !== original) await writeFile(file, updated)
}

console.log(
  removed
    ? `\nremoved ${removed} prefetch hint(s), ${Math.round(bytesSaved / 1024)} KB of ` +
        `speculative download per first visit`
    : 'no oversized prefetch hints found',
)
