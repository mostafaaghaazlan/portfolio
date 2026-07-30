<script setup lang="ts">
/*
 * Cursor follower.
 *
 * The brief asks for a custom cursor, which is normally a bad idea: replacing the
 * system cursor loses the affordances a visitor already reads (text beam, link
 * hand, resize arrows) and it fails outright for anyone on touch or a keyboard.
 *
 * So this is additive rather than a replacement. The native cursor stays visible
 * everywhere. This adds a lagging ring that grows and labels itself over anything
 * carrying `data-cursor`, which is where the brief wanted "cursor changes" and
 * "CTA appears" on project hover. It is inert markup, hidden from assistive tech,
 * and never mounts on coarse pointers or under reduced motion.
 *
 * Sharpness is the whole reason this is built the way it is, and it took two goes.
 *
 * First attempt: the label sat inside the ring at `font-size: 3.4px`, counter-scaled
 * by the ring's `scale(3.4)` to come back out readable. That fails because the
 * browser rasterises text at its pre-transform size, so it drew 3.4px glyphs and
 * magnified the blur.
 *
 * Second attempt moved the label out of the scaled element, which fixed the glyph
 * size but was still soft. The real cause is more general: growing the ring from
 * 34px to 105px with `scale()` on a composited layer makes the compositor rasterise
 * it once at 34px and then GPU-magnify that texture. A 1px border becomes a violet
 * bloom and any text inside goes with it. Proven by sizing the ring's box directly
 * instead of scaling it, which is instantly crisp.
 *
 * So nothing here is ever scaled up. There are two rings at their true sizes that
 * cross-fade, the label animates opacity only, and `will-change: transform` is
 * confined to the wrapper, which only ever translates. Translation is resolution
 * independent; scale is not.
 *
 * Position is written straight to the element with gsap.quickSetter and quickTo,
 * never through reactive state, so a mouse move costs no Vue render.
 */
const follow = ref<HTMLElement | null>(null)
const idleRing = ref<HTMLElement | null>(null)
const activeRing = ref<HTMLElement | null>(null)
const labelEl = ref<HTMLElement | null>(null)
const dot = ref<HTMLElement | null>(null)

const label = ref('')
const enabled = ref(false)

let teardown: (() => void) | null = null

