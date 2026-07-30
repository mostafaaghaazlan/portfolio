<script setup lang="ts">
/*
 * Timeline. Layout family: scrubbed vertical rail.
 *
 * This is a shipping log, not a CV. Every date is the real first commit month of
 * the repository named beside it, so the section can be checked against git
 * rather than taken on trust. It claims no job titles and no employers, because
 * git history does not evidence those.
 *
 * The rail grows as you scroll rather than fading in, so its height reads as
 * progress through the list. It is scrubbed against the list, not the viewport,
 * which keeps the line tip roughly level with whichever entry is being read.
 */
import { timeline } from '~/data/content'

const rail = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)

const root = useScene(({ gsap, root }) => {
  gsap.to(root.querySelectorAll('[data-reveal="up"]'), {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'expo.out',
    scrollTrigger: { trigger: root, start: 'top 80%', once: true },
  })

  gsap.fromTo(
    rail.value,
    { scaleY: 0 },
    {
      scaleY: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: list.value,
        start: 'top 72%',
        end: 'bottom 72%',
        scrub: 0.4,
        invalidateOnRefresh: true,
      },
    },
  )

  gsap.utils.toArray<HTMLElement>('[data-milestone]', root).forEach((item) => {
    gsap.to(item, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'expo.out',
      scrollTrigger: { trigger: item, start: 'top 84%', once: true },
    })
    // fromTo, not to: the parked state is declared here rather than in CSS, so a
    // JS failure leaves the rail and its markers drawn instead of blank.
    gsap.fromTo(
      item.querySelector('[data-node]'),
      { scale: 0.5, backgroundColor: 'rgb(139 139 149)' },
      {
        scale: 1,
        backgroundColor: 'rgb(124 92 255)',
        duration: 0.5,
        ease: 'expo.out',
        scrollTrigger: { trigger: item, start: 'top 78%', once: true },
      },
    )
  })
})
</script>

<template>
  <section ref="root" class="shell py-28 md:py-40">
    <h2 data-reveal="up" class="display-md max-w-[24ch]">What shipped, and when.</h2>
    <p data-reveal="up" class="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted">
      Dates are the first commit on each repository, so this log matches the git history rather
      than a memory of it.
    </p>

    <ol ref="list" class="rail mt-16 md:mt-24">
      <span ref="rail" class="rail__line" aria-hidden="true" />

      <li
        v-for="entry in timeline"
        :key="entry.when"
        data-milestone
        data-reveal="up"
        class="milestone"
      >
        <time class="milestone__when">{{ entry.when }}</time>
        <span data-node class="milestone__node" aria-hidden="true" />
        <div class="milestone__body">
          <h3 class="milestone__title">{{ entry.title }}</h3>
          <p class="milestone__text">{{ entry.body }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.rail {
  --rail-x: 0.1875rem;
  position: relative;
  display: grid;
  gap: 3rem;
}

@media (min-width: 768px) {
  .rail {
    --rail-x: 9.4rem;
    gap: 3.5rem;
  }
}

.rail__line {
  position: absolute;
  top: 0.4rem;
  bottom: 0.4rem;
  left: var(--rail-x);
  width: 1px;
  background: linear-gradient(to bottom, var(--color-accent), rgb(124 92 255 / 0.25));
  /* No scaleY(0) here. GSAP declares the parked state in its fromTo, so without
     JS the rail simply renders complete. */
  transform-origin: top center;
}

.milestone {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
  padding-left: 2rem;
}

@media (min-width: 768px) {
  .milestone {
    grid-template-columns: 9rem 1fr;
    gap: 0 3rem;
    padding-left: 0;
  }
}

.milestone__when {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-faint);
  padding-top: 0.3rem;
}

/* Square, not a dot. A coloured circle reads as a status light; this is a
   position marker on a rail. */
.milestone__node {
  position: absolute;
  left: calc(var(--rail-x) - 0.1875rem);
  top: 0.55rem;
  width: 0.4375rem;
  height: 0.4375rem;
  background: var(--color-accent);
}

.milestone__title {
  font-size: 1.375rem;
  font-weight: 600;
  letter-spacing: -0.025em;
}

.milestone__text {
  margin-top: 0.65rem;
  max-width: 56ch;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--color-muted);
}

/* No reduced-motion block is needed. Every parked state in this section is now
   declared by GSAP, which does not run under reduced motion, or by `data-reveal`,
   which main.css already resets. */
</style>
