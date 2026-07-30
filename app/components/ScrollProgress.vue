<script setup lang="ts">
/*
 * Reading progress hairline, pinned to the top edge.
 *
 * Driven by a single scrubbed ScrollTrigger over the document rather than a
 * scroll listener, so it batches with every other trigger on the page and costs
 * one transform per frame.
 *
 * z-index scale used across the site, documented once here:
 *    0  WebGL field
 *   10  page content
 *   40  header
 *   50  cursor follower and this bar
 *   60  grain
 *   70  route curtain
 *   80  preloader
 *   90  skip link
 */
const bar = ref<HTMLElement | null>(null)

const root = useScene(({ gsap, root }) => {
  gsap.set(bar.value, { scaleX: 0, transformOrigin: 'left center' })
  gsap.to(bar.value, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.35,
      invalidateOnRefresh: true,
    },
  })
  void root
})
</script>

<template>
  <div ref="root" class="progress" aria-hidden="true">
    <span ref="bar" class="progress__bar" />
  </div>
</template>

<style scoped>
.progress {
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 50;
  height: 2px;
  pointer-events: none;
  background: var(--line);
}
.progress__bar {
  display: block;
  height: 100%;
  width: 100%;
  background: var(--color-accent);
  transform: scaleX(0);
}
</style>
