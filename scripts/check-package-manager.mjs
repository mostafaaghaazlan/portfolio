/*
 * Refuse to install with anything but npm.
 *
 * Wired up as the `preinstall` script, so it runs before a single package is
 * written and can stop the install cleanly.
 *
 * This exists because getting it wrong is expensive and the failure is confusing.
 * `pnpm dev` does not just run the dev script: it first re-resolves the whole tree
 * its own way, moves everything npm installed into `node_modules/.ignored`, and
 * then blocks esbuild's build script by default, which exits non-zero before Nuxt
 * ever starts. Recovering means deleting node_modules entirely, and on Windows the
 * locked binaries make even that fail halfway, leaving a tree with no `nuxt` in it
 * and a 500 from the dev server that looks nothing like a package manager problem.
 *
 * The project is on npm because the deploy workflow runs `npm ci` against
 * package-lock.json. Two lockfiles cannot both be the source of truth, so
 * pnpm-lock.yaml and yarn.lock are gitignored and this check keeps them from being
 * created in the first place.
 *
 * If the project ever does move to pnpm: change the workflow, delete
 * package-lock.json, drop the ignores in .gitignore, and update EXPECTED below.
 */
const EXPECTED = 'npm'

const agent = process.env.npm_config_user_agent ?? ''
const actual = agent.split('/')[0]

// No user agent means something other than a package manager invoked this, for
// example a direct `node scripts/...`. Nothing to police.
if (agent && actual && actual !== EXPECTED) {
  // ESC is built from its code point rather than pasted in as a literal control
  // byte, so this file stays plain ASCII. Colour is skipped when stderr is not a
  // terminal, so piped or CI output carries no escape noise.
  const esc = String.fromCharCode(27)
  const tty = process.stderr.isTTY && !process.env.NO_COLOR
  const sgr = (code) => (tty ? esc + '[' + code + 'm' : '')
  const red = sgr(31)
  const bold = sgr(1)
  const dim = sgr(2)
  const off = sgr(0)

  process.stderr.write(
    '\n' +
      red +
      bold +
      'This project uses ' +
      EXPECTED +
      ', not ' +
      actual +
      '.' +
      off +
      '\n\n' +
      '  The deploy workflow runs `' +
      EXPECTED +
      ' ci` against package-lock.json, and a\n' +
      '  second lockfile would compete with it.\n\n' +
      '  ' +
      bold +
      'Use:' +
      off +
      '\n' +
      '    ' +
      EXPECTED +
      ' install\n' +
      '    ' +
      EXPECTED +
      ' run dev\n\n' +
      '  ' +
      dim +
      'If ' +
      actual +
      ' already touched node_modules, remove it before reinstalling:' +
      off +
      '\n' +
      '    Windows:  rmdir /s /q node_modules\n' +
      '    Unix:     rm -rf node_modules\n' +
      '    then:     ' +
      EXPECTED +
      ' ci\n\n',
  )
  process.exit(1)
}
