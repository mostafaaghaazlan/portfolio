<script setup lang="ts">
/*
 * About. Layout family: editorial two column prose over a figures band.
 *
 * There is no portrait here by choice. This section used to be an image and text
 * split built around one, and with the photograph gone a split would have left an
 * empty column, so the section was recomposed rather than patched: the heading sits
 * alone at a large scale, the body runs as two editorial columns beneath it, and the
 * figures close it out on a hairline.
 *
 * That also keeps it from rhyming with anything else. It is deliberately not the
 * hero's shape (heading with copy offset right), and deliberately not a split
 * header (big headline left, small explainer right), which reads as filler.
 *
 * The figures are real. They are summed from `git rev-list --count --author` across
 * every local repository, and the note under them says so, because a portfolio
 * number nobody can check is worth nothing.
 */
import { about, figures, figuresNote } from '~/data/content'

const heading = ref<HTMLElement | null>(null)

const root = useScene(({ gsap, root, onCleanup }) => {
  /* Heading reveals line by line. */
  const split = heading.value ? splitLines(heading.value) : null
  if (split) onCleanup(split.revert)
  gsap.fromTo(split?.words ?? [], maskHidden(), {
    yPercent: 0,
    duration: 1.1,
    stagger: 0.02,
    ease: 'expo.out',
    scrollTrigger: { trigger: heading.value, start: 'top 85%', once: true },
  })

  /* Columns, then the skills, one after another. Scoped to the copy block so this
     does not also catch the figures below and fire them off screen. */
  gsap.to(root.querySelectorAll('[data-copy] [data-reveal="up"]'), {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.1,
    ease: 'expo.out',
    scrollTrigger: { trigger: root.querySelector('[data-copy]'), start: 'top 84%', once: true },
  })

  gsap.to(root.querySelectorAll('[data-figure]'), {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.09,
    ease: 'expo.out',
    scrollTrigger: { trigger: root.querySelector('[data-figures]'), start: 'top 88%', once: true },
  })
})
</script>

<template>
  <section id="about" ref="root" class="shell scroll-mt-24 py-28 md:py-40">
    <h2 ref="heading" class="display-lg max-w-[18ch]">{{ about.heading }}</h2>

    <div data-copy class="mt-12 md:mt-16">
      <!-- Two editorial columns rather than one measure, so the prose fills the
           width the missing portrait used to occupy instead of running long. -->
      <div class="grid gap-6 md:grid-cols-2 md:gap-x-16">
        <p
          v-for="paragraph in about.body"
          :key="paragraph"
          data-reveal="up"
          class="max-w-[52ch] text-lg leading-relaxed text-muted"
        >
          {{ paragraph }}
        </p>
      </div>

      <!-- Grouped by a single hairline rather than boxed into cards. -->
      <ul class="hairline mt-14 grid gap-x-10 gap-y-4 pt-8 sm:grid-cols-2 lg:grid-cols-4">
        <li
          v-for="skill in about.skills"
          :key="skill"
          data-reveal="up"
          class="text-[0.9375rem] leading-snug text-fg"
        >
          {{ skill }}
        </li>
      </ul>
    </div>

    <!-- Figures band. Plain layout, hairline separated, no card containers. -->
    <div data-figures class="mt-24 md:mt-32">
      <dl class="hairline grid grid-cols-2 gap-y-10 pt-10 md:grid-cols-4">
        <div v-for="figure in figures" :key="figure.label" data-figure data-reveal="up" class="pr-6">
          <dt class="figure__value">
            <CountUp :value="figure.value" />
          </dt>
          <dd class="mt-2 text-sm leading-snug text-muted">{{ figure.label }}</dd>
        </div>
      </dl>
      <p class="mt-8 max-w-[62ch] text-sm text-faint">{{ figuresNote }}</p>
    </div>
  </section>
</template>

<style scoped>
.figure__value {
  font-family: var(--font-mono);
  font-weight: 500;
  font-size: clamp(2.25rem, 4.6vw, 3.75rem);
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}

/* The pre-animation state for the figures comes from `data-reveal="up"` in
   main.css, which is gated on `.motion-ready`. Setting opacity here instead would
   hide them for anyone without JS. */
</style>
