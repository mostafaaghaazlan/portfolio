/*
 * Build the site and stage it in docs/ for GitHub Pages.
 *
 *   npm run deploy
 *
 * This repository publishes with Pages' "Deploy from a branch" mode, set to
 * main / docs, because GitHub Actions is not available on this account. That means
 * the built site is committed rather than built by CI, so this script exists to make
 * the step one command and hard to get wrong.
 *
 * Two things it gets right that are easy to miss by hand:
 *
 *   - BASE_PATH. The repo is not named <user>.github.io, so the site is served from
 *     /<repo>/ and every asset and route URL has to carry that prefix. The value is
 *     derived from the git remote rather than hardcoded, so renaming the repository
 *     to <user>.github.io keeps working.
 *   - .nojekyll. Pages runs Jekyll over a branch deploy, and Jekyll ignores
 *     directories whose names start with an underscore. Without this file the whole
 *     _nuxt directory 404s and the site loads as unstyled HTML. The check is fatal
 *     rather than a warning.
 *
 * docs/ is replaced wholesale each run, so a file removed from the site does not
 * linger in the published output.
 */
import { execFileSync } from 'node:child_process'
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'

const OUT = '.output/public'
const DOCS = 'docs'

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim()
}

/** '/<repo>/' for a project site, '/' for a <user>.github.io user site. */
function resolveBasePath() {
  let repo
  try {
    const url = git('remote', 'get-url', 'origin')
    repo = url.replace(/\.git$/, '').split('/').pop()
  } catch {
    throw new Error('no git remote named origin, cannot derive the base path')
  }
  if (!repo) throw new Error('could not read a repository name from the origin URL')
  return repo.endsWith('.github.io') ? '/' : `/${repo}/`
}

const basePath = resolveBasePath()
console.log(`base path: ${basePath}`)

console.log('building...')
execFileSync('npm', ['run', 'generate'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, BASE_PATH: basePath },
})

// Fatal, not a warning: without it Pages serves a site with no CSS or JS.
try {
  await stat(`${OUT}/.nojekyll`)
} catch {
  throw new Error(`${OUT}/.nojekyll is missing; Pages would refuse to serve _nuxt`)
}

console.log(`staging ${OUT} -> ${DOCS}`)
await rm(DOCS, { recursive: true, force: true })
await mkdir(DOCS, { recursive: true })
await cp(OUT, DOCS, { recursive: true })

/*
 * Repoint the "Back home" link in the static fallback pages.
 *
 * app/spa-loading-template.html is plain HTML with no access to app.baseURL, so it
 * ships pointing at '/'. That is right for a user site and wrong for a project site,
 * where it would send someone from a 404 to the domain root instead of back here.
 * The deleted CI workflow used to patch this with sed; now that deploys are manual it
 * belongs here, or it silently never happens.
 */
if (basePath !== '/') {
  for (const page of ['404.html', '200.html']) {
    const path = `${DOCS}/${page}`
    try {
      const html = await readFile(path, 'utf8')
      const patched = html.replaceAll('href="/"', `href="${basePath}"`)
      if (patched !== html) {
        await writeFile(path, patched)
        console.log(`repointed the fallback link in ${page}`)
      }
    } catch {
      // 200.html only exists for some presets; a missing one is not a problem.
    }
  }
}

const entries = await readdir(DOCS)
console.log(`docs/ now holds ${entries.length} entries`)
console.log('\ndone. commit docs/ and push, then Pages serves main / docs.')
