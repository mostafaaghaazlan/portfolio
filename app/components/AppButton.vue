<script setup lang="ts">
/*
 * The site's only button. Two variants, one shape, one accent.
 *
 * Magnetism: the label is pulled a few pixels toward the pointer while it is over
 * the control, which makes a click feel met rather than received. Driven by
 * gsap.quickTo against the element, never through reactive state, because this
 * fires on every pointer move.
 *
 * Contrast: `solid` is accent-on-ink at 4.5:1, `ghost` is near white on ink at
 * 19:1 with a visible 1px stroke so it never floats unbounded on the WebGL
 * background. Labels are kept to three words so nothing wraps at desktop.
 */
interface Props {
  to?: string
  href?: string
  type?: 'button' | 'submit'
  variant?: 'solid' | 'ghost'
  /** Label the cursor follower shows while hovering. */
  cursor?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ghost',
  type: 'button',
})

const el = ref<HTMLElement | null>(null)
const inner = ref<HTMLElement | null>(null)
let teardown: (() => void) | null = null

/*
 * `to` is an internal route and is rendered through `link()`, which prepends the
 * deployment base path. A raw `href="/#work"` would point at the domain root and
 * leave the site whenever it is served from a subdirectory. The click handler below
 * still reads the unprefixed prop, which is what it wants: it only needs the fragment.
 */

// Anchors that point at an id on this page are handed to Lenis instead of the
// browser, so the jump is smoothed like every other scroll.
const isHashOnPage = computed(() => !!props.to?.includes('#'))

function onClick(event: MouseEvent) {
  if (!props.to || !isHashOnPage.value) return
  const id = props.to.slice(props.to.indexOf('#'))
  const target = document.querySelector(id)
  if (!target) return
  event.preventDefault()
  scrollToTarget(target as HTMLElement, -72)
  history.replaceState(null, '', id)
}

onMounted(() => {
  if (!motionOk() || !window.matchMedia('(pointer: fine)').matches) return
  const host = el.value
  const label = inner.value
  if (!host || !label) return

  const { gsap } = useGsap()
  const toX = gsap.quickTo(label, 'x', { duration: 0.4, ease: 'power3.out' })
  const toY = gsap.quickTo(label, 'y', { duration: 0.4, ease: 'power3.out' })

  /*
   * The box is measured once on enter, not on every move.
   *
   * getBoundingClientRect forces the browser to flush pending layout before it can
   * answer, so calling it inside a pointermove handler triggers a synchronous
   * reflow on every single event. The control cannot change size while the pointer
   * is inside it, so one measurement per hover is all that is needed.
   */
  let box: DOMRect | null = null

  const onEnter = () => {
    box = host.getBoundingClientRect()
  }

  const onMove = (event: PointerEvent) => {
    if (!box) box = host.getBoundingClientRect()
    // Clamped to a fraction of the box, so the label can never escape its own
    // control however fast the pointer crosses it.
    toX((event.clientX - (box.left + box.width / 2)) * 0.28)
    toY((event.clientY - (box.top + box.height / 2)) * 0.34)
  }
  const onLeave = () => {
    box = null
    toX(0)
    toY(0)
  }

  host.addEventListener('pointerenter', onEnter)
  host.addEventListener('pointermove', onMove, { passive: true })
  host.addEventListener('pointerleave', onLeave)

  teardown = () => {
    host.removeEventListener('pointerenter', onEnter)
    host.removeEventListener('pointermove', onMove)
    host.removeEventListener('pointerleave', onLeave)
    gsap.killTweensOf(label)
  }
})

onBeforeUnmount(() => {
  teardown?.()
  teardown = null
})
</script>

<template>
  <component
    :is="to ? 'a' : href ? 'a' : 'button'"
    ref="el"
    :href="to ? link(to) : href"
    :type="to || href ? undefined : type"
    :target="href ? '_blank' : undefined"
    :rel="href ? 'noreferrer noopener' : undefined"
    :disabled="to || href ? undefined : disabled"
    :data-cursor="cursor || undefined"
    class="btn"
    :class="`btn--${variant}`"
    @click="onClick"
  >
    <span ref="inner" class="btn__label">
      <slot />
    </span>
  </component>
</template>

<!-- Styles for .btn live in assets/css/main.css, not here. See the note in that
     file: as a component used across every page this one's scoped sheet became a
     render-blocking request, so it was folded into the inlined global sheet. -->
