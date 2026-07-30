/*
 * Every string a visitor reads lives here so components stay presentational.
 *
 * Ground rules for this file, because a portfolio that overstates itself is
 * worse than one that understates itself:
 *
 *   - `figures` are counted from git history across the local repositories.
 *     Re-derive them before editing. The command used was
 *     `git rev-list --count --author=mostafa -i HEAD` per repo, summed.
 *   - `metrics` on each project are that project's own real commit counts and
 *     real first/last commit dates.
 *   - `principles` are quoted verbatim from the named repository's own docs.
 *     They are design commitments, not client testimonials. There are no
 *     testimonials on this site because there are no real ones to quote.
 *   - `logo` points at public/img/logos/*.webp. The .png beside each one is the
 *     original, extracted from that project's own repository, and is the source of
 *     truth; the .webp is generated from it by `npm run assets:optimize` and is
 *     what ships, because the originals were up to 77 KB for a mark drawn at 64px.
 *     Rerun that script after adding or replacing a logo. Projects with no usable
 *     mark of their own carry `logo: null` and render a monogram instead. Never
 *     substitute someone else's brand.
 *   - `plate` is the background a mark needs, not a style preference. Marks drawn
 *     in white (Itaq, Termius, Enjaz) vanish on a light plate; marks with dark or
 *     mid tone ink (Wadeni, Bakeet, Merch, Noon) wash out on a dark one. Several
 *     marks are app launcher icons that already carry their own opaque background,
 *     and those take `plate: 'image'` so the artwork fills the tile edge to edge
 *     rather than being inset on a plate it does not need. Do not drop this field:
 *     without it the marks silently turn to mud.
 *
 *     To decide for a new logo, check the file rather than the eye: a mark that is
 *     mostly transparent needs a plate chosen by its ink luminance, and a mark that
 *     is fully opaque needs 'image'.
 *
 * Asset paths are stored bare (no leading slash) and must be passed through
 * `asset()` at render time, because the site deploys under a configurable base
 * path and Nuxt does not rewrite raw `src` strings.
 */

/**
 * The background a mark is legible against. See the note above.
 *
 *   light  transparent mark with dark or mid tone ink, needs a pale plate
 *   dark   transparent mark with white ink, keeps the page's own surface
 *   image  fully opaque artwork that already has a background, fills the tile
 */
export type Plate = 'light' | 'dark' | 'image'

export interface Figure {
  value: string
  label: string
}

export interface ProjectMetric {
  label: string
  value: string
}

export interface ProjectSection {
  heading: string
  body: string[]
}

export interface Project {
  slug: string
  title: string
  subtitle: string
  /** Short line used on the stacked panels. Two sentences at most. */
  summary: string
  year: string
  role: string
  logo: string | null
  plate?: Plate
  monogram: string
  tags: string[]
  metrics: ProjectMetric[]
  /** Long-form detail for /work/[slug]. */
  sections: ProjectSection[]
  highlights: string[]
}

export interface IndexGroup {
  title: string
  items: { name: string; logo: string | null; plate?: Plate; monogram: string; note: string }[]
}

export const profile = {
  name: 'Mostafa Ghazlan',
  initials: 'MG',
  role: 'Software Engineer',
  /* Two lines at desktop. Planned against the display scale, not written first
     and squeezed after. */
  headline: 'I build mobile apps and the systems behind them.',
  lede:
    'Flutter on the client, .NET and ABP on the server. Navigation, logistics and commerce platforms shipped in Iraq.',
  email: 'mostafaa.ghaazlan@gmail.com',
  github: 'https://github.com/mostafaaghaazlan',
  location: 'Baghdad, Iraq',
  availability: 'Open to mobile and backend work. Remote friendly.',
} as const

export const figures: Figure[] = [
  { value: '2,816', label: 'commits authored' },
  { value: '15', label: 'Flutter apps' },
  { value: '7', label: '.NET and ABP backends' },
  { value: '6', label: 'Vue and Nuxt frontends' },
]

