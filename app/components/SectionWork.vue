<script setup lang="ts">
/*
 * Selected work. Layout family: sticky-stack of full height title cards.
 *
 * Each panel fills most of the viewport and the next one rises over it, so the
 * previous project is still visible, shrinking and dimming, as the next arrives.
 *
 * Implementation note, because this deviates from the usual skeleton on purpose:
 * the stacking is done with CSS `position: sticky; top: 0` rather than
 * ScrollTrigger's `pin`. Pinning inserts spacer elements and rewrites document
 * height, which then has to be re-measured every time Lenis, a webfont or an
 * image changes the layout. Sticky needs none of that and cannot desynchronise.
 * ScrollTrigger is still doing the real work: it scrubs the outgoing card's scale
 * and opacity, and, per the pattern, that tween is driven by the *next* card's
 * trigger, which is what makes a card recede as its successor lands rather than
 * on its own schedule.
 *
 * Panels are not an image-beside-text split. About already uses that family, and
 * repeating it here would make two very different sections rhyme.
 */
import { projects } from '~/data/content'

const heading = ref<HTMLElement | null>(null)

const root = useScene(({ gsap, root, onCleanup }) => {
  const split = heading.value ? splitLines(heading.value) : null
  if (split) onCleanup(split.revert)
  gsap.fromTo(split?.words ?? [], maskHidden(), {
    yPercent: 0,
    duration: 1.1,
    stagger: 0.025,
    ease: 'expo.out',
    scrollTrigger: { trigger: heading.value, start: 'top 85%', once: true },
  })

  const cards = gsap.utils.toArray<HTMLElement>('[data-card]', root)

  cards.forEach((card, index) => {
    const inner = card.querySelector('[data-card-inner]')
    const backdrop = card.querySelector('[data-card-backdrop]')
    const meta = card.querySelectorAll('[data-card-meta]')

    const titleEl = card.querySelector('[data-card-title]')
    const titleSplit = titleEl ? splitLines(titleEl) : null
    if (titleSplit) onCleanup(titleSplit.revert)
    const words = titleSplit?.words ?? []

    /* Arrival: the panel wipes up out of a mask and unwinds a slight rotation.
       Both land before the card reaches the top, so it is settled by the time it
       becomes the sticky one. */
    // `rotation`, not `rotate`. GSAP accepts the CSS spelling as an alias but cannot
    // reset it, so `context.revert()` on unmount logs "rotate not eligible for
    // reset" and leaves the transform behind. Its own property names revert cleanly.
    gsap.fromTo(
      inner,
      { clipPath: 'inset(100% 0% 0% 0%)', rotation: 1.4, scale: 1.04 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        rotation: 0,
        scale: 1,
        duration: 1.4,
        ease: 'expo.out',
        scrollTrigger: { trigger: card, start: 'top 78%', once: true },
      },
    )

    gsap.fromTo(words, maskHidden(), {
      yPercent: 0,
      duration: 1.15,
      stagger: 0.03,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 62%', once: true },
    })

    gsap.to(meta, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.07,
      ease: 'expo.out',
      scrollTrigger: { trigger: card, start: 'top 55%', once: true },
    })

    /* Parallax inside the frame: the mark drifts against the panel, which is
       what stops a full height card from feeling like a flat slide. */
    gsap.fromTo(
      backdrop,
      { yPercent: -8, scale: 1.08 },
      {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )

    /* Recede as the next card arrives. Driven by the next card's trigger. */
    const next = cards[index + 1]
    if (!next) return
    gsap.to(inner, {
      scale: 0.93,
      opacity: 0.45,
      ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
    })
  })
})
</script>

