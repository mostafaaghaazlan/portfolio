<script setup lang="ts">
/*
 * Shipped for, and how I work. Layout family: marquee plus an asymmetric quote block.
 *
 * This is where a testimonial carousel would normally go. There are no
 * testimonials on this site because there are no real ones to quote, and inventing
 * praise from invented clients is the one thing on a portfolio that cannot be
 * walked back. What is here instead is real on both halves: the products the work
 * actually shipped into, and three commitments quoted verbatim from the
 * repositories' own documentation, each with its source named.
 *
 * The marquee is the only one on the page. A second scrolling band would read as
 * filler.
 */
import { shipped, principles } from '~/data/content'

const track = ref<HTMLElement | null>(null)

const root = useScene(({ gsap, root, onCleanup }) => {
  gsap.to(root.querySelectorAll('[data-reveal="up"]'), {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.09,
    ease: 'expo.out',
    scrollTrigger: { trigger: root, start: 'top 78%', once: true },
  })

  if (!track.value) return

  /* The list is rendered twice. Travelling exactly -50% lands the second copy
     where the first started, so the loop has no seam and needs no measurement. */
  const drift = gsap.to(track.value, {
    xPercent: -50,
    ease: 'none',
    duration: 32,
    repeat: -1,
  })

  // Slow rather than stop, so the band still reads as live while being read.
  const slow = () => gsap.to(drift, { timeScale: 0.15, duration: 0.6 })
  const resume = () => gsap.to(drift, { timeScale: 1, duration: 0.8 })
  track.value.addEventListener('pointerenter', slow)
  track.value.addEventListener('pointerleave', resume)
  onCleanup(() => {
    track.value?.removeEventListener('pointerenter', slow)
    track.value?.removeEventListener('pointerleave', resume)
  })
})
</script>

<template>
  <section ref="root" class="py-28 md:py-40">
    <div class="shell">
      <h2 data-reveal="up" class="display-md max-w-[24ch]">Products this went into.</h2>
    </div>

    <!-- Decorative duplicate is hidden from assistive tech, so the names are not
         announced twice. -->
    <div class="marquee mt-12 md:mt-16">
      <div ref="track" class="marquee__track">
        <ul v-for="copy in 2" :key="copy" class="marquee__row" :aria-hidden="copy === 2">
          <li v-for="(item, i) in shipped" :key="`${copy}-${item.name}`" class="chip" :style="{ '--tilt': `${(i % 3) - 1}deg` }">
            <BrandMark
              :logo="item.logo"
              :monogram="item.monogram"
              :plate="item.plate"
              :name="copy === 1 ? item.name : ''"
              size="1.9rem"
            />
            <span class="chip__name">{{ item.name }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="shell mt-24 md:mt-32">
      <h2 data-reveal="up" class="display-md max-w-[20ch]">How I work.</h2>

      <!-- Asymmetric 1 + 2: the lead commitment is given the larger measure. -->
      <div class="mt-12 grid gap-10 md:mt-16 md:grid-cols-12">
        <blockquote data-reveal="up" class="principle principle--lead md:col-span-7">
          <p class="principle__quote principle__quote--lead">
            &ldquo;{{ principles[0]!.quote }}&rdquo;
          </p>
          <footer class="principle__foot">
            <span class="principle__note">{{ principles[0]!.note }}</span>
            <cite class="principle__source">From the {{ principles[0]!.source }} docs</cite>
          </footer>
        </blockquote>

        <div class="grid gap-8 md:col-span-5 md:col-start-8">
          <blockquote
            v-for="principle in principles.slice(1)"
            :key="principle.source"
            data-reveal="up"
            class="principle"
          >
            <p class="principle__quote">&ldquo;{{ principle.quote }}&rdquo;</p>
            <footer class="principle__foot">
              <span class="principle__note">{{ principle.note }}</span>
              <cite class="principle__source">From the {{ principle.source }} docs</cite>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.marquee {
  overflow: hidden;
  border-block: 1px solid var(--line);
  padding-block: 1.75rem;
  /* Feathered edges, so items enter and leave rather than appearing at a hard cut. */
  mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent);
}

.marquee__track {
  display: flex;
  width: max-content;
  will-change: transform;
}

.marquee__row {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-right: 1rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 1.15rem;
  background: var(--color-surface);
  border: 1px solid var(--line);
  /* The slight per-item tilt the brief asks for, from a deterministic pattern
     rather than a random value, so it does not reshuffle on every render. */
  transform: rotate(var(--tilt, 0deg));
  transition:
    transform 0.5s var(--ease-cine),
    border-color 0.5s var(--ease-cine);
}
.chip:hover {
  transform: rotate(0deg) translateY(-2px);
  border-color: rgb(124 92 255 / 0.5);
}

.chip__name {
  font-size: 0.9375rem;
  font-weight: 500;
  white-space: nowrap;
}

.principle {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

.principle__quote {
  font-weight: 500;
  font-size: 1.25rem;
  line-height: 1.5;
  letter-spacing: -0.02em;
  text-wrap: balance;
}

.principle__quote--lead {
  font-size: clamp(1.6rem, 3.4vw, 2.5rem);
  line-height: 1.28;
  letter-spacing: -0.035em;
}

.principle__foot {
  margin-top: auto;
  display: grid;
  gap: 0.4rem;
}

.principle__note {
  font-size: 0.9375rem;
  color: var(--color-muted);
}

.principle__source {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-style: normal;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-faint);
}

@media (prefers-reduced-motion: reduce) {
  /* No drift. The band becomes a normal horizontally scrollable row. */
  .marquee {
    overflow-x: auto;
  }
  .marquee__track {
    transform: none !important;
  }
  /* The duplicate only exists to close the loop. With no loop it is repetition. */
  .marquee__row[aria-hidden='true'] {
    display: none;
  }
  .chip {
    transform: none;
  }
}
</style>
