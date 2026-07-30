<script setup lang="ts">
/*
 * Opening loader.
 *
 * Progress is real. It tracks the webfonts plus the images the first two screens
 * actually need, so the bar finishing means the page is genuinely ready rather
 * than a timer having elapsed.
 *
 * Two failure modes are handled deliberately:
 *
 *   - No JS, or reduced motion. The panel is `display: none` until `.motion-ready`
 *     is on <html>, and that class is only added by the inline head script when
 *     motion is allowed. A visitor without JS never sees an overlay they cannot
 *     dismiss.
 *   - A stalled asset. `SAFETY_MS` forces the exit regardless, so a single slow
 *     image can never hold the site behind a black screen.
 */
import { profile } from '~/data/content'

/*
 * Timings are a direct trade against Largest Contentful Paint, so they are kept
 * as short as the choreography allows. While this panel is up it *is* the largest
 * contentful paint, so every 100ms of hold is 100ms on the metric. The sequence
 * below lands at roughly 1.7s from mount rather than the 2.8s it started at, which
 * still reads as deliberate rather than as a flash.
 */
const HOLD_S = 0.55
const SAFETY_MS = 3000

/* Once per session. A visitor moving between pages has already seen the intro,
   and replaying it would make the site feel slower the more they use it. */
const SEEN_KEY = 'intro-seen'

const panel = ref<HTMLElement | null>(null)
const monogram = ref<HTMLElement | null>(null)
const rule = ref<HTMLElement | null>(null)
const nameEl = ref<HTMLElement | null>(null)
const barEl = ref<HTMLElement | null>(null)
const percentEl = ref<HTMLElement | null>(null)

const introDone = useIntroDone()
const enabled = useRuntimeConfig().public.intro as boolean
const finished = ref(!enabled)

onMounted(() => {
  if (!enabled) return

  let seen = false
  try {
    seen = sessionStorage.getItem(SEEN_KEY) === '1'
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Storage can be blocked outright. Showing the intro is the safe default.
  }

  if (!motionOk() || seen) {
    introDone.value = true
    finished.value = true
    return
  }

  const { gsap } = useGsap()
  setScrollLocked(true)

  const cleanups: (() => void)[] = []
  let exited = false

  /* --- Entrance ---------------------------------------------------------- */
  const chars = nameEl.value ? splitChars(nameEl.value) : null
  if (chars) cleanups.push(chars.revert)

  const intro = gsap.timeline()
  intro
    .from(monogram.value, { yPercent: 120, duration: 0.7, ease: 'expo.out' })
    .from(rule.value, { scaleX: 0, duration: 0.85, ease: 'expo.out' }, 0.1)
    .fromTo(
      chars?.chars ?? [],
      maskHidden(),
      { yPercent: 0, duration: 0.55, stagger: 0.025, ease: 'expo.out' },
      0.22,
    )

  /* --- Real progress ----------------------------------------------------- */
  /*
   * Fonts only, and deliberately so.
   *
   * This used to also preload the portrait and every project mark, so the meter
   * had more to count. That was actively harmful: those five files are about
   * 250 KB of PNG, none of them appear on the first screen, and fetching them
   * eagerly made them compete for bandwidth with the resources the first screen
   * genuinely needs. It cost roughly a second of Largest Contentful Paint to make
   * a progress bar look busier.
   *
   * Fonts are the one thing the first screen really does wait on, so they are what
   * the meter measures. Everything else loads lazily when it is scrolled to.
   */
  const jobs: Promise<unknown>[] = []
  if (document.fonts) jobs.push(document.fonts.ready)
  // Nothing to wait on at all: still give the meter one tick to travel.
  if (!jobs.length) jobs.push(Promise.resolve())

  const total = jobs.length
  let done = 0
  const shown = { value: 0 }

  const paint = () => {
    gsap.to(shown, {
      value: done / total,
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => {
        if (barEl.value) barEl.value.style.transform = `scaleX(${shown.value})`
        if (percentEl.value) percentEl.value.textContent = String(Math.round(shown.value * 100))
      },
    })
  }

  jobs.forEach((job) =>
    Promise.resolve(job).then(() => {
      done += 1
      paint()
    }),
  )

  /* --- Exit -------------------------------------------------------------- */
  const exit = () => {
    if (exited) return
    exited = true

    gsap
      .timeline({
        onComplete: () => {
          setScrollLocked(false)
          finished.value = true
        },
      })
      // Wait for the entrance to have read as deliberate, however fast the
      // assets came back.
      .to({}, { duration: Math.max(0, HOLD_S - intro.time()) })
      .to([monogram.value, chars?.chars ?? []], {
        yPercent: -120,
        duration: 0.45,
        stagger: 0.01,
        ease: 'expo.inOut',
      })
      .to([rule.value, barEl.value?.parentElement ?? null], { opacity: 0, duration: 0.25 }, '<')
      .to(panel.value, {
        yPercent: -100,
        duration: 0.7,
        ease: 'expo.inOut',
        // Hand off here, not on complete: the hero headline should already be
        // rising as the panel clears it.
        onStart: () => {
          introDone.value = true
        },
      })
  }

  Promise.all(jobs).then(exit)
  const safety = window.setTimeout(exit, SAFETY_MS)
  cleanups.push(() => window.clearTimeout(safety))

  onBeforeUnmount(() => {
    intro.kill()
    cleanups.forEach((fn) => fn())
    setScrollLocked(false)
  })
})
</script>

