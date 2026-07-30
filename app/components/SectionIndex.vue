<script setup lang="ts">
/*
 * Project index. Layout family: horizontal scroll pan.
 *
 * There are sixteen further repositories worth naming. As a vertical list with a
 * hairline under every row that would be the dullest block on the page, so
 * instead vertical scroll drives a horizontal pan across four grouped panels.
 * Breadth reads as breadth, and the section costs one screen of height.
 *
 * The pan only exists from 1024px up. Below that it is a plain vertical stack:
 * hijacking scroll direction on a touch device fights the gesture the visitor is
 * already making. `gsap.matchMedia` builds and tears the whole scene down at the
 * breakpoint, so nothing is left pinned when a window is resized across it.
 */
import { indexGroups } from '~/data/content'

const wrap = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)

const root = useScene(({ gsap, root, onCleanup }) => {
  gsap.to(root.querySelectorAll('[data-reveal="up"]'), {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.08,
    ease: 'expo.out',
    scrollTrigger: { trigger: root, start: 'top 78%', once: true },
  })

  const mm = gsap.matchMedia()
  onCleanup(() => mm.revert())

  mm.add('(min-width: 1024px)', () => {
    if (!wrap.value || !track.value) return

    // Recomputed on refresh rather than captured once, so a font swap or a
    // resize cannot leave the pan ending short of the last panel.
    const distance = () => track.value!.scrollWidth - window.innerWidth

    gsap.to(track.value, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: wrap.value,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    })
  })
})
</script>

<template>
  <section ref="root" class="py-28 md:py-40">
    <div class="shell">
      <h2 data-reveal="up" class="display-md max-w-[30ch]">
        And the rest of it, grouped by what it does.
      </h2>
      <p data-reveal="up" class="mt-6 max-w-[58ch] text-lg leading-relaxed text-muted">
        Sixteen more repositories: platforms, phone apps, developer tools and web work.
      </p>
    </div>

    <div ref="wrap" class="mt-16 lg:mt-24 lg:h-[100dvh] lg:overflow-hidden">
      <div ref="track" class="track">
        <div v-for="group in indexGroups" :key="group.title" class="panel">
          <h3 class="panel__title">{{ group.title }}</h3>

          <ul class="mt-8 grid gap-7">
            <li v-for="item in group.items" :key="item.name" class="item">
              <BrandMark
                :logo="item.logo"
                :monogram="item.monogram"
                :plate="item.plate"
                :name="item.name"
                size="2.5rem"
              />
              <span>
                <span class="item__name">{{ item.name }}</span>
                <span class="item__note">{{ item.note }}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.track {
  display: flex;
  flex-direction: column;
  gap: 3.5rem;
  padding-inline: 1.25rem;
}

@media (min-width: 768px) {
  .track {
    padding-inline: 2.5rem;
  }
}

@media (min-width: 1024px) {
  .track {
    flex-direction: row;
    /* stretch, not center. Centering each panel individually left every group
       title at a different height, because the groups hold different numbers of
       items, and the row read as unmoored. Equal height panels align the titles
       and let the dividers run the full height as vertical rules. */
    align-items: stretch;
    gap: 0;
    height: 100%;
    padding-inline: 0;
    will-change: transform;
  }
}

.panel {
  flex: none;
}

@media (min-width: 1024px) {
  .panel {
    width: min(46vw, 620px);
    /* Vertical padding does the centring that align-items used to, once, for the
       whole row rather than per panel. */
    padding: clamp(3rem, 13dvh, 8rem) clamp(2rem, 4vw, 4rem);
    border-left: 1px solid var(--line);
  }
  /* Bookends, so the first panel starts inside the shell and the last one has
     room to finish rather than stopping flush against the edge. */
  .panel:first-child {
    margin-left: clamp(1.25rem, 4vw, 4rem);
    border-left: 0;
  }
  .panel:last-child {
    margin-right: clamp(1.25rem, 6vw, 8rem);
  }
}

.panel__title {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.item {
  display: grid;
  grid-template-columns: 2.5rem 1fr;
  gap: 1rem;
  align-items: start;
}

.item__name {
  display: block;
  font-size: 1.0625rem;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.item__note {
  display: block;
  margin-top: 0.35rem;
  max-width: 44ch;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: var(--color-muted);
}
</style>