export const figuresNote =
  'Counted from git history across 27 repositories with commit history, personal and client work.'

export const about = {
  heading: 'I work at both ends of the same product.',
  body: [
    'Most of what I ship is a pair: a Flutter client and the .NET service it talks to. Owning both ends means the API is shaped by what the screen actually needs, and a change lands in one pass instead of three.',
    'The work is mostly in Iraq. Navigation with Arabic turn by turn voice, logistics dispatch and settlement, marketplaces with regional pricing, and the in car layer for Android Auto and CarPlay.',
  ],
  skills: [
    'Clean architecture with Bloc and Cubit',
    'ABP modular monoliths on .NET 10',
    'Typed API clients shared across apps',
    'Full RTL and bilingual interfaces',
  ],
}

export const projects: Project[] = [
  {
    slug: 'wadeni',
    title: 'Wadeni',
    subtitle: 'National navigation platform',
    summary:
      'Real time routing, crowdsourced incident reports and Arabic turn by turn voice, with a .NET 10 service layer feeding a Flutter client.',
    year: '2026',
    role: 'Mobile and backend',
    logo: 'img/logos/wadeni.webp',
    plate: 'light',
    monogram: 'WD',
    tags: ['Flutter', '.NET 10', 'Vue 3', 'PostgreSQL', 'OpenStreetMap'],
    metrics: [
      { label: 'Client commits', value: '161' },
      { label: 'Backend commits', value: '30' },
      { label: 'Started', value: 'May 2026' },
    ],
    highlights: [
      'Camera follow and unfollow with automatic return to the route',
      'Incident reporting for traffic, accidents, roadwork and police',
      'Arabic turn by turn voice with full RTL layout',
      'Trusted proxy handling for X-Forwarded-Host on the service layer',
    ],
    sections: [
      {
        heading: 'What it is',
        body: [
          'A navigation app for Iraq, built the way drivers already expect navigation to behave: a dark heading up map, a speed readout, a search field, and one tap to report what is actually happening on the road.',
          'The client is Flutter on clean architecture with Bloc. The map started on OpenStreetMap tiles through flutter_map, with geolocator for position and go_router for navigation between shells.',
        ],
      },
      {
        heading: 'The interesting part',
        body: [
          'Turn by turn voice in Arabic is not a translation problem, it is a timing problem. Instructions have to be phrased and fired early enough that a driver can act on them, in a language where the verb often lands late in the sentence.',
          'On the service side the platform sits behind a proxy, so the trusted proxy configuration had to accept X-Forwarded-Host without opening a header spoofing hole. That work is logged rather than silent, so a bad deployment is visible instead of subtly wrong.',
        ],
      },
    ],
  },
  {
    slug: 'itaq',
    title: 'Itaq Platform',
    subtitle: 'Modular monolith and monorepo',
    summary:
      'An ABP modular monolith with a Vue admin console, a Nuxt public portal and a Flutter app, sharing one typed API client and one set of design tokens.',
    year: '2026',
    role: 'Platform and mobile',
    logo: 'img/logos/itaq.webp',
    plate: 'dark',
    monogram: 'IQ',
    tags: ['ABP', '.NET 10', 'Nuxt', 'OpenIddict', 'Turborepo'],
    metrics: [
      { label: 'Mobile commits', value: '212' },
      { label: 'Platform commits', value: '48' },
      { label: 'Started', value: 'Jun 2026' },
    ],
    highlights: [
      'Three deployable frontends against one independently deployable API',
      'Admin authenticates over OAuth2 and OIDC against embedded OpenIddict',
      'Public portal reads anonymous endpoints only, so it can be cached hard',
      'Shared packages for the typed client, design tokens and TypeScript config',
    ],
    sections: [
      {
        heading: 'What it is',
        body: [
          'One platform covering taxi, car rental, wallet and document issuing. The API is an ABP modular monolith on .NET 10 with PostgreSQL and an embedded OpenIddict server. Around it sit a Vue 3 admin console, a Nuxt server rendered public portal and a Flutter app.',
          'The repository is a pnpm workspace driven by Turborepo. Shared packages carry a framework agnostic typed API client, the design tokens and Vue components, and the base TypeScript configs.',
        ],
      },
      {
        heading: 'The interesting part',
        body: [
          'A monorepo only pays for itself if the shared edge is the contract. Here that edge is the typed client: the admin, the portal and anything else added later consume the same generated surface, so a breaking API change fails at typecheck rather than in production.',
          'The trust boundaries are deliberately different per frontend. The admin does a full OIDC login. The portal is only ever allowed to read anonymous, public endpoints, which is what makes server rendering it safe and cheap.',
        ],
      },
    ],
  },
  {
    slug: 'transfelar',
    title: 'Transfelar',
    subtitle: 'Peer to peer transfer',
    summary:
      'Files, folders and clipboard between Windows, macOS and Android over the local network. No cloud, no account, no server in the middle.',
    year: '2026',
    role: 'Solo, desktop and mobile',
    logo: 'img/logos/transfelar.webp',
    plate: 'dark',
    monogram: 'TF',
    tags: ['Flutter desktop', 'Sockets', 'Cubit', 'SHA-256'],
    metrics: [
      { label: 'Commits', value: '15' },
      { label: 'Platforms', value: 'Windows, macOS, Android' },
      { label: 'Built', value: 'Jul 2026' },
    ],
    highlights: [
      'A 40 GB file uses the same memory as a 40 KB one',
      'Self healing UDP socket that rebinds when the OS kills it',
      'Nothing is written to disk before the receiving user accepts',
      'Size and SHA-256 verified before a file gets its final name',
    ],
    sections: [
      {
        heading: 'How it works',
        body: [
          'Every device broadcasts a small JSON beacon on UDP 45231, both to the global broadcast address and to each interface subnet, so machines on Wi-Fi, Ethernet and VPN adapters all find each other. Peers time out after twelve seconds. Transfers stream over TCP 45232.',
          'The sender sends a manifest first. The receiving user sees exactly what is on offer and accepts or declines, and nothing touches disk before that. Files then stream in 256 KB frames straight off disk into the socket, one chunk in flight at a time. Received bytes land in a .part file, and only after size and SHA-256 both check out does it get its real name. An interrupted transfer resumes from the .part offset.',
        ],
      },
      {
        heading: 'The interesting part',
        body: [
          'The hard part of Windows to macOS is not the socket, it is everything around it. Paths travel as POSIX relative strings and are rebuilt per operating system. Names that are illegal on Windows are sanitised on arrival and the rename is shown rather than hidden. Path traversal, absolute paths, drive letters and UNC paths are refused outright, and every destination is proven to resolve inside the download folder before a byte is written.',
          'Existing files are never overwritten. Arabic, accented and emoji file names round trip intact. The socket also rebinds itself, because Windows kills a UDP socket whenever a datagram draws an ICMP port unreachable, and a transfer tool that quietly stops discovering peers is worse than one that fails loudly.',
        ],
      },
    ],
  },
  {
    slug: 'wadeni-map',
    title: 'wadeni map',
    subtitle: 'In car navigation plugin',
    summary:
      'The whole navigation experience packaged as one Flutter plugin, with the Android Auto and CarPlay native layer bundled in.',
    year: '2026',
    role: 'Solo, plugin and native',
    logo: null,
    monogram: 'MAP',
    tags: ['Flutter plugin', 'Kotlin', 'Swift', 'MapLibre'],
    metrics: [
      { label: 'Commits', value: '30' },
      { label: 'Native layers', value: 'Android Auto, CarPlay' },
      { label: 'Started', value: 'Jun 2026' },
    ],
    highlights: [
      'One dependency gives a host app in car navigation',
      'MapLibre vector map, heading up, with a 3D position puck',
      'Owns its own HTTP, storage and DI, and never touches the host app',
      'Versioned by git tag, so bumping one ref updates every app',
    ],
    sections: [
      {
        heading: 'What it is',
        body: [
          'The map widget, the client side turn by turn engine, Arabic voice, crowdsourced reports, routing, search and the events, traffic and offline overlays, all in one package shared by every Wadeni app. It talks to the same backend, so it adds no new endpoints.',
          'As of the second phase it is a Flutter plugin rather than a package: the Android Auto layer in Kotlin and the CarPlay layer in Swift ship inside it. A host app adds the dependency and wires up a launcher category and an Info.plist scene, and gets in car navigation.',
        ],
      },
      {
        heading: 'The interesting part',
        body: [
          'The design constraint was that the package must never reach into the host. It owns its own Dio instance, its own Hive box and its own registrations, so dropping it into an app cannot disturb that app existing auth, cache or dependency injection.',
          'The bridge API stays a no operation when the app is not on a car head unit. That means host apps carry one code path rather than two, and the in car feature cannot break the phone experience.',
        ],
      },
    ],
  },
  {
    slug: 'bakeet',
    title: 'Bakeet',
    subtitle: 'Multi merchant marketplace',
    summary:
      'Catalogue and search, cart and checkout, regional pricing, addresses, notifications and a CMS driven storefront.',
    year: '2025',
    role: 'Solo mobile',
    logo: 'img/logos/bakeet.webp',
    plate: 'light',
    monogram: 'BK',
    tags: ['Flutter', 'Clean Architecture', 'Bloc'],
    metrics: [
      { label: 'Commits', value: '625' },
      { label: 'Span', value: 'Oct 2025 to Jul 2026' },
      { label: 'Authored', value: 'All of them' },
    ],
    highlights: [
      'Multi merchant catalogue with search and filtering',
      'Regional pricing and address handling',
      'Storefront layout driven by CMS configuration',
      'Nine months of continuous shipping on one codebase',
    ],
    sections: [
      {
        heading: 'What it is',
        body: [
          'A marketplace app where many merchants sell into one storefront. Catalogue and search, cart and checkout, saved addresses, notifications, and a storefront whose layout is configured server side rather than hardcoded.',
          'Flutter on clean architecture with Bloc, which is what let the surface keep growing for nine months without the state layer turning into a knot.',
        ],
      },
      {
        heading: 'The interesting part',
        body: [
          'Regional pricing is the part that quietly touches everything. Once a price depends on where the buyer is, the catalogue, the cart, the checkout and the notification copy all stop being able to cache the same answer for every user.',
          'Driving the storefront from CMS configuration was the other decision that paid off. Merchandising changes stopped needing a release, which for an app store release cycle is the difference between a same day change and a week.',
        ],
      },
    ],
  },
  {
    slug: 'noon-express',
    title: 'Noon Express',
    subtitle: 'Logistics and dispatch',
    summary:
      'End to end logistics: shipment intake, driver dispatch and settlement, with a .NET backend and separate driver and customer apps.',
    year: '2025',
    role: 'Mobile and backend',
    logo: 'img/logos/noon.webp',
    plate: 'light',
    monogram: 'NE',
    tags: ['Flutter', '.NET', 'Vue 3'],
    metrics: [
      { label: 'App commits', value: '888' },
      { label: 'Platform commits', value: '302' },
      { label: 'Span', value: 'Nov 2025 to Jul 2026' },
    ],
    highlights: [
      'Shipment intake through to driver settlement',
      'Separate driver and customer clients on one backend',
      'Order statistics that reconcile platform orders with direct ones',
      'The largest single body of work here by commit count',
    ],
    sections: [
      {
        heading: 'What it is',
        body: [
          'A logistics operation in software: shipments come in, get dispatched to drivers, get delivered, and get settled. There is a .NET backend, a Vue 3 operations surface, and two Flutter clients, one for drivers and one for customers.',
          'The platform and the app started within three days of each other in November 2025 and were built alongside one another from then on.',
        ],
      },
      {
        heading: 'The interesting part',
        body: [
          'Settlement is where logistics software either earns trust or loses it. Order statistics have to include orders that arrived through the platform as well as those entered directly, and the counts have to agree, because a driver checking their own numbers against the office is the fastest way to find a reconciliation bug.',
          'Running two clients against one backend also forces the API to be honest. A driver and a customer see the same shipment from opposite sides, so the model cannot quietly encode one point of view.',
        ],
      },
    ],
  },
]

