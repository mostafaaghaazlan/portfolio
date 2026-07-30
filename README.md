# Portfolio

Personal portfolio site for Mostafa Ghazlan. Mobile and backend engineering work:
Flutter clients, .NET and ABP services, Vue and Nuxt frontends.

## Stack

Nuxt 4 with Vue 3 Composition API and TypeScript, prerendered to static HTML.
Tailwind CSS v4 through its Vite plugin, GSAP with ScrollTrigger for scroll
choreography, Lenis for smooth scrolling, SplitType for line and character
splitting, and Three.js for the background field.

| Path | Purpose |
| ---- | ------- |
| `app/data/content.ts` | All site content. Edit here, not in the components |
| `scripts/check-package-manager.mjs` | `preinstall` guard: npm only |
| `app/pages/index.vue` | Section composition and the narrative order |
| `app/pages/work/[slug].vue` | Project detail pages, prerendered per project |
| `app/components/Section*.vue` | One component per section |
| `app/components/BrandMark.vue` | A project's logo on the plate its ink needs |
| `app/assets/css/main.css` | Design tokens, reveal gating, shared component styles |
| `app/composables/useMotion.ts` | `useScene`, split helpers, reduced-motion gate |
| `app/composables/useSmoothScroll.ts` | Lenis, wired to the GSAP ticker |
| `scripts/build-docs.mjs` | `npm run deploy`: builds and stages the site into `docs/` |
| `scripts/optimize-assets.mjs` | Generates the shipped `.webp` from the source PNGs |
| `scripts/trim-prefetch.mjs` | Drops prefetch hints for oversized chunks |
| `docs/` | The published site. Generated, do not edit by hand |
| `public/img/logos/` | Project logos, taken from each project's own repo |
| `public/img/icons/` | Simple Icons SVGs, drawn as CSS masks |

## Develop

```sh
npm install
npm run dev        # http://localhost:3000
npm run typecheck
```

**npm only**, enforced two ways:

- `"packageManager": "npm@…"` in package.json. This is the one that matters, because
  Nuxt installs things on its own: `nuxt prepare` can ask nypm to fetch a missing
  icon collection, and nypm picks a package manager by looking for a lockfile. With
  a stray `pnpm-lock.yaml` present it picks pnpm, pnpm re-resolves the tree, and
  that regenerates the lockfile, so the next detection picks pnpm again. The
  `packageManager` field is read first and breaks that loop.
- `scripts/check-package-manager.mjs` as a `preinstall` guard, which stops a human
  typing `pnpm install` with an explanation. It cannot catch the programmatic case
  above, because pnpm's automatic dependency install bypasses root lifecycle
  scripts.

This is not fussiness. `pnpm dev` does not just run the dev script: it re-resolves
the whole tree first, moves everything npm installed into `node_modules/.ignored`,
then blocks esbuild's build script by default and exits non-zero before Nuxt
starts. Worse, `.ignored` keeps a second full copy of TypeScript, and its
`lib.dom.d.ts` gives `vue-tsc` a duplicate set of DOM interfaces, so `npm run
typecheck` fails across the whole project with `HTMLAllCollection` mismatches that
look like a Vue bug. If it has already happened:

```sh
rmdir /s /q node_modules   # Windows; rm -rf node_modules elsewhere
del pnpm-lock.yaml pnpm-workspace.yaml
npm ci
```

On Windows, stop the dev server first or the locked binaries make the delete fail
halfway, which leaves a tree with no `nuxt` in it and a 500 from the dev server.

## Build

```sh
npm run generate   # prerenders to .output/public, then trims prefetch hints
npm run preview
```

## Deploy

GitHub Pages serves this in **Deploy from a branch** mode, set to **`main` / `docs`**.
There is no CI workflow: GitHub Actions is not available on this account, so the built
site is committed rather than built on push.

```sh
npm run deploy      # builds and stages the site into docs/
git add docs && git commit -m "Deploy" && git push
```

`npm run deploy` (`scripts/build-docs.mjs`) is the whole deploy step. It does three
things by hand that CI used to do, and each one breaks the site silently if skipped:

1. **Derives `BASE_PATH` from the git remote.** The repo is not named
   `<user>.github.io`, so the site is served from `/<repo>/` and every asset and route
   URL needs that prefix. Renaming the repository to `<user>.github.io` switches it to
   `/` automatically.
