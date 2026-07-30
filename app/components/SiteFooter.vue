<script setup lang="ts">
/*
 * Footer. Layout family: oversized statement over a metadata rule.
 *
 * The statement is four words, which is why it can carry a far larger scale than
 * the hero headline and still break onto two lines rather than four.
 *
 * The CTA label is the same 'Get in touch' used in the header and the hero. One
 * label per intent, everywhere, so the footer is not competing with the header
 * for the same click under a different name.
 */
import { profile, social, cta } from '~/data/content'

const heading = ref<HTMLElement | null>(null)
const year = new Date().getFullYear()

const root = useScene(({ gsap, root, onCleanup }) => {
  const split = heading.value ? splitLines(heading.value) : null
  if (split) onCleanup(split.revert)

  gsap.fromTo(split?.words ?? [], maskHidden(), {
    yPercent: 0,
    duration: 1.3,
    stagger: 0.03,
    ease: 'expo.out',
    scrollTrigger: { trigger: heading.value, start: 'top 88%', once: true },
  })

  gsap.to(root.querySelectorAll('[data-reveal="up"]'), {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.08,
    ease: 'expo.out',
    scrollTrigger: { trigger: root.querySelector('[data-foot]'), start: 'top 92%', once: true },
  })
})
</script>

<template>
  <footer ref="root" class="hairline">
    <div class="shell py-24 md:py-32">
      <h2 ref="heading" class="display-hero max-w-[16ch]">Let's build something amazing.</h2>

      <div data-foot class="mt-14 md:mt-20">
        <div data-reveal="up">
          <AppButton :to="cta.contact.href" variant="solid">
            {{ cta.contact.label }}
          </AppButton>
        </div>

        <div class="hairline mt-16 grid gap-10 pt-10 md:grid-cols-12">
          <div data-reveal="up" class="md:col-span-5">
            <a class="footer__email" :href="`mailto:${profile.email}`">{{ profile.email }}</a>
            <p class="mt-3 text-sm text-faint">{{ profile.location }}</p>
          </div>

          <nav data-reveal="up" class="md:col-span-4" aria-label="Elsewhere">
            <ul class="grid gap-3">
              <li v-for="item in social" :key="item.label">
                <a
                  class="footer__link"
                  :href="item.href"
                  :rel="item.href.startsWith('http') ? 'noreferrer noopener' : undefined"
                  :target="item.href.startsWith('http') ? '_blank' : undefined"
                >
                  <Icon :name="item.icon" aria-hidden="true" />
                  {{ item.label }}
                </a>
              </li>
            </ul>
          </nav>

          <p data-reveal="up" class="text-sm text-faint md:col-span-3 md:text-right">
            &copy; {{ year }} {{ profile.name }}
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer__email {
  font-size: clamp(1.05rem, 2.2vw, 1.35rem);
  font-weight: 500;
  letter-spacing: -0.02em;
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-decoration-thickness: 1px;
  text-underline-offset: 6px;
  transition: color 0.4s var(--ease-cine);
}
.footer__email:hover {
  color: var(--color-accent);
}

.footer__link {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9375rem;
  color: var(--color-muted);
  transition: color 0.4s var(--ease-cine);
}
.footer__link:hover {
  color: var(--color-fg);
}
</style>