export const indexGroups: IndexGroup[] = [
  {
    title: 'Platforms and backends',
    items: [
      {
        name: '101.ecommerce',
        logo: null,
        monogram: '101',
        note: 'Nuxt 3 storefront, Vuetify admin and an ABP API on .NET 10, with Postgres, Redis and MinIO.',
      },
      {
        name: 'ITAQ.SCPT',
        logo: 'img/logos/itaq.webp',
        plate: 'dark',
        monogram: 'SC',
        note: 'Layered ABP monolith, multi tenant, OpenIddict auth, Razor Pages and Serilog.',
      },
      {
        name: 'CoffeeApp',
        logo: null,
        monogram: 'CA',
        note: 'Domain driven ABP solution spread across 14 projects.',
      },
      {
        name: 'JasimUpdater',
        logo: null,
        monogram: 'JU',
        note: 'Release and update service for the Jasim desktop clients.',
      },
    ],
  },
  {
    title: 'Mobile',
    items: [
      {
        name: 'Dar Al Araji',
        logo: 'img/logos/daralaraji.webp',
        plate: 'dark',
        monogram: 'DA',
        note: 'Retail commerce app: catalogue, wishlist, checkout and CMS driven site config.',
      },
      {
        name: 'Merch Central',
        logo: 'img/logos/merch.webp',
        plate: 'light',
        monogram: 'MC',
        note: 'Device fleet browser with remote session handling and trackpad aware cursor input.',
      },
      {
        name: 'Attendance',
        logo: 'img/logos/enki.webp',
        // Launcher icon: opaque gradient artwork, so it fills the tile.
        plate: 'image',
        monogram: 'AT',
        note: 'HR and attendance client for field teams, 300 commits deep.',
      },
      {
        name: 'Enjaz',
        // The mono cut of the same mark: white ink on transparent, so it needs a
        // dark plate or it disappears.
        logo: 'img/logos/enki-mono.webp',
        plate: 'dark',
        monogram: 'EN',
        note: 'Office ordering app with a floor plan picker and an office boy dispatch flow.',
      },
      {
        name: 'Floor Plan',
        logo: null,
        monogram: 'FP',
        note: 'Indoor positioning with heading calibration, plus a Vue mapping tool.',
      },
    ],
  },
  {
    title: 'Developer tools',
    items: [
      {
        name: 'Termius client',
        logo: 'img/logos/termius.webp',
        plate: 'dark',
        monogram: 'TR',
        note: 'SSH and terminal workspace in Flutter, with a credential vault and autocomplete.',
      },
      {
        name: 'Jenkins mobile',
        logo: 'img/logos/jenkins.webp',
        // Opaque white background baked into the icon.
        plate: 'image',
        monogram: 'JK',
        note: 'Build monitoring and job control from the phone.',
      },
      {
        name: 'Synergy',
        logo: 'img/logos/synergy.webp',
        // Opaque cream background baked into the artwork.
        plate: 'image',
        monogram: 'SY',
        note: 'One keyboard and mouse across Windows and macOS, over a native input layer per platform.',
      },
      {
        name: 'ITAQ bridge',
        logo: 'img/logos/itaqbridge.webp',
        // White shield on an opaque near-black field, so it fills the tile.
        plate: 'image',
        monogram: 'BR',
        note: 'Vue 3 harness for a Flutter WebView bridge covering auth handoff and back navigation.',
      },
    ],
  },
  {
    title: 'Web',
    items: [
      {
        name: '101 Website',
        logo: null,
        monogram: 'WB',
        note: 'Bilingual Nuxt 3 marketing site with full RTL, shadcn-vue and colour modes.',
      },
      {
        name: 'Wedding site',
        logo: null,
        monogram: 'WS',
        note: 'Vue 3 and Vite invitation site.',
      },
      {
        name: 'YouTube client',
        logo: null,
        monogram: 'YT',
        note: 'Flutter player on media_kit, with search and SponsorBlock segment skipping.',
      },
    ],
  },
]

