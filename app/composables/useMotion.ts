/*
 * Motion primitives.
 *
 * Two rules are enforced here rather than left to each component:
 *
 *   1. Reduced motion is checked once, in one place. `useScene` simply does not
 *      run its callback when the visitor asked for less motion, which means a
 *      section cannot forget to honour it.
 *   2. Every animation lives inside a `gsap.context` scoped to the section root
 *      and is reverted on unmount. That covers ScrollTriggers, pins and inline
 *      styles in one call, so route changes cannot leak pinned spacers.
 *
 * There is deliberately no scroll event listener anywhere in this file. Scroll
 * position is read through ScrollTrigger, which batches against Lenis.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import SplitType from 'split-type'

let pluginsRegistered = false

export function useGsap() {
  if (import.meta.client && !pluginsRegistered) {
    gsap.registerPlugin(ScrollTrigger)
    pluginsRegistered = true
  }
  return { gsap, ScrollTrigger }
}

/** True only on the client, and only when the visitor has not asked for less motion. */
export function motionOk(): boolean {
  if (!import.meta.client) return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export interface SceneTools {
  gsap: typeof gsap
  ScrollTrigger: typeof ScrollTrigger
  root: HTMLElement
  /** Register extra teardown, for SplitType instances and the like. */
  onCleanup: (fn: () => void) => void
}

/**
 * Attach a GSAP scene to a section.
 *
 * Returns a template ref to bind to the section root. The callback runs after
 * mount, inside a context scoped to that root, and is fully reverted on unmount.
 */
export function useScene(build: (tools: SceneTools) => void) {
  const root = ref<HTMLElement | null>(null)
  let ctx: gsap.Context | null = null
  const extra: (() => void)[] = []

  onMounted(() => {
    if (!motionOk() || !root.value) return
    const { gsap, ScrollTrigger } = useGsap()
    const el = root.value
    ctx = gsap.context(() => {
      build({ gsap, ScrollTrigger, root: el, onCleanup: (fn) => extra.push(fn) })
    }, el)
  })

  onBeforeUnmount(() => {
    // Reverse order, so a SplitType revert runs before the context strips
    // the inline styles the split created.
    while (extra.length) extra.pop()!()
    ctx?.revert()
    ctx = null
  })

  return root
}

/**
 * Split an element into masked lines of words, ready to slide up out of the mask.
 *
 * The `.line` wrapper gets `overflow: hidden` from main.css. Callers must pass
 * the returned revert into `onCleanup`, otherwise the split markup survives a
 * route change and the text ends up double wrapped.
 */
export function splitLines(el: Element) {
  const split = new SplitType(el as HTMLElement, {
    types: 'lines,words',
    lineClass: 'line',
    wordClass: 'word',
    tagName: 'span',
  })
  return {
    words: split.words ?? [],
    lines: split.lines ?? [],
    revert: () => split.revert(),
  }
}

/** Split into masked characters. Used only for short strings such as the logotype. */
export function splitChars(el: Element) {
  const split = new SplitType(el as HTMLElement, {
    types: 'lines,chars',
    lineClass: 'line',
    charClass: 'char',
    tagName: 'span',
  })
  return {
    chars: split.chars ?? [],
    revert: () => split.revert(),
  }
}

/**
 * The parked state for masked text, matching `.motion-ready .line > .word` in
 * main.css. Always reveal masked text with:
 *
 *     gsap.fromTo(words, maskHidden(), { yPercent: 0, ... })
 *
 * The explicit `y: 0` is the whole point of this helper, and removing it breaks
 * the reveal silently. GSAP does not read the stylesheet, it reads the computed
 * transform *matrix*, in which `translate3d(0, 110%, 0)` has already resolved to a
 * pixel offset. So GSAP starts out believing `y` is 89px and `yPercent` is 0, and
 * those are two independent channels that it sums when it writes the transform
 * back. Animating `yPercent` to 0 therefore completes perfectly and changes
 * nothing, because the offset was never in `yPercent`; the text stays parked below
 * its mask forever. Zeroing `y` in the from-vars moves the offset into the channel
 * being animated.
 *
 * The failure is worth knowing because it is invisible in the usual places: no
 * console error, GSAP reports the tween complete, and every sibling tween in the
 * same timeline still runs, so only the split text is affected.
 *
 * Returns a fresh object per call: GSAP caches parsed data on a vars object, so
 * sharing one instance across tweens leaks state between them.
 */
export const maskHidden = () => ({ yPercent: 110, y: 0 })

/** The single easing and duration pair the whole site reveals with. */
export const REVEAL = { duration: 1.05, ease: 'expo.out' } as const
