<script setup lang="ts">
/*
 * What I do. Layout family: expanding rows.
 *
 * Four rows rather than four cards. Cards here would put a box around text that
 * is already grouped by a hairline, and would force every row to the height of
 * the longest one.
 *
 * It is a real disclosure widget, not a hover reveal: a button with
 * `aria-expanded`, a region with an id, and keyboard operation for free. Height is
 * animated from GSAP's measured `auto` rather than a guessed pixel value, so a row
 * cannot clip its own content at a narrow width.
 */
import { services } from '~/data/content'

// One open at a time. The rows are alternatives, not a checklist, and four open
// at once would push the last one off screen.
const openIndex = ref(0)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? -1 : index
}

const root = useScene(({ gsap, root }) => {
  gsap.to(root.querySelectorAll('[data-reveal="up"]'), {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.08,
    ease: 'expo.out',
    scrollTrigger: { trigger: root, start: 'top 80%', once: true },
  })

  gsap.to(root.querySelectorAll('[data-row]'), {
    opacity: 1,
    y: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: 'expo.out',
    scrollTrigger: { trigger: root.querySelector('[data-rows]'), start: 'top 84%', once: true },
  })
})

/* Vue transition hooks, driven by GSAP so the easing matches everything else. */
function onEnter(el: Element, done: () => void) {
  if (!motionOk()) return done()
  const { gsap } = useGsap()
  gsap.fromTo(
    el,
    { height: 0, opacity: 0 },
    { height: 'auto', opacity: 1, duration: 0.62, ease: 'expo.out', onComplete: done },
  )
}

function onLeave(el: Element, done: () => void) {
  if (!motionOk()) return done()
  const { gsap } = useGsap()
  gsap.to(el, { height: 0, opacity: 0, duration: 0.42, ease: 'expo.inOut', onComplete: done })
}
</script>

<template>
  <section ref="root" class="shell py-28 md:py-40">
    <h2 data-reveal="up" class="display-md max-w-[22ch]">What I take on.</h2>

    <div data-rows class="mt-14 md:mt-20">
      <div
        v-for="(service, index) in services"
        :key="service.title"
        data-row
        data-reveal="up"
        class="row"
        :class="{ 'row--open': openIndex === index }"
      >
        <h3>
          <button
            class="row__head"
            :aria-expanded="openIndex === index"
            :aria-controls="`service-${index}`"
            @click="toggle(index)"
          >
            <Icon :name="service.icon" class="row__icon" aria-hidden="true" />
            <span class="row__title">{{ service.title }}</span>
            <Icon name="ph:plus" class="row__sign" aria-hidden="true" />
          </button>
        </h3>

        <Transition :css="false" @enter="onEnter" @leave="onLeave">
          <div v-show="openIndex === index" :id="`service-${index}`" class="row__panel">
            <div class="row__panel-inner">
              <p class="row__body">{{ service.body }}</p>
              <ul class="row__detail">
                <li v-for="line in service.detail" :key="line">{{ line }}</li>
              </ul>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Parked state comes from `data-reveal` in main.css. Do not add `opacity: 0`. */
.row {
  border-top: 1px solid var(--line);
  transition: background-color 0.5s var(--ease-cine);
}
/* Only the last row closes the group, so there is no doubled hairline between
   rows. */
.row:last-child {
  border-bottom: 1px solid var(--line);
}

.row:hover,
.row--open {
  background: linear-gradient(to right, rgb(124 92 255 / 0.07), transparent 65%);
}

.row__head {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.25rem;
  width: 100%;
  padding: 1.6rem 0;
  text-align: left;
  cursor: pointer;
}
@media (min-width: 768px) {
  .row__head {
    gap: 1.75rem;
    padding: 2.1rem 0;
  }
}

.row__icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-muted);
  transition:
    transform 0.6s var(--ease-cine),
    color 0.45s var(--ease-cine);
}
.row:hover .row__icon,
.row--open .row__icon {
  color: var(--color-accent);
  transform: translateY(-2px) rotate(-8deg) scale(1.1);
}

.row__title {
  font-weight: 600;
  font-size: clamp(1.35rem, 3.1vw, 2.1rem);
  letter-spacing: -0.03em;
}

.row__sign {
  width: 1.1rem;
  height: 1.1rem;
  color: var(--color-faint);
  transition:
    transform 0.55s var(--ease-cine),
    color 0.45s var(--ease-cine);
}
.row--open .row__sign {
  transform: rotate(135deg);
  color: var(--color-accent);
}

.row__panel {
  overflow: hidden;
}

.row__panel-inner {
  display: grid;
  gap: 2rem;
  padding: 0 0 2.25rem;
}
@media (min-width: 768px) {
  .row__panel-inner {
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    padding-left: 3.25rem;
  }
}

.row__body {
  max-width: 48ch;
  font-size: 1.0625rem;
  line-height: 1.65;
  color: var(--color-muted);
}

.row__detail {
  display: grid;
  gap: 0.65rem;
  align-content: start;
  font-size: 0.9375rem;
  color: var(--color-fg);
}
</style>