/* Icons are Simple Icons SVGs vendored into public/img/icons and drawn as CSS
   masks, so their colour follows the theme instead of the file. */
export const stack = [
  { icon: 'flutter', label: 'Flutter' },
  { icon: 'dart', label: 'Dart' },
  { icon: 'dotnet', label: '.NET and ABP' },
  { icon: 'vuedotjs', label: 'Vue 3' },
  { icon: 'nuxt', label: 'Nuxt' },
  { icon: 'typescript', label: 'TypeScript' },
  { icon: 'laravel', label: 'Laravel' },
  { icon: 'postgresql', label: 'PostgreSQL' },
  { icon: 'redis', label: 'Redis' },
  { icon: 'docker', label: 'Docker' },
  { icon: 'android', label: 'Android' },
  { icon: 'kotlin', label: 'Kotlin' },
  { icon: 'apple', label: 'iOS' },
  { icon: 'swift', label: 'Swift' },
  { icon: 'jenkins', label: 'Jenkins' },
  { icon: 'tailwindcss', label: 'Tailwind' },
  { icon: 'git', label: 'Git' },
].map((entry) => ({ ...entry, url: `img/icons/${entry.icon}.svg` }))

export const stackNote =
  'Architecture I reach for: clean architecture with Bloc or Cubit on the client, domain driven ABP modules on the server.'

