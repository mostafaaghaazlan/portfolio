<script setup lang="ts">
/*
 * Stack. Layout family: interactive tilt grid.
 *
 * Each tile tilts toward the pointer in 3D, lifts a soft accent glow under the
 * cursor, spins its mark a few degrees and draws a hairline across its base.
 *
 * Deliberately not a skill meter. A drawn line here is a hover affordance, not a
 * percentage: nobody can honestly quantify their own Flutter ability as 87, and a
 * filled progress track would be inventing precision the page has not earned.
 *
 * Tilt and glow are written straight to the element. Pointer position never
 * enters reactive state, or seventeen tiles would each re-render the tree on
 * every mouse move.
 */
import { stack, stackNote } from '~/data/content'

const root = useScene(({ gsap, root, onCleanup }) => {
  gsap.to(root.querySelectorAll('[data-tile]'), {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: { each: 0.045, from: 'start' },
    ease: 'expo.out',
    scrollTrigger: { trigger: root.querySelector('[data-grid]'), start: 'top 82%', once: true },
  })

  gsap.to(root.querySelectorAll('[data-reveal="up"]'), {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.1,
    ease: 'expo.out',
    scrollTrigger: { trigger: root, start: 'top 80%', once: true },
  })

  // No tilt on a coarse pointer: there is no hover to tilt toward, and a stuck
  // rotation after a tap looks broken.
  const mm = gsap.matchMedia()
  onCleanup(() => mm.revert())

  mm.add('(min-width: 768px) and (pointer: fine)', () => {
    const tiles = gsap.utils.toArray<HTMLElement>('[data-tile]', root)
    const unbind: (() => void)[] = []

    tiles.forEach((tile) => {
      const inner = tile.querySelector<HTMLElement>('[data-tile-inner]')
      const mark = tile.querySelector<HTMLElement>('[data-tile-mark]')
      if (!inner || !mark) return

      // GSAP's own property names, not the CSS spellings. `rotateX`/`rotate` work as
      // aliases but cannot be reset, so `context.revert()` on unmount logs
      // "not eligible for reset" and leaves the tilt applied.
      const rx = gsap.quickTo(inner, 'rotationX', { duration: 0.5, ease: 'power3.out' })
      const ry = gsap.quickTo(inner, 'rotationY', { duration: 0.5, ease: 'power3.out' })
      const spin = gsap.quickTo(mark, 'rotation', { duration: 0.7, ease: 'power3.out' })

      // Measured once per hover. Reading it inside pointermove would force a
      // synchronous layout flush on every event, seventeen tiles over.
      let box: DOMRect | null = null
      const onEnter = () => {
        box = tile.getBoundingClientRect()
      }

      const onMove = (event: PointerEvent) => {
        if (!box) box = tile.getBoundingClientRect()
        const nx = (event.clientX - box.left) / box.width - 0.5
        const ny = (event.clientY - box.top) / box.height - 0.5
        // Inverted on X: pushing the pointer down should tip the near edge toward
        // the viewer, not away.
        rx(-ny * 14)
        ry(nx * 16)
        spin(nx * 18)
        tile.style.setProperty('--mx', `${(nx + 0.5) * 100}%`)
        tile.style.setProperty('--my', `${(ny + 0.5) * 100}%`)
      }
      const onLeave = () => {
        box = null
        rx(0)
        ry(0)
        spin(0)
      }

      tile.addEventListener('pointerenter', onEnter)
      tile.addEventListener('pointermove', onMove, { passive: true })
      tile.addEventListener('pointerleave', onLeave)
      unbind.push(() => {
        tile.removeEventListener('pointerenter', onEnter)
        tile.removeEventListener('pointermove', onMove)
        tile.removeEventListener('pointerleave', onLeave)
      })
    })

    return () => unbind.forEach((fn) => fn())
  })
})
</script>

<template>
  <section id="stack" ref="root" class="shell scroll-mt-24 py-28 md:py-40">
    <h2 data-reveal="up" class="display-md max-w-[26ch]">
      The tools, and how I tend to put them together.
    </h2>
    <p data-reveal="up" class="mt-6 max-w-[62ch] text-lg leading-relaxed text-muted">
      {{ stackNote }}
    </p>

    <ul data-grid class="mt-14 grid gap-3 md:mt-20">
      <li v-for="entry in stack" :key="entry.icon" data-tile data-reveal="up" class="tile">
        <span data-tile-inner class="tile__inner">
          <span
            data-tile-mark
            class="tile__mark"
            :style="{ '--icon': `url(${asset(entry.url)})` }"
            aria-hidden="true"
          />
          <span class="tile__label">{{ entry.label }}</span>
          <span class="tile__rule" aria-hidden="true" />
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
[data-grid] {
  /* auto-fill, so a partial final row is the grid ending rather than a hole. */
  grid-template-columns: repeat(auto-fill, minmax(clamp(8.5rem, 14vw, 11rem), 1fr));
}

/* Parked state comes from `data-reveal` in main.css, which is gated on
   `.motion-ready`. Do not add `opacity: 0` here. */
.tile {
  perspective: 700px;
}

.tile__inner {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: 1.25rem;
  min-height: 8.5rem;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--line);
  transform-style: preserve-3d;
  transition: border-color 0.45s var(--ease-cine);
}

/* Glow follows the cursor. Inner shadow rather than an outer neon bloom. */
.tile__inner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    9rem circle at var(--mx, 50%) var(--my, 50%),
    rgb(124 92 255 / 0.22),
    transparent 72%
  );
  opacity: 0;
  transition: opacity 0.45s var(--ease-cine);
  pointer-events: none;
}

.tile:hover .tile__inner {
  border-color: rgb(124 92 255 / 0.45);
}
.tile:hover .tile__inner::before {
  opacity: 1;
}

.tile__mark {
  display: block;
  width: 1.6rem;
  height: 1.6rem;
  /* Real Simple Icons SVGs, drawn as masks so the colour follows the theme
     instead of the file. */
  background-color: var(--color-muted);
  mask-image: var(--icon);
  -webkit-mask-image: var(--icon);
  mask-repeat: no-repeat;
  -webkit-mask-repeat: no-repeat;
  mask-size: contain;
  -webkit-mask-size: contain;
  mask-position: center;
  -webkit-mask-position: center;
  transition: background-color 0.45s var(--ease-cine);
}
.tile:hover .tile__mark {
  background-color: var(--color-fg);
}

.tile__label {
  margin-top: auto;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.tile__rule {
  position: absolute;
  left: 1.25rem;
  right: 1.25rem;
  bottom: 0.9rem;
  height: 1px;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.6s var(--ease-cine);
}
.tile:hover .tile__rule {
  transform: scaleX(1);
}
</style>