<template>
  <section id="work" ref="root" class="scroll-mt-24 py-28 md:py-40">
    <div class="shell">
      <!-- Eyebrow 2 of 2 site wide. -->
      <p class="label">Selected work</p>
      <h2 ref="heading" class="display-lg mt-6 max-w-[24ch]">
        Six projects, client to server.
      </h2>
    </div>

    <div class="stack mt-16 md:mt-24">
      <article v-for="project in projects" :key="project.slug" data-card class="card">
        <!-- data-cursor is just "View". The follower label sits inside a 105px ring,
             which fits about ten characters; interpolating the title produced
             "View Wadeni Map" and it overflowed the circle. The title is already the
             largest thing on the panel, so repeating it in the cursor adds nothing.
             The full name still reaches assistive tech through aria-label. -->
        <NuxtLink
          data-card-inner
          class="card__inner"
          :to="`/work/${project.slug}`"
          data-cursor="View"
          :aria-label="`${project.title}, ${project.subtitle}`"
        >
          <!-- Backdrop: the monogram as outlined ghost type.
               The first version blurred the project's own logo to fill this space,
               which was a mistake: these marks are full colour on light plates, and
               a 46px blur turns them into a brown smear that reads as a rendering
               fault rather than art direction. Outlined type stays crisp at any
               size, carries the project's initials, and cannot go muddy. The real
               logo is shown properly, unblurred, in the corner. -->
          <div data-card-backdrop class="card__backdrop" aria-hidden="true">
            <span class="card__ghost">{{ project.monogram }}</span>
          </div>

          <div class="card__body shell">
            <div class="flex items-start justify-between gap-6">
              <BrandMark
                :logo="project.logo"
                :monogram="project.monogram"
                :plate="project.plate"
                :name="project.title"
                size="4rem"
              />
              <span data-card-meta data-reveal="up" class="label card__year">{{ project.year }}</span>
            </div>

            <div class="mt-auto">
              <p data-card-meta data-reveal="up" class="card__subtitle">{{ project.subtitle }}</p>

              <h3 data-card-title class="card__title">{{ project.title }}</h3>

              <p data-card-meta data-reveal="up" class="card__summary">{{ project.summary }}</p>

              <div data-card-meta data-reveal="up" class="card__foot">
                <ul class="card__tags">
                  <li v-for="tag in project.tags" :key="tag">{{ tag }}</li>
                </ul>
                <!-- The CTA is always in the DOM and readable; hover only moves
                     it. Hiding an affordance until hover would strand touch and
                     keyboard users. -->
                <span class="card__cta">
                  View project
                  <Icon name="ph:arrow-up-right" class="card__cta-icon" />
                </span>
              </div>
            </div>
          </div>
        </NuxtLink>
      </article>
    </div>
</section>
</template>

<style scoped>
/*
 * The panels are full bleed, so the arrival transform (scale 1.04, rotate 1.4deg)
 * necessarily paints wider than the viewport and would add a horizontal scrollbar.
 *
 * `overflow-x: clip` rather than `hidden`: clip does not create a scroll
 * container, so the sticky children still resolve against the viewport. With
 * `hidden` they would stick inside this box instead and the stack would break.
 * `overflow-y` is left visible, which `clip` permits and `hidden` does not.
 */
.stack {
  overflow-x: clip;
}

.card {
  position: sticky;
  top: 0;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  padding-block: 1.5rem;
}

.card__inner {
  position: relative;
  display: block;
  overflow: hidden;
  width: 100%;
  min-height: min(88dvh, 900px);
  background: var(--color-surface);
  border: 1px solid var(--line);
  /* Radius 0, per the shape lock. */
  will-change: transform, clip-path;
}

/* Per-project tint, taken from the one accent so the palette never splits. */
.card__inner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(90% 70% at 82% 12%, rgb(124 92 255 / 0.2), transparent 70%);
  pointer-events: none;
}

.card__backdrop {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  transition: transform 0.9s var(--ease-cine);
}

.card__ghost {
  font-weight: 600;
  font-size: clamp(10rem, 32vw, 26rem);
  line-height: 0.8;
  letter-spacing: -0.05em;
  /* Outline only. Filled ghost type at this scale competes with the headline. */
  color: transparent;
  -webkit-text-stroke: 1px rgb(255 255 255 / 0.07);
  text-stroke: 1px rgb(255 255 255 / 0.07);
  user-select: none;
}

/* Hover: the backdrop pushes in. This is the "image zooms" beat, kept off the
   copy so the type never scales and stays crisp. */
.card__inner:hover .card__backdrop {
  transform: scale(1.07);
}

.card__body {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: min(88dvh, 900px);
  padding-block: 2.25rem 2.5rem;
}
@media (min-width: 768px) {
  .card__body {
    padding-block: 3rem 3.5rem;
  }
}

/* The parked state for these lives in main.css under `data-reveal`, so it is
   gated on `.motion-ready`. Do not add `opacity: 0` here. */
.card__subtitle {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.card__title {
  margin-top: 0.75rem;
  overflow: hidden;
  font-weight: 600;
  font-size: clamp(2.5rem, 7.5vw, 6rem);
  line-height: 0.96;
  letter-spacing: -0.045em;
}

.card__summary {
  margin-top: 1.5rem;
  max-width: 52ch;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--color-muted);
}

.card__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

.card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.25rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-faint);
}

.card__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-fg);
}
.card__cta-icon {
  width: 1em;
  height: 1em;
  transition: transform 0.45s var(--ease-cine);
}
.card__inner:hover .card__cta-icon {
  transform: translate(3px, -3px);
}

@media (prefers-reduced-motion: reduce) {
  /* Plain vertical list. Stacking without the scale and fade that explains it
     just reads as overlapping content. */
  .card {
    position: static;
    min-height: 0;
  }
  .card__inner,
  .card__body {
    min-height: 0;
  }
}
</style>