/* Dates and facts here come from `git log` on each repository. */
export const timeline = [
  {
    when: 'Sep 2025',
    title: 'CoffeeApp and Enjaz',
    body: 'First domain driven ABP solution, spread across 14 projects, alongside an office ordering app with a floor plan picker.',
  },
  {
    when: 'Oct 2025',
    title: 'Bakeet begins',
    body: 'The multi merchant marketplace starts. It runs for nine months and 625 commits without a rewrite.',
  },
  {
    when: 'Nov 2025',
    title: 'Noon Express',
    body: 'The logistics platform and its driver and customer apps start within three days of each other, and grow together.',
  },
  {
    when: 'Jan 2026',
    title: 'ITAQ.SCPT',
    body: 'A layered ABP monolith: multi tenant, OpenIddict auth, Razor Pages and structured logging through Serilog.',
  },
  {
    when: 'May 2026',
    title: 'Wadeni',
    body: 'Navigation backend on the second, the Flutter client eleven days later. Routing, incidents and Arabic voice.',
  },
  {
    when: 'Jun 2026',
    title: 'Plugins and monorepos',
    body: 'The map becomes a reusable Flutter plugin. Itaq moves onto pnpm workspaces and Turborepo with shared packages.',
  },
  {
    when: 'Jul 2026',
    title: 'Desktop and in car',
    body: 'Android Auto and CarPlay ship inside wadeni_map. Termius, Transfelar and Synergy land as Flutter desktop work.',
  },
]

