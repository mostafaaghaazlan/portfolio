<script setup lang="ts">
/*
 * Hero. Layout family: asymmetric editorial.
 *
 * Structure is deliberately not centred: the headline runs the full shell width,
 * and the supporting copy sits offset into the right half beneath it. That offset
 * is the composition; nothing here is symmetrical.
 *
 * Four text elements, which is the ceiling: the role line, the headline, the
 * lede, the buttons. No trust strip, no tagline under the CTAs, no locale
 * readout, no version pill.
 *
 * The opening timeline is built paused and waits on `introDone`, so the loader
 * panel clearing and the headline rising are one move rather than two.
 */
import { profile, cta } from '~/data/content'

const introDone = useIntroDone()

/*
 * With the intro disabled the headline must be readable in the server rendered
 * HTML, so it is neither split nor masked and no element here carries a reveal
 * attribute. That makes the hero itself the Largest Contentful Paint at first
 * paint instead of the loader. See runtimeConfig.public.intro.
 */
const intro = useRuntimeConfig().public.intro as boolean

const heading = ref<HTMLElement | null>(null)
const roleEl = ref<HTMLElement | null>(null)
const ledeEl = ref<HTMLElement | null>(null)
const actionsEl = ref<HTMLElement | null>(null)
const cueEl = ref<HTMLElement | null>(null)

const root = useScene(({ gsap, root, onCleanup }) => {
  const split = intro && heading.value ? splitLines(heading.value) : null
  if (split) onCleanup(split.revert)

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })

  tl.to(roleEl.value, { opacity: 1, duration: 0.9 }, 0)
    .fromTo(split?.words ?? [], maskHidden(), { yPercent: 0, duration: 1.25, stagger: 0.022 }, 0.1)
    .to(ledeEl.value, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1 }, 0.75)
    // CTAs last, per the brief, and as the thing the eye should land on.
    .to(actionsEl.value, { opacity: 1, y: 0, duration: 0.9 }, 0.95)
    .to(cueEl.value, { opacity: 1, duration: 0.8 }, 1.2)

  if (introDone.value) tl.play()
  else watch(introDone, (ready) => ready && tl.play(), { once: true })

  // Parallax on the whole block. The copy drifts up slower than the scroll, so
  // the section below appears to slide over it rather than after it.
  gsap.to(root.querySelector('[data-hero-inner]'), {
    yPercent: -14,
    opacity: 0.25,
    ease: 'none',
    scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
  })
})
</script>

<template>
  <section ref="root" class="relative flex min-h-[100dvh] items-center overflow-hidden">
    <div data-hero-inner class="shell w-full pt-24 pb-28">
      <!-- Eyebrow 1 of 2 site wide. The other is on Selected work. -->
      <p ref="roleEl" :data-reveal="intro ? 'fade' : undefined" class="label">
        {{ profile.role }}
      </p>

      <h1 ref="heading" class="display-xl mt-7 max-w-[20ch] md:max-w-none">
        {{ profile.headline }}
      </h1>

      <!-- The asymmetry: supporting copy pushed into the right half. -->
      <div class="mt-12 grid gap-10 md:mt-16 md:grid-cols-12">
        <div class="md:col-start-6 md:col-end-13 lg:col-start-7">
          <p
            ref="ledeEl"
            :data-reveal="intro ? 'up-blur' : undefined"
            class="max-w-[46ch] text-lg leading-relaxed text-muted md:text-xl"
          >
            {{ profile.lede }}
          </p>

          <div
            ref="actionsEl"
            :data-reveal="intro ? 'up' : undefined"
            class="mt-9 flex flex-wrap items-center gap-4"
          >
            <AppButton :to="cta.work.href" variant="solid" cursor="Work">
              {{ cta.work.label }}
            </AppButton>
            <AppButton :to="cta.contact.href" variant="ghost">
              {{ cta.contact.label }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Continuous scroll cue. A travelling hairline, no wording: at the top of a
         full height page the gesture needs no label. -->
    <div ref="cueEl" data-reveal="fade" class="cue" aria-hidden="true">
      <span class="cue__travel" />
    </div>
  </section>
</template>

<style scoped>
.cue {
  position: absolute;
  bottom: 2rem;
  left: 1.25rem;
  width: 1px;
  height: 4.5rem;
  overflow: hidden;
  background: var(--line);
}

@media (min-width: 768px) {
  .cue {
    left: 2.5rem;
  }
}
@media (min-width: 1280px) {
  .cue {
    left: 4rem;
  }
}

.cue__travel {
  position: absolute;
  inset-inline: 0;
  top: 0;
  height: 45%;
  background: linear-gradient(to bottom, transparent, var(--color-accent));
  animation: cue-travel 2.4s var(--ease-cine) infinite;
}

@keyframes cue-travel {
  0% {
    transform: translateY(-100%);
  }
  70%,
  100% {
    transform: translateY(240%);
  }
}
</style>
