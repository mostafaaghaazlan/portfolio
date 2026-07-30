/*
 * Lenis smooth scroll, wired to GSAP.
 *
 * Lenis runs on the window scroller, so ScrollTrigger needs no scrollerProxy.
 * The two are kept in step by two lines: Lenis tells ScrollTrigger to update on
 * every scroll, and GSAP's ticker drives Lenis' rAF. Driving Lenis from GSAP
 * rather than its own loop means pinned sections and the smoothing resolve in
 * the same frame, which is what stops pinned content from shimmering.
 *
 * `lagSmoothing(0)` is required: GSAP's default lag smoothing would clamp the
 * delta Lenis is handed after a stall and the page would jump.
 */
import Lenis from 'lenis'

let lenis: Lenis | null = null
let tick: ((time: number) => void) | null = null

export function getLenis(): Lenis | null {
  return lenis
}

export function initSmoothScroll(): void {
  if (!motionOk() || lenis) return
  const { gsap, ScrollTrigger } = useGsap()

  lenis = new Lenis({
    duration: 1.1,
    // Exponential ease out. Long tail, no rubber band at the end.
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    touchMultiplier: 1.5,
  })

  lenis.on('scroll', ScrollTrigger.update)

  tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
}

export function destroySmoothScroll(): void {
  const { gsap } = useGsap()
  if (tick) gsap.ticker.remove(tick)
  tick = null
  lenis?.destroy()
  lenis = null
}

/**
 * Scroll to an element or offset.
 *
 * Falls back to the native scroller when Lenis is not running, which is the
 * case under reduced motion. Anchors keep working either way.
 */
export function scrollToTarget(target: string | number | HTMLElement, offset = 0): void {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.4 })
    return
  }
  if (typeof target === 'number') {
    window.scrollTo({ top: target + offset })
    return
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target
  el?.scrollIntoView({ block: 'start' })
}

/**
 * Jump to the top with no animation, for the moment between two pages.
 *
 * Lenis keeps its own scroll value, so setting `window.scrollTo` alone would
 * leave it out of sync and the next wheel event would snap back.
 */
export function resetScroll(): void {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true })
    return
  }
  window.scrollTo(0, 0)
}

/** Used by the loader, which must not let the visitor scroll mid reveal. */
export function setScrollLocked(locked: boolean): void {
  if (lenis) locked ? lenis.stop() : lenis.start()
  if (import.meta.client) {
    document.documentElement.style.overflow = locked ? 'hidden' : ''
  }
}
