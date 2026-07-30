<script setup lang="ts">
/*
 * Header. 68px tall, one line at every desktop width.
 *
 * It retracts on the way down and returns on the way up, because the sections
 * below are full height compositions and a permanent bar clips them. Direction
 * comes from ScrollTrigger's own `direction`, not a scroll listener, so it
 * batches with everything else on the page.
 *
 * Contact is reachable only through the CTA. There is no second 'Contact' link in
 * the list, because one destination with two controls is a coin toss for the
 * visitor and a split funnel for the owner.
 */
import { nav, cta, profile } from '~/data/content'

const open = ref(false)
const bar = ref<HTMLElement | null>(null)
const sheet = ref<HTMLElement | null>(null)
const route = useRoute()

const root = useScene(({ gsap, ScrollTrigger }) => {
  const show = gsap.quickTo(bar.value, 'yPercent', { duration: 0.45, ease: 'power3.out' })

  ScrollTrigger.create({
    start: 'top -8%',
    end: 'max',
    onUpdate: (self) => {
      // Never hide while the mobile sheet is open, or its close button leaves
      // with it.
      if (open.value) return show(0)
      show(self.direction === 1 ? -100 : 0)
    },
    onLeaveBack: () => show(0),
  })
})

/* Smooth in-page jumps, and close the sheet on the way. */
function go(event: MouseEvent, href: string) {
  open.value = false
  const hash = href.slice(href.indexOf('#'))
  if (!href.includes('#') || route.path !== '/') return
  const target = document.querySelector(hash)
  if (!target) return
  event.preventDefault()
  scrollToTarget(target as HTMLElement, -68)
  history.replaceState(null, '', hash)
}

/* The sheet takes over the viewport, so scrolling behind it has to stop. */
watch(open, (isOpen) => {
  setScrollLocked(isOpen)
  if (!motionOk() || !sheet.value) return
  const { gsap } = useGsap()
  const items = sheet.value.querySelectorAll('[data-sheet-item]')
  if (isOpen) {
    gsap
      .timeline()
      .set(sheet.value, { display: 'grid' })
      .fromTo(sheet.value, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'expo.inOut' })
      .from(items, { yPercent: 110, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'expo.out' }, 0.25)
  } else {
    gsap.to(sheet.value, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.5,
      ease: 'expo.inOut',
      onComplete: () => gsap.set(sheet.value, { display: 'none' }),
    })
  }
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  setScrollLocked(false)
})
</script>

<template>
  <div ref="root">
    <header ref="bar" class="header">
      <div class="shell flex h-[68px] items-center justify-between gap-8">
        <!-- No aria-label here on purpose. An aria-label of "Mostafa Ghazlan,
             home" overrode the visible text and did not contain the visible "MG",
             which is a label-content-name-mismatch failure: a speech-input user
             saying what they can see would not match the control. The monogram is
             decorative because it repeats the name beside it, so the accessible
             name comes from the visible name alone. -->
        <NuxtLink to="/" class="brand">
          <span class="brand__mark" aria-hidden="true">{{ profile.initials }}</span>
          <span class="brand__name">{{ profile.name }}</span>
        </NuxtLink>

        <nav class="hidden items-center gap-9 lg:flex" aria-label="Sections">
          <!-- link() prepends the deployment base path. A literal "/#work" points at
               the domain root, which leaves the site when it is served from a
               subdirectory. -->
          <a
            v-for="item in nav"
            :key="item.href"
            :href="link(item.href)"
            class="navlink"
            @click="go($event, item.href)"
          >{{ item.label }}</a>
        </nav>

        <div class="hidden lg:block">
          <AppButton :to="cta.contact.href" variant="ghost" class="!px-6 !py-2.5 !text-sm">
            {{ cta.contact.label }}
          </AppButton>
        </div>

        <button
          class="menu-toggle lg:hidden"
          :aria-expanded="open"
          aria-controls="mobile-sheet"
          @click="open = !open"
        >
          <span class="label">{{ open ? 'Close' : 'Menu' }}</span>
        </button>
      </div>
      <div class="header__rule" />
    </header>

    <div id="mobile-sheet" ref="sheet" class="sheet lg:hidden" :aria-hidden="!open">
      <nav class="shell grid gap-2" aria-label="Sections">
        <a
          v-for="item in nav"
          :key="item.href"
          data-sheet-item
          :href="link(item.href)"
          class="sheet__link"
          :tabindex="open ? 0 : -1"
          @click="go($event, item.href)"
        >{{ item.label }}</a>
        <a
          data-sheet-item
          :href="link(cta.contact.href)"
          class="sheet__link sheet__link--accent"
          :tabindex="open ? 0 : -1"
          @click="go($event, cta.contact.href)"
        >{{ cta.contact.label }}</a>
      </nav>
    </div>
  </div>
</template>

<style scoped>
/* z-40. Below the cursor follower and the grain, above content. */
.header {
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--color-ink) 72%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  will-change: transform;
}

/* Solid fill for anyone who has asked the OS to cut transparency. */
@media (prefers-reduced-transparency: reduce) {
  .header {
    background: var(--color-ink);
    backdrop-filter: none;
  }
}

.header__rule {
  height: 1px;
  background: var(--line);
}

.brand {
  display: inline-flex;
  align-items: baseline;
  gap: 0.7rem;
}
.brand__mark {
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: -0.03em;
}
.brand__name {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-muted);
}
@media (max-width: 480px) {
  /* Hidden visually, not removed. `display: none` would take the name out of the
     accessible tree and leave the link with no name at all, since the monogram is
     aria-hidden. This keeps the row to one line and keeps the label. */
  .brand__name {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
}

.navlink {
  position: relative;
  font-size: 0.9375rem;
  color: var(--color-muted);
  transition: color 0.35s var(--ease-cine);
}
.navlink::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -6px;
  width: 100%;
  height: 1px;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 0.45s var(--ease-cine);
}
.navlink:hover {
  color: var(--color-fg);
}
.navlink:hover::after {
  transform: scaleX(1);
}

.menu-toggle {
  padding: 0.5rem 0;
  cursor: pointer;
}

.sheet {
  position: fixed;
  inset: 0;
  z-index: 39;
  display: none;
  align-content: center;
  background: var(--color-ink);
  clip-path: inset(0 0 100% 0);
}

.sheet__link {
  display: block;
  overflow: hidden;
  padding: 0.35rem 0;
  font-weight: 600;
  font-size: clamp(2rem, 11vw, 3.5rem);
  line-height: 1.1;
  letter-spacing: -0.035em;
}
.sheet__link--accent {
  color: var(--color-accent);
}
</style>