2. **Fails the build if `.nojekyll` is missing.** A branch deploy runs through Jekyll,
   which ignores directories starting with an underscore, so without that file the
   whole `_nuxt` directory 404s and the site loads as unstyled HTML.
3. **Repoints the "Back home" link in `404.html` and `200.html`.**
   `app/spa-loading-template.html` is plain HTML with no access to `app.baseURL`, so it
   ships pointing at `/`, which would send someone from a 404 to the domain root.

`docs/` is replaced wholesale each run, so a file dropped from the site does not
linger in the published output.

To build against a different base without deploying:

```sh
# PowerShell
$env:BASE_PATH = '/portfolio/'; npm run generate

# Git Bash on Windows: MSYS rewrites a leading-slash value into a Windows path,
# so disable that conversion or the base comes out as /Program Files/Git/portfolio/
MSYS_NO_PATHCONV=1 BASE_PATH=/portfolio/ npm run generate
```

### If Actions ever becomes available

The site is a plain static export, so building in CI and publishing
`.output/public` with `actions/deploy-pages` works with no code change. Recover the
workflow that did it from git history, switch Pages to **Source: GitHub Actions**, and
delete `docs/` along with the `deploy` script.

Anything read out of `public/` must go through `asset()` in `app/utils/asset.ts`.
Nuxt rewrites the asset URLs it owns, but a bare `src="/img/..."` string is
invisible to it and breaks under a base path.

### Build flags

| Variable | Default | Effect |
| -------- | ------- | ------ |
| `BASE_PATH` | `/` | Deployment base path |
| `NUXT_PUBLIC_CONTACT_ENDPOINT` | empty | Where the contact form posts. Empty means the form hands off to the visitor's mail client and says so, rather than pretending to send |
| `NUXT_PUBLIC_INTRO` | `true` | Set `false` to drop the opening loader and render the hero headline unmasked |

## Editing content

Everything a visitor reads lives in `app/data/content.ts`.

- `projects` drives both the stacked work panels and the `/work/<slug>` pages.
- `indexGroups` drives the horizontal project index.
- `stack` drives the technology grid. Icons resolve to `public/img/icons/<icon>.svg`.
- `timeline` is a shipping log. Every date is the real first commit month of the
  repository named beside it.
- `figures` are summed from git history across the local repositories. Re-derive
  them rather than editing by hand:
  `git rev-list --count --author=mostafa -i HEAD` per repo.
- `principles` are quoted verbatim from the named repository's own docs. They are
  design commitments with a traceable source. There are no testimonials on this
  site because there are no real ones to quote, and inventing client praise is the
  one thing on a portfolio that cannot be walked back.

### Project logos

The `.png` files are the originals, taken from each project's own repository, and
are the source of truth. The `.webp` beside each one is generated by
`npm run assets:optimize` and is what ships; the originals ran up to 77 KB for a
mark drawn at 64px. Rerun that script after adding or replacing a logo, then point
`content.ts` at the `.webp`.

Two rules matter:

1. **`logo: null` means the project has no usable mark of its own**, and it renders
   a monogram. Do not fill the gap with someone else's brand.
2. **`plate` is a legibility requirement, not a style choice.** Getting it wrong
   does not throw, it quietly turns the mark to mud. `BrandMark.vue` is the only
   place that applies it, so it stays consistent.

   | `plate` | For | Rendering |
   | ------- | --- | --------- |
   | `light` | transparent mark, dark or mid tone ink (Noon, Wadeni, Bakeet, Merch) | inset on a pale tile |
   | `dark` | transparent mark, white ink (Itaq, Termius, Enjaz) | inset on the page surface |
   | `image` | fully opaque artwork that already has its own background (Jenkins, Synergy, ITAQ bridge, Attendance) | fills the tile edge to edge |

   Decide from the file, not the eye. A mark that is mostly transparent needs a
   plate chosen by its ink luminance; a mark that is fully opaque needs `image`,
   because insetting it on a plate it does not need looks like a picture in a frame.
   Checking is a couple of lines with sharp: read `metadata().hasAlpha`, then the
   mean luminance of the pixels whose alpha is above 200.

## Design notes

Dark luxury, one theme, locked in `main.css`:

- **Theme** dark only, no inversion, `color-scheme` pinned.
- **Radius** 0 everywhere. `border-radius: 9999px` is allowed only on genuinely
  circular objects, which is the cursor ring.
- **Accent** one violet (`#7C5CFF`), for CTA fills, active markers, focus rings and
  link underlines. Nothing else gets a colour.