export const services = [
  {
    title: 'Cross platform mobile',
    icon: 'ph:device-mobile-camera',
    body: 'Flutter on iOS, Android, Windows and macOS. Clean architecture with Bloc or Cubit, go_router, offline first storage.',
    detail: [
      'Clean architecture with Bloc or Cubit',
      'Offline first storage and sync',
      'Full RTL and Arabic voice',
      'Release pipelines and staged rollout',
    ],
  },
  {
    title: 'Backend platforms',
    icon: 'ph:stack',
    body: 'ABP modular monoliths on .NET 10. OpenIddict auth, multi tenancy, PostgreSQL, Redis, MinIO and Serilog.',
    detail: [
      'Modular monoliths that stay deployable',
      'OAuth2 and OIDC with OpenIddict',
      'Multi tenant data isolation',
      'Docker Compose for local parity',
    ],
  },
  {
    title: 'Web frontends',
    icon: 'ph:browsers',
    body: 'Nuxt and Vue 3 with TypeScript and Tailwind. Bilingual routing, full RTL, and typed clients shared with the API.',
    detail: [
      'Server rendered Nuxt for public surfaces',
      'Vue 3 admin consoles behind OIDC',
      'Bilingual routing with real RTL',
      'One typed API client per platform',
    ],
  },
  {
    title: 'Native and in car',
    icon: 'ph:steering-wheel',
    body: 'Android Auto in Kotlin, CarPlay in Swift, low level input layers on desktop, packaged so one dependency covers a host app.',
    detail: [
      'Android Auto and CarPlay layers',
      'Flutter plugins with bundled native code',
      'Low level keyboard and mouse capture',
      'UDP discovery and TCP streaming',
    ],
  },
]

