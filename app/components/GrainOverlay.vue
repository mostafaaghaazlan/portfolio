<script setup lang="ts">
/*
 * Film grain and vignette.
 *
 * Deliberately a single fixed, pointer-events-none layer. Putting a grain filter
 * on scrolling content forces a full GPU repaint every frame and costs more than
 * the whole rest of the page put together on mobile.
 *
 * The grain itself is an SVG feTurbulence data URI rather than an image request:
 * it is about 300 bytes, needs no network round trip, and tiles without a seam.
 */
const grain =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")"
</script>

<template>
  <div class="grain" aria-hidden="true" :style="{ '--grain': grain }" />
</template>

<style scoped>
/* z-60. Above content, below the route curtain. */
.grain {
  position: fixed;
  inset: 0;
  z-index: 60;
  pointer-events: none;
  /* Vignette first, so the corners fall away and the centre stays readable. */
  background:
    radial-gradient(120% 80% at 50% 0%, transparent 40%, rgb(0 0 0 / 0.55) 100%),
    var(--grain);
  background-size: cover, 160px 160px;
  opacity: 0.5;
  mix-blend-mode: soft-light;
}
</style>
