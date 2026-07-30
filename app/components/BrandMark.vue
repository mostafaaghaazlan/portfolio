<script setup lang="ts">
/*
 * A project's mark: its real logo on the plate that logo needs, or a monogram tile
 * when the project has no usable mark of its own.
 *
 * This exists so the plate rule lives in exactly one place. It was previously
 * repeated across four sections, and the moment it is repeated it starts drifting:
 * Wadeni and Bakeet are drawn in mid tone ink and disappear into a dark tile, while
 * Itaq and Termius are drawn in white and disappear into a light one. Getting it
 * wrong does not throw, it just quietly turns the logos to mud.
 *
 * Never substitute another company's brand for a missing mark. A monogram is the
 * honest answer.
 */
import type { Plate } from '~/data/content'

withDefaults(
  defineProps<{
    logo: string | null
    monogram: string
    plate?: Plate
    /** Accessible name. Empty renders the mark decorative, for backdrops. */
    name?: string
    size?: string
  }>(),
  { size: '3.25rem' },
)
</script>

<template>
  <span
    class="mark"
    :class="logo ? `mark--${plate ?? 'dark'}` : 'mark--mono'"
    :style="{ '--mark-size': size }"
  >
    <img
      v-if="logo"
      :src="asset(logo)"
      :alt="name ? `${name} logo` : ''"
      loading="lazy"
      decoding="async"
    />
    <span v-else class="mark__text" aria-hidden="true">{{ monogram }}</span>
  </span>
</template>

<!-- Styles for .mark live in assets/css/main.css, not here. See the note in that
     file: as a component used across every page this one's scoped sheet became a
     render-blocking request, so it was folded into the inlined global sheet. -->