onMounted(() => {
  // A coarse pointer has no hover, and a follower would sit stranded where the
  // last tap landed.
  const fine = window.matchMedia('(pointer: fine)').matches
  if (!fine || !motionOk()) return
  enabled.value = true

  const { gsap } = useGsap()

  nextTick(() => {
    if (!dot.value || !idleRing.value || !activeRing.value || !follow.value || !labelEl.value)
      return

    const setDotX = gsap.quickSetter(dot.value, 'x', 'px')
    const setDotY = gsap.quickSetter(dot.value, 'y', 'px')
    // The wrapper carries the lag, so both rings and the label move as one. It is
    // the only element here that is transformed, and only ever translated.
    const setX = gsap.quickTo(follow.value, 'x', { duration: 0.5, ease: 'power3.out' })
    const setY = gsap.quickTo(follow.value, 'y', { duration: 0.5, ease: 'power3.out' })

    const onMove = (event: PointerEvent) => {
      setDotX(event.clientX)
      setDotY(event.clientY)
      setX(event.clientX)
      setY(event.clientY)
    }

    // One delegated listener for the whole document instead of per element
    // handlers, so cards added by a route change are covered without rebinding.
    const onOver = (event: PointerEvent) => {
      const hit = (event.target as HTMLElement | null)?.closest?.('[data-cursor]')
      const next = hit?.getAttribute('data-cursor') ?? ''
      if (next === label.value) return
      label.value = next

      // Cross-fade between two rings that are already the right size. Opacity is
      // resolution independent, so both stay crisp; scaling one into the other's
      // size is what made it blurry.
      gsap.to(idleRing.value, { opacity: next ? 0 : 1, duration: 0.35, ease: 'expo.out' })
      gsap.to(activeRing.value, { opacity: next ? 1 : 0, duration: 0.45, ease: 'expo.out' })
      // Opacity only. Any transform on the label risks the compositor rasterising
      // the glyphs at the wrong size.
      gsap.to(labelEl.value, { opacity: next ? 1 : 0, duration: 0.35, ease: 'expo.out' })
      gsap.to(dot.value, { opacity: next ? 0 : 1, duration: 0.2 })
    }

    const onLeaveWindow = () => {
      gsap.to([dot.value, follow.value], { opacity: 0, duration: 0.25 })
    }
    const onEnterWindow = () => {
      gsap.to(follow.value, { opacity: 1, duration: 0.25 })
      if (!label.value) gsap.to(dot.value, { opacity: 1, duration: 0.25 })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerleave', onLeaveWindow)
    document.addEventListener('pointerenter', onEnterWindow)

    teardown = () => {
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerleave', onLeaveWindow)
      document.removeEventListener('pointerenter', onEnterWindow)
      gsap.killTweensOf([
        dot.value,
        idleRing.value,
        activeRing.value,
        labelEl.value,
        follow.value,
      ])
    }
  })
})

onBeforeUnmount(() => {
  teardown?.()
  teardown = null
})
</script>

<template>
  <div v-if="enabled" class="cursor" aria-hidden="true">
    <span ref="follow" class="cursor__follow">
      <span ref="idleRing" class="cursor__ring cursor__ring--idle" />
      <span ref="activeRing" class="cursor__ring cursor__ring--active" />
      <span ref="labelEl" class="cursor__label">{{ label }}</span>
    </span>
    <span ref="dot" class="cursor__dot" />
  </div>
</template>

<style scoped>
.cursor {
  position: fixed;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}

/*
 * Translates only, never scales.
 *
 * The box is the size of its largest child and pulled back by half of that, so the
 * point it is translated to is its centre and everything inside shares that centre.
 *
 * A 0x0 box with `place-items: center` looks like the tidier trick and does not work:
 * when a grid item overflows its area, centring falls back to start alignment so the
 * item is never clipped, which left the 105px ring sitting with its top-left corner
 * on the pointer. Sizing the box so nothing overflows keeps centring honest, and 106
 * is used rather than 105 to keep the margin a whole pixel.
 */
.cursor__follow {
  position: absolute;
  top: 0;
  left: 0;
  width: 106px;
  height: 106px;
  margin: -53px 0 0 -53px;
  display: grid;
  place-items: center;
  will-change: transform;
}

/* Circles are the one exception to the radius 0 lock.
   Both rings share a grid cell so they are concentric, and neither carries
   `will-change: transform`: they are never transformed, only faded. */
.cursor__ring {
  grid-area: 1 / 1;
  border-radius: 9999px;
}

.cursor__ring--idle {
  width: 34px;
  height: 34px;
  border: 1px solid rgb(255 255 255 / 0.35);
}

/* Its real size, reached by being this size, not by scaling the idle ring up.
   Matches the wrapper exactly, so it centres at a whole pixel. */
.cursor__ring--active {
  width: 106px;
  height: 106px;
  border: 1px solid rgb(124 92 255 / 0.9);
  background: rgb(124 92 255 / 0.16);
  opacity: 0;
}

.cursor__label {
  grid-area: 1 / 1;
  font-family: var(--font-mono);
  /* A real font size, never transformed to compensate for anything. */
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
  color: var(--color-fg);
  white-space: nowrap;
  opacity: 0;
}

.cursor__dot {
  position: absolute;
  top: 0;
  left: 0;
  width: 5px;
  height: 5px;
  margin: -2.5px 0 0 -2.5px;
  border-radius: 9999px;
  background: var(--color-accent);
  will-change: transform;
}
</style>
