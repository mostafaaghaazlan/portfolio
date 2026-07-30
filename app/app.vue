<script setup lang="ts">
/*
 * Page shell and route transition.
 *
 * The transition is a vertical curtain driven by GSAP rather than CSS classes,
 * because the leave and enter halves have to share one element: the curtain
 * closes upward over the outgoing page and opens upward off the incoming one, so
 * the wipe reads as a single continuous move instead of two.
 *
 * `css: false` stops Vue waiting on a CSS transitionend that will never fire.
 * Under reduced motion both hooks call `done()` straight away, which gives an
 * instant cut.
 */
import type { TransitionProps } from 'vue'
import { profile } from '~/data/content'

const curtain = ref<HTMLElement | null>(null)

const pageTransition: TransitionProps = {
  mode: 'out-in',
  css: false,
  onLeave(el, done) {
    if (!motionOk() || !curtain.value) return done()
    const { gsap } = useGsap()
    gsap
      .timeline({ onComplete: done })
      .set(curtain.value, { transformOrigin: 'bottom center' })
      .to(curtain.value, { scaleY: 1, duration: 0.5, ease: 'expo.in' })
      .to(el as HTMLElement, { opacity: 0, duration: 0.35, ease: 'none' }, 0)
  },
  onEnter(el, done) {
    resetScroll()
    if (!motionOk() || !curtain.value) return done()
    const { gsap } = useGsap()
    gsap
      .timeline({ onComplete: done })
      .set(el as HTMLElement, { opacity: 1 })
      .set(curtain.value, { transformOrigin: 'top center' })
      .to(curtain.value, { scaleY: 0, duration: 0.75, ease: 'expo.out' })
  },
}

const site = 'Mostafa Ghazlan'

useHead({
  titleTemplate: (title) => (title ? `${title} / ${site}` : `${site} / ${profile.role}`),
})

useSeoMeta({
  description: profile.lede,
  ogType: 'website',
  ogSiteName: site,
  ogTitle: `${site} / ${profile.role}`,
  ogDescription: profile.lede,
  twitterCard: 'summary_large_image',
})

// Person markup, so a search result can show the role and the actual skills
// rather than guessing them from the headline.
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: profile.name,
        jobTitle: profile.role,
        email: `mailto:${profile.email}`,
        url: profile.github,
        sameAs: [profile.github],
        address: { '@type': 'PostalAddress', addressLocality: 'Baghdad', addressCountry: 'IQ' },
        knowsAbout: ['Flutter', 'Dart', '.NET', 'ABP Framework', 'Vue.js', 'Nuxt', 'PostgreSQL'],
      }),
    },
  ],
})
</script>

<template>
  <div>
    <!-- Targets the main landmark, not a section. It used to point at "#work", which
         exists only on the home page, so the skip link did nothing on all six
         project pages. A bare fragment is correct here and needs no base path,
         because it resolves against whatever document is open. -->
    <a class="skip-link" href="#main">Skip to content</a>

    <!-- Background layers. Fixed and inert, so they never repaint on scroll. -->
    <WebglField />
    <GrainOverlay />

    <!-- Foreground chrome. -->
    <ScrollProgress />
    <CursorFollower />

    <NuxtLayout>
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>

    <SitePreloader />

    <div ref="curtain" class="route-curtain" aria-hidden="true" />
  </div>
</template>

<style>
.skip-link {
  position: fixed;
  left: -9999px;
  top: 0;
  z-index: 90;
  background: var(--color-accent);
  color: var(--color-accent-ink);
  padding: 0.75rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.skip-link:focus {
  left: 1rem;
  top: 1rem;
}

/* z-70. See the layer scale in components/ScrollProgress.vue. */
.route-curtain {
  position: fixed;
  inset: 0;
  z-index: 70;
  pointer-events: none;
  transform: scaleY(0);
  background: var(--color-ink);
  border-top: 1px solid var(--color-accent);
}
</style>
