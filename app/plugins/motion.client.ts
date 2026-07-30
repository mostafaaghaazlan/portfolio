/*
 * Boots smooth scroll and keeps ScrollTrigger honest across route changes.
 *
 * The `.motion-ready` class is added by an inline head script rather than here,
 * because a plugin runs after hydration and the pre-animation states would land
 * one paint too late, showing a flash of finished content.
 */
export default defineNuxtPlugin((nuxtApp) => {
  initSmoothScroll()

  const { ScrollTrigger } = useGsap()

  // Pins and scrubbed timelines measure on creation. After a route change the
  // new page's scenes exist but the document height has only just settled, so
  // one refresh on the next frame keeps every start and end honest.
  nuxtApp.hook('page:finish', () => {
    requestAnimationFrame(() => ScrollTrigger.refresh())
  })

  // Fonts change line wrapping, which changes the height of every split
  // headline, which moves every trigger below it.
  if (document.fonts?.status !== 'loaded') {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }

  // Honour a mid session change of the OS setting instead of only reading it once.
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  const onChange = () => {
    if (query.matches) {
      destroySmoothScroll()
      document.documentElement.classList.remove('motion-ready')
      ScrollTrigger.getAll().forEach((t) => t.kill())
    } else {
      initSmoothScroll()
    }
  }
  query.addEventListener('change', onChange)

  /*
   * There is deliberately no `beforeunload` teardown here.
   *
   * Registering a beforeunload listener makes the page ineligible for the back and
   * forward cache, so every use of the back button becomes a full reload instead of
   * an instant restore. Lighthouse flags it, and it is the wrong trade: there is
   * nothing to clean up on unload that the browser is not about to discard anyway.
   * Real teardown happens in each component's unmount path, which is what matters
   * for route changes.
   */
})
