/*
 * The site is deployed as a static export to GitHub Pages.
 *
 * `BASE_PATH` decides how asset and route URLs are written into the output:
 *   - user site    (mostafaaghaazlan.github.io)   -> '/'
 *   - project site (github.com/<user>/portfolio)  -> '/portfolio/'
 * The deploy workflow derives it from the repository name so one config covers
 * both. Anything read out of `public/` must go through `asset()` (app/utils),
 * because Nuxt does not rewrite bare `src="/img/..."` strings.
 */
import tailwindcss from '@tailwindcss/vite'

const baseURL = process.env.BASE_PATH || '/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,

  modules: ['@nuxt/fonts', '@nuxt/icon'],

  css: ['~/assets/css/main.css'],

  // Inline every stylesheet into the prerendered HTML. Left as <link> tags, the
  // global entry sheet plus the two globally used component sheets were three
  // render-blocking requests, which Lighthouse measured at about 450ms on a
  // throttled connection. The site is a static export, so inlining costs a larger
  // HTML document and removes the round trips entirely.
  features: { inlineStyles: true },

  // Tailwind v4 ships as a Vite plugin. It must not be added to postcss.
  vite: {
    plugins: [tailwindcss()],
    build: { target: 'es2022' },
  },

  app: {
    baseURL,
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#050505' },
      ],
      link: [{ rel: 'icon', href: `${baseURL}favicon.svg`, type: 'image/svg+xml' }],
      script: [
        {
          // Runs before the body paints, so the pre-animation states are in
          // place on the first frame. A plugin would be one paint too late and
          // the visitor would see finished content flash and then reset.
          // If JS is off or reduced motion is on, the class is never added and
          // the page simply renders complete.
          innerHTML:
            "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)" +
            "document.documentElement.classList.add('motion-ready')}catch(e){}",
          tagPosition: 'head',
        },
      ],
    },
    // The wipe is driven by GSAP in app.vue rather than CSS classes, so the
    // named transition here only needs to exist for Nuxt to call the hooks.
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  /*
   * Only the weights actually used, and upright only.
   *
   * Each extra face is roughly 35 KB over the wire on first load. 700 was declared
   * and never used: the display scale is carried by 600 with tight tracking, and
   * body emphasis is 500. Italics are never used either, so they are excluded
   * rather than downloaded and ignored.
   *
   *   Geist       400 body, 500 emphasis and UI, 600 display
   *   Geist Mono  400 metadata, 500 labels
   */
  fonts: {
    families: [
      { name: 'Geist', provider: 'google', weights: [400, 500, 600], styles: ['normal'] },
      { name: 'Geist Mono', provider: 'google', weights: [400, 500], styles: ['normal'] },
    ],
    /*
     * woff2 and latin only, and both matter.
     *
     * The module used to also emit a legacy woff face per weight. Those had no
     * `unicode-range`, so they covered every codepoint and, being declared after
     * the subsetted woff2 faces for the same family and weight, they won outright.
     * The browser fetched 170 KB of unsubsetted woff and never touched the 143 KB
     * of woff2 sitting beside it. Pinning the format drops the legacy faces, so
     * only the latin woff2 subset is ever requested, at roughly 13 KB a face.
     *
     * If support for a browser without woff2 is ever needed, add 'woff' back and
     * accept the cost, but check which face actually wins before assuming.
     */
    defaults: { subsets: ['latin'], formats: ['woff2'] },
  },

  // svg mode inlines the marks, so no runtime fetch and no layout shift.
  icon: {
    mode: 'svg',
    clientBundle: {
      // `scan` only finds names written as literals in a template. These six are
      // passed through props from app/data/content.ts, so the scanner cannot see
      // them and they have to be listed or they fail to resolve during prerender.
      // Keep this in sync with the `icon` fields in content.ts.
      scan: true,
      icons: [
        'ph:device-mobile-camera',
        'ph:stack',
        'ph:browsers',
        'ph:steering-wheel',
        'ph:github-logo',
        'ph:envelope-simple',
      ],
      sizeLimitKb: 256,
    },
  },

  runtimeConfig: {
    public: {
      /*
       * Where the contact form posts. The site is a static export with no server
       * of its own, so this has to be an external form endpoint. Set
       * NUXT_PUBLIC_CONTACT_ENDPOINT at build time to enable it.
       *
       * Left empty, the form does not pretend to send: it hands off to the mail
       * client with the message prefilled and says so in the UI. A form that
       * silently discards a message is worse than no form.
       */
      contactEndpoint: '',

      /*
       * The opening loader, and with it the hero's masked letter reveal.
       *
       * This is a genuine trade, not a preference. While the loader is up it is
       * the largest element painted, so Largest Contentful Paint cannot resolve
       * until it clears: script boot plus the sequence, which measures about 4.1s
       * on Lighthouse's throttled mobile profile and holds Performance near 81.
       *
       * Set NUXT_PUBLIC_INTRO=false and the loader is never mounted, the hero
       * headline is server rendered unmasked, and LCP becomes the first paint of
       * the real content. Everything else on the site is untouched: scroll
       * reveals, the sticky stack, the horizontal pan and the WebGL field all
       * still run.
       */
      intro: true,
    },
  },

  nitro: {
    prerender: { crawlLinks: true, routes: ['/', '/404.html'] },
  },

  typescript: { strict: true },
})