- **Contrast** `--faint` is the floor at 5.8:1 on `--ink`. The real background is
  ink plus the WebGL glow, so the glow is deliberately kept weak enough that
  `--faint` still clears 4.5:1 at its brightest. Do not brighten one without
  rechecking the other.
- **Layout** nine sections, nine different layout families, so no two sections
  rhyme: asymmetric editorial hero, image and text split, sticky stack, horizontal
  pan, tilt grid, scrubbed rail, expanding rows, marquee with an asymmetric quote
  block, and statement with a form.

### Motion

`useScene` is the only way animation enters a component. It checks
`prefers-reduced-motion` once, refuses to run its callback when motion is reduced,
scopes everything to a `gsap.context` on the section root, and reverts on unmount.
A section therefore cannot forget to honour reduced motion or leak a pinned spacer
across a route change.

There are no scroll listeners anywhere. Scroll position is read through
ScrollTrigger, which batches against Lenis; Lenis in turn is driven by the GSAP
ticker with `lagSmoothing(0)` so pinned content resolves in the same frame.

Three traps in here are easy to reintroduce and are documented at the point of use:

- **Masked text must use `fromTo(el, maskHidden(), { yPercent: 0 })`.** GSAP reads
  the computed transform matrix, in which the stylesheet's `translate3d(0,110%,0)`
  has already resolved into a pixel `y`. Animating `yPercent` to 0 therefore
  completes perfectly and changes nothing, and the text stays parked below its mask.
  The failure is silent: no error, and every sibling tween still runs.
- **Pre-animation states belong on `data-reveal`, never in a component
  stylesheet.** `data-reveal` is gated on `html.motion-ready`, which an inline head
  script adds only when JS is running and motion is allowed. A raw `opacity: 0` in a
  scoped block is invisible content forever if the bundle fails to execute.
- **No `:global(html.…)` selectors.** Vue's scoped-style compiler dropped the
  descendant from `:global(html.motion-ready) .preloader` and applied the
  preloader's `position: fixed; display: grid` to the root element, which made
  `<body>` a shrink-to-fit grid item and collapsed every layout on the site. Rules
  keyed on a class on `<html>` live in `main.css` and match on an attribute.

## Performance

Measured with Lighthouse against `npm run generate` output served locally, median
of five runs on the default mobile profile (4x CPU throttle, slow 4G):

| Category | Score |
| -------- | ----- |
| Performance | 91 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

FCP 2.6s, LCP 2.8s, TBT 50ms, CLS 0.007, 313 KB transferred.

Performance started at 75. What moved it, largest first:

1. **Dropping the prefetch hint for the Three.js chunk** (75 to 89). Nuxt prefetches
   every lazy chunk; that one is 483 KB raw. `WebglField` declines to import Three
   below 768px or on a save-data connection, so on the profile Lighthouse actually
   tests it was downloaded and never executed. `scripts/trim-prefetch.mjs` drops
   hints for chunks over 100 KB, matching on size because the filenames are hashed.
2. **Pinning fonts to `woff2`** (89 to 92). The module was also emitting a legacy
   `woff` face per weight with no `unicode-range`, so those covered every codepoint
   and beat the subsetted woff2 faces outright: 170 KB of woff fetched, 143 KB of
   woff2 sitting unused beside it.
3. **Not preloading images to feed the loader's progress bar.** It was eagerly
   fetching every project mark, about 250 KB of PNG, none of it on the first screen.
   It now waits on fonts only.
4. **Optimising the marks**, 1313 KB of PNG to 185 KB of WebP.
5. **Inlining the stylesheets.** Three render-blocking CSS requests measured 458ms
   of delayed paint between them, almost entirely round trip latency rather than
   bytes. The two shared component sheets could not be inlined by Nuxt, so `.btn`
   and `.mark` were folded into `main.css`.

The remaining gap to 95 is CPU-bound, not bytes: about 820ms of style and layout
plus 590ms of script evaluation for nine animated sections under a 4x throttle.
`NUXT_PUBLIC_INTRO=false` was measured and does **not** help, so the loader is not
the bottleneck it looks like.

## To do

Real app screenshots would strengthen the work panels. The panels are built around
the logo and the project's initials as outlined ghost type, so a screenshot would
sit best as an additional media layer rather than replacing either. Suggested
slots, all 16:9: one per project on `/work/<slug>` under the mark band, and
optionally one per stacked panel on the home page.