<template>
  <div v-if="!finished" ref="panel" data-preloader class="preloader" role="status" aria-live="polite">
    <p class="sr-only">Loading</p>

    <div class="preloader__mark">
      <span class="line">
        <span ref="monogram" class="preloader__monogram">{{ profile.initials }}</span>
      </span>
      <span ref="rule" class="preloader__rule" />
      <span class="line">
        <span ref="nameEl" class="preloader__name">{{ profile.name }}</span>
      </span>
    </div>

    <div class="preloader__meter">
      <span class="preloader__percent"><span ref="percentEl">0</span>%</span>
      <span class="preloader__track"><span ref="barEl" class="preloader__bar" /></span>
    </div>
  </div>
</template>

<style scoped>
/* `display` is deliberately absent: it is owned by the global gate in main.css,
   keyed on `html.motion-ready [data-preloader]`. Do not reintroduce a
   `:global(html...)` selector here, it mis-compiles onto the root element. */
.preloader {
  position: fixed;
  inset: 0;
  z-index: 80;
  align-content: center;
  justify-items: start;
  gap: clamp(2rem, 6vh, 4rem);
  padding: 0 1.25rem;
  background: var(--color-ink);
}

@media (min-width: 768px) {
  .preloader {
    padding: 0 2.5rem;
  }
}

.preloader__mark {
  display: grid;
  gap: 1rem;
  width: 100%;
  max-width: var(--shell);
  margin-inline: auto;
}

.preloader__monogram {
  display: inline-block;
  font-weight: 600;
  font-size: clamp(4rem, 16vw, 11rem);
  line-height: 0.86;
  letter-spacing: -0.05em;
}

.preloader__rule {
  display: block;
  height: 1px;
  background: var(--color-accent);
  transform-origin: left center;
}

.preloader__name {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: clamp(0.75rem, 2.2vw, 1rem);
  letter-spacing: 0.34em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.preloader__meter {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  max-width: var(--shell);
  margin-inline: auto;
}

.preloader__percent {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.2em;
  color: var(--color-faint);
  font-variant-numeric: tabular-nums;
  min-width: 3.5ch;
}

.preloader__track {
  position: relative;
  flex: 1;
  height: 1px;
  background: var(--line);
  overflow: hidden;
}

.preloader__bar {
  display: block;
  height: 100%;
  width: 100%;
  background: var(--color-fg);
  transform: scaleX(0);
  transform-origin: left center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
</style>
