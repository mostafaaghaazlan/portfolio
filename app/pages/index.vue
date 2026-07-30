<script setup lang="ts">
/*
 * Home.
 *
 * Section order is a narrative, not a menu: who, then proof, then breadth, then
 * tools, then history, then what I will take on, then where it went, then how to
 * reach me.
 *
 * Every section uses a different layout family, in this order: asymmetric
 * editorial hero, image and text split, sticky-stack, horizontal pan, tilt grid,
 * scrubbed rail, expanding rows, marquee with an asymmetric quote block, and
 * statement with a form. Nine sections, nine families, so nothing on the page
 * rhymes with anything else.
 *
 * Eyebrow budget: nine sections allows three. Two are used, on the hero role line
 * and Selected work. Every other section leads with its heading.
 */
</script>

<template>
  <div>
    <SectionHero />
    <SectionAbout />
    <SectionWork />
    <SectionIndex />
    <SectionStack />
    <SectionTimeline />
    <SectionServices />
    <SectionShipped />
    <SectionContact />
  </div>
</template>
