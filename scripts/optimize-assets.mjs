/*
 * Regenerate the web-ready copies of the project marks.
 *
 *   npm run assets:optimize
 *
 * The PNGs in public/img/logos are the originals, taken from each project's own
 * repository, and they are kept as the source of truth. They are also wildly
 * oversized for how they are used: app launcher icons at 1024px square, and a
 * 320px mark saved as a 77 KB PNG, all rendered at 64px in a card corner. Two of
 * them alone were 150 KB of the 686 KB the home page pulled on first load, which is
 * bandwidth taken from the text people are actually there to read.
 *
 * This writes a .webp beside each one. WebP with alpha is supported by every
 * browser in current use, and at these sizes it lands around 90% smaller with no
 * visible difference at the sizes the marks are drawn.
 *
 * Rerun this after adding or replacing a logo, and point content.ts at the .webp.
 * A non-PNG original should be converted to PNG first so this glob picks it up.
 */
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'

const LOGO_DIR = 'public/img/logos'

/* Marks are drawn at 176px at the very largest, on the project detail plate.
   512 gives comfortable headroom for a 2x display and still compresses small. */
const LOGO_MAX = 512

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`

async function convert(source, destination, transform) {
  const before = (await stat(source)).size
  await transform(sharp(source)).toFile(destination)
  const after = (await stat(destination)).size
  const saved = Math.round((1 - after / before) * 100)
  console.log(
    `${source.padEnd(34)} ${kb(before).padStart(7)} -> ${kb(after).padStart(7)}  (${saved}% smaller)`,
  )
  return { before, after }
}

const totals = { before: 0, after: 0 }

for (const file of (await readdir(LOGO_DIR)).filter((f) => f.endsWith('.png'))) {
  const result = await convert(
    join(LOGO_DIR, file),
    join(LOGO_DIR, file.replace(/\.png$/, '.webp')),
    (img) =>
      img
        // withoutEnlargement, so a mark smaller than the cap is never upscaled
        // into a blurrier, larger file than it started as.
        .resize({ width: LOGO_MAX, height: LOGO_MAX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82, effort: 6, alphaQuality: 100 }),
  )
  totals.before += result.before
  totals.after += result.after
}

console.log(
  `\ntotal ${kb(totals.before)} -> ${kb(totals.after)} ` +
    `(${Math.round((1 - totals.after / totals.before) * 100)}% smaller)`,
)
