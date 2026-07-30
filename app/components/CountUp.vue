<script setup lang="ts">
/*
 * Counts a real figure up when it scrolls into view.
 *
 * The final value is what renders on the server and what sits in the DOM before
 * any animation, so the number is correct for search engines, for reduced motion
 * and if JS never arrives. The tween only ever replaces text that is already
 * right.
 *
 * `tabular-nums` is set by the caller. Without it the digits change width mid
 * count and the whole row jitters.
 */
const props = defineProps<{ value: string }>()

// Only the leading number is animated; any suffix is kept verbatim, so '2,800+'
// counts to 2800 and keeps its plus.
const parsed = computed(() => {
  const match = props.value.match(/^([\d,.]+)(.*)$/)
  if (!match) return null
  const numeric = Number(match[1]!.replace(/,/g, ''))
  return Number.isFinite(numeric) ? { numeric, suffix: match[2] ?? '' } : null
})

const root = useScene(({ gsap, root }) => {
  const target = parsed.value
  if (!target) return

  const counter = { n: 0 }
  gsap.to(counter, {
    n: target.numeric,
    duration: 2.1,
    ease: 'expo.out',
    onUpdate: () => {
      root.textContent = Math.round(counter.n).toLocaleString('en-US') + target.suffix
    },
    scrollTrigger: { trigger: root, start: 'top 88%', once: true },
  })
})
</script>

<template>
  <span ref="root">{{ value }}</span>
</template>