/* Quoted verbatim from each repository own documentation. These are design
   commitments with a traceable source, not client testimonials. */
export const principles = [
  {
    quote: 'One package, shared by every app, so a map fix ships once.',
    source: 'wadeni_map',
    note: 'Reuse is a release strategy, not a code style.',
  },
  {
    quote: 'Nothing is written before the receiving user accepts it.',
    source: 'Transfelar',
    note: 'Consent comes before bytes.',
  },
  {
    quote: 'The diagnostics log never records what you typed.',
    source: 'Synergy',
    note: 'A debug tool is still a keylogger if you are careless.',
  },
]

/* Products these were built for. Real names, real marks where one exists. */
export const shipped: { name: string; logo: string | null; plate?: Plate; monogram: string }[] = [
  { name: 'Wadeni', logo: 'img/logos/wadeni.webp', plate: 'light', monogram: 'WD' },
  { name: 'Itaq', logo: 'img/logos/itaq.webp', plate: 'dark', monogram: 'IQ' },
  { name: 'Bakeet', logo: 'img/logos/bakeet.webp', plate: 'light', monogram: 'BK' },
  { name: 'Dar Al Araji', logo: 'img/logos/daralaraji.webp', plate: 'dark', monogram: 'DA' },
  { name: 'Merch Central', logo: 'img/logos/merch.webp', plate: 'light', monogram: 'MC' },
  { name: 'Termius', logo: 'img/logos/termius.webp', plate: 'dark', monogram: 'TR' },
  { name: 'Transfelar', logo: 'img/logos/transfelar.webp', plate: 'dark', monogram: 'TF' },
  { name: 'Noon Express', logo: 'img/logos/noon.webp', plate: 'light', monogram: 'NE' },
  { name: 'Enjaz', logo: 'img/logos/enki-mono.webp', plate: 'dark', monogram: 'EN' },
  { name: '101', logo: null, monogram: '101' },
]

/* No 'Contact' entry: the header CTA already carries that intent, and two
   controls for one destination is one too many. One label per intent, site wide:
   'View work' for the work index, 'Get in touch' for contact. */
export const nav = [
  { label: 'Work', href: '/#work' },
  { label: 'About', href: '/#about' },
  { label: 'Stack', href: '/#stack' },
]

export const cta = {
  work: { label: 'View work', href: '/#work' },
  contact: { label: 'Get in touch', href: '/#contact' },
} as const

export const social = [
  { label: 'GitHub', href: profile.github, icon: 'ph:github-logo' },
  { label: 'Email', href: `mailto:${profile.email}`, icon: 'ph:envelope-simple' },
]
