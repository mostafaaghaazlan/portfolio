<script setup lang="ts">
/*
 * Project detail.
 *
 * Prerendered for all six projects: the panels on the home page link here, and
 * `nitro.prerender.crawlLinks` follows them, so every route is static HTML with
 * its own title, description and canonical.
 *
 * Layout families here are chosen not to repeat the home page: a stacked title
 * block, a plain metrics rule, a two column highlight list, and long-form prose.
 * No sticky-stack, no marquee, no tilt grid.
 */
import { projects, profile } from '~/data/content'

const route = useRoute()
const slug = computed(() => String(route.params.slug))

const index = computed(() => projects.findIndex((p) => p.slug === slug.value))
const project = computed(() => projects[index.value])

// A bad slug is a 404, not an empty page. Thrown during prerender and on the
// client alike.
if (index.value === -1) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const next = computed(() => projects[(index.value + 1) % projects.length]!)
const previous = computed(
  () => projects[(index.value - 1 + projects.length) % projects.length]!,
)

useHead({ title: `${project.value!.title}, ${project.value!.subtitle}` })
useSeoMeta({
  description: () => project.value!.summary,
  ogTitle: () => `${project.value!.title} / ${profile.name}`,
  ogDescription: () => project.value!.summary,
})

const heading = ref<HTMLElement | null>(null)

const root = useScene(({ gsap, root, onCleanup }) => {
  const split = heading.value ? splitLines(heading.value) : null
  if (split) onCleanup(split.revert)

  gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .fromTo(split?.words ?? [], maskHidden(), { yPercent: 0, duration: 1.2, stagger: 0.03 }, 0)
    .to(root.querySelectorAll('[data-lead]'), { opacity: 1, y: 0, duration: 1, stagger: 0.09 }, 0.25)

  gsap.utils.toArray<HTMLElement>('[data-block]', root).forEach((block) => {
    gsap.to(block.querySelectorAll('[data-reveal="up"]'), {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.08,
      ease: 'expo.out',
      scrollTrigger: { trigger: block, start: 'top 84%', once: true },
    })
  })
})
</script>

<template>
  <article v-if="project" ref="root">
    <!-- Title block. Stacked, not split: About on the home page owns the split. -->
    <header class="shell pt-32 pb-16 md:pt-40 md:pb-24">
      <NuxtLink to="/#work" class="back">
        <Icon name="ph:arrow-left" aria-hidden="true" />
        All work
      </NuxtLink>

      <p data-lead data-reveal="up" class="mt-12 project__kicker">{{ project.subtitle }}</p>

      <h1 ref="heading" class="display-xl mt-5">{{ project.title }}</h1>

      <p data-lead data-reveal="up" class="mt-9 max-w-[56ch] text-xl leading-relaxed text-muted">
        {{ project.summary }}
      </p>

      <div data-lead data-reveal="up" class="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
        <span
          v-for="tag in project.tags"
          :key="tag"
          class="tag"
        >{{ tag }}</span>
      </div>
    </header>

    <!-- The project's own mark, oversized. The only visual asset that is genuinely
         its own, so it carries this band rather than a stock photograph. The mark
         goes through BrandMark so it lands on the plate its ink needs; dropped
         straight onto the dark band, the mid tone logos wash out. -->
    <div class="shell">
      <div class="plate">
        <BrandMark
          :logo="project.logo"
          :monogram="project.monogram"
          :plate="project.plate"
          :name="project.title"
          size="clamp(6rem, 15vw, 11rem)"
        />
      </div>
    </div>

    <!-- Metrics. Real counts and real dates, hairline separated, no cards. -->
    <div data-block class="shell py-20 md:py-28">
      <dl class="hairline grid grid-cols-2 gap-y-8 pt-8 md:grid-cols-4">
        <div data-reveal="up">
          <dt class="label">Role</dt>
          <dd class="mt-2 text-[0.9375rem]">{{ project.role }}</dd>
        </div>
        <div v-for="metric in project.metrics" :key="metric.label" data-reveal="up">
          <dt class="label">{{ metric.label }}</dt>
          <dd class="mt-2 text-[0.9375rem] tabular-nums">{{ metric.value }}</dd>
        </div>
      </dl>
    </div>

    <!-- Long-form prose. -->
    <div
      v-for="block in project.sections"
      :key="block.heading"
      data-block
      class="shell pb-20 md:pb-28"
    >
      <div class="grid gap-8 md:grid-cols-12 md:gap-16">
        <h2 data-reveal="up" class="display-md md:col-span-4">{{ block.heading }}</h2>
        <div class="grid gap-6 md:col-span-7 md:col-start-6">
          <p
            v-for="paragraph in block.body"
            :key="paragraph"
            data-reveal="up"
            class="max-w-[64ch] text-lg leading-relaxed text-muted"
          >
            {{ paragraph }}
          </p>
        </div>
      </div>
    </div>

    <!-- Highlights, as a two column list rather than a bulleted run of rows. -->
    <div data-block class="shell pb-24 md:pb-32">
      <h2 data-reveal="up" class="display-md">Worth pointing at.</h2>
      <ul class="mt-10 grid gap-x-16 gap-y-8 md:grid-cols-2">
        <li
          v-for="line in project.highlights"
          :key="line"
          data-reveal="up"
          class="highlight"
        >
          {{ line }}
        </li>
      </ul>
    </div>

    <!-- Prev and next. Two panels, so the page never dead ends. -->
    <nav class="hairline grid md:grid-cols-2" aria-label="Other projects">
      <NuxtLink :to="`/work/${previous.slug}`" class="pager" data-cursor="Previous">
        <span class="label">Previous</span>
        <span class="pager__title">{{ previous.title }}</span>
      </NuxtLink>
      <NuxtLink :to="`/work/${next.slug}`" class="pager pager--next" data-cursor="Next">
        <span class="label">Next</span>
        <span class="pager__title">{{ next.title }}</span>
      </NuxtLink>
    </nav>
  </article>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-muted);
  transition: color 0.4s var(--ease-cine);
}
.back:hover {
  color: var(--color-accent);
}

.project__kicker {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-accent);
}

/* Parked state comes from `data-reveal` in main.css. Do not add `opacity: 0`. */
.tag {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-faint);
}

.plate {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 16 / 7;
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--line);
}
.plate::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(70% 90% at 50% 120%, rgb(124 92 255 / 0.28), transparent 70%);
}
.plate > * {
  position: relative;
}

.highlight {
  padding-top: 1.25rem;
  border-top: 1px solid var(--line);
  font-size: 1.0625rem;
  line-height: 1.6;
}

.pager {
  display: grid;
  gap: 0.75rem;
  padding: 3rem 1.25rem;
  transition: background-color 0.5s var(--ease-cine);
}
@media (min-width: 768px) {
  .pager {
    padding: 4rem 2.5rem;
  }
  .pager--next {
    border-left: 1px solid var(--line);
    text-align: right;
  }
}
@media (max-width: 767px) {
  .pager--next {
    border-top: 1px solid var(--line);
  }
}
.pager:hover {
  background: rgb(124 92 255 / 0.07);
}

.pager__title {
  font-weight: 600;
  font-size: clamp(1.75rem, 4.5vw, 2.75rem);
  letter-spacing: -0.035em;
}
</style>
