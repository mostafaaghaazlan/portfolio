<script setup lang="ts">
/*
 * Contact. Layout family: oversized statement plus a hairline form.
 *
 * Honesty about submission: this site is a static export with no server. If
 * NUXT_PUBLIC_CONTACT_ENDPOINT is set at build time the form posts there. If it is
 * not, the form does not fake a send. It opens the visitor's mail client with the
 * message prefilled and tells them that is what happened. A contact form that
 * shows a green tick and drops the message is the worst bug a portfolio can have.
 *
 * Form conventions: label above every input, helper and error below, no
 * placeholder standing in for a label. Every text colour here clears WCAG AA on
 * the ink background, including the placeholders and the helper text.
 */
import { profile } from '~/data/content'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const endpoint = useRuntimeConfig().public.contactEndpoint as string

const form = reactive({ name: '', email: '', message: '' })
const errors = reactive<Record<'name' | 'email' | 'message', string>>({
  name: '',
  email: '',
  message: '',
})
const status = ref<Status>('idle')
const statusNote = ref('')

const heading = ref<HTMLElement | null>(null)

function validate() {
  errors.name = form.name.trim().length < 2 ? 'Please enter your name.' : ''
  errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())
    ? ''
    : 'Please enter an email address I can reply to.'
  errors.message =
    form.message.trim().length < 10 ? 'A sentence or two about the work is plenty.' : ''
  return !errors.name && !errors.email && !errors.message
}

async function submit() {
  if (status.value === 'sending' || !validate()) return
  status.value = 'sending'
  statusNote.value = ''

  // No endpoint configured: hand off to the mail client instead of pretending.
  if (!endpoint) {
    const body = `${form.message}\n\n${form.name}\n${form.email}`
    const href = `mailto:${profile.email}?subject=${encodeURIComponent(
      `Project enquiry from ${form.name}`,
    )}&body=${encodeURIComponent(body)}`
    window.location.href = href
    status.value = 'sent'
    statusNote.value = 'Your mail app should have opened with this message ready to send.'
    return
  }

  try {
    await $fetch(endpoint, { method: 'POST', body: { ...form } })
    status.value = 'sent'
    statusNote.value = 'Thanks. I will reply to that address.'
    form.name = ''
    form.email = ''
    form.message = ''
  } catch {
    status.value = 'error'
    statusNote.value = `That did not go through. Email me directly at ${profile.email}.`
  }
}

const root = useScene(({ gsap, ScrollTrigger, root, onCleanup }) => {
  const split = heading.value ? splitLines(heading.value) : null
  if (split) onCleanup(split.revert)
  gsap.fromTo(split?.words ?? [], maskHidden(), {
    yPercent: 0,
    duration: 1.2,
    stagger: 0.025,
    ease: 'expo.out',
    scrollTrigger: { trigger: heading.value, start: 'top 84%', once: true },
  })

  gsap.to(root.querySelectorAll('[data-reveal="up"]'), {
    opacity: 1,
    y: 0,
    duration: 1,
    stagger: 0.07,
    ease: 'expo.out',
    scrollTrigger: { trigger: root.querySelector('[data-form]'), start: 'top 82%', once: true },
  })

  /* Glow follows the cursor across the section. Written straight to CSS custom
     properties, so no Vue render and no layout work per move. */
  /*
   * The section box is cached rather than read on every pointer move.
   * getBoundingClientRect forces a synchronous layout flush, and doing that per
   * pointermove event over a section this tall was showing up as forced reflow.
   *
   * The cache is invalidated rather than refreshed, so no layout is read until the
   * next move actually needs it. It has to be invalidated on scroll as well as
   * resize, because the rect is viewport relative: scrolling moves `top` and a
   * stale value would make the glow drift away from the cursor. That invalidation
   * runs from a ScrollTrigger, which is batched with the rest of the page's scroll
   * work, and only sets a variable to null.
   */
  let box: DOMRect | null = null
  const invalidate = () => {
    box = null
  }

  const onMove = (event: PointerEvent) => {
    if (!box) box = root.getBoundingClientRect()
    root.style.setProperty('--gx', `${((event.clientX - box.left) / box.width) * 100}%`)
    root.style.setProperty('--gy', `${((event.clientY - box.top) / box.height) * 100}%`)
  }

  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: invalidate,
  })

  root.addEventListener('pointermove', onMove, { passive: true })
  window.addEventListener('resize', invalidate, { passive: true })
  onCleanup(() => {
    root.removeEventListener('pointermove', onMove)
    window.removeEventListener('resize', invalidate)
  })
})
</script>

<template>
  <section id="contact" ref="root" class="contact scroll-mt-24">
    <div class="shell relative py-28 md:py-40">
      <h2 ref="heading" class="display-lg max-w-[22ch]">Tell me what you are building.</h2>

      <div data-form class="mt-16 grid gap-14 md:mt-20 md:grid-cols-12 md:gap-16">
        <form class="grid gap-8 md:col-span-7" novalidate @submit.prevent="submit">
          <div data-reveal="up" class="field">
            <label class="field__label" for="c-name">Name</label>
            <input
              id="c-name"
              v-model="form.name"
              class="field__input"
              type="text"
              autocomplete="name"
              :aria-invalid="!!errors.name"
              :aria-describedby="errors.name ? 'c-name-error' : undefined"
            />
            <p v-if="errors.name" id="c-name-error" class="field__error">{{ errors.name }}</p>
          </div>

          <div data-reveal="up" class="field">
            <label class="field__label" for="c-email">Email</label>
            <input
              id="c-email"
              v-model="form.email"
              class="field__input"
              type="email"
              autocomplete="email"
              :aria-invalid="!!errors.email"
              :aria-describedby="errors.email ? 'c-email-error' : 'c-email-hint'"
            />
            <p v-if="errors.email" id="c-email-error" class="field__error">{{ errors.email }}</p>
            <p v-else id="c-email-hint" class="field__hint">Where I should reply.</p>
          </div>

          <div data-reveal="up" class="field">
            <label class="field__label" for="c-message">Project</label>
            <textarea
              id="c-message"
              v-model="form.message"
              class="field__input field__input--area"
              rows="4"
              :aria-invalid="!!errors.message"
              :aria-describedby="errors.message ? 'c-message-error' : undefined"
            />
            <p v-if="errors.message" id="c-message-error" class="field__error">
              {{ errors.message }}
            </p>
          </div>

          <div data-reveal="up" class="flex flex-wrap items-center gap-5">
            <AppButton type="submit" variant="solid" :disabled="status === 'sending'">
              <!-- The morph: the label swaps for a spinner and then a tick, and the
                   button width eases between them. -->
              <Transition name="morph" mode="out-in">
                <span v-if="status === 'sending'" key="sending" class="morph-slot">
                  <Icon name="ph:circle-notch" class="spin" aria-hidden="true" />
                  Sending
                </span>
                <span v-else-if="status === 'sent'" key="sent" class="morph-slot">
                  <Icon name="ph:check" aria-hidden="true" />
                  Sent
                </span>
                <span v-else key="idle" class="morph-slot">
                  Send message
                  <Icon name="ph:arrow-right" aria-hidden="true" />
                </span>
              </Transition>
            </AppButton>

            <p class="text-sm text-faint">Or email me directly.</p>
          </div>

          <!-- Both success and failure are announced, not just success. -->
          <p
            v-if="statusNote"
            class="status"
            :class="{ 'status--error': status === 'error' }"
            role="status"
            aria-live="polite"
          >
            {{ statusNote }}
          </p>
        </form>

        <div class="md:col-span-4 md:col-start-9">
          <dl class="grid gap-7">
            <div data-reveal="up">
              <dt class="label">Email</dt>
              <dd class="mt-2">
                <a class="link" :href="`mailto:${profile.email}`">{{ profile.email }}</a>
              </dd>
            </div>
            <div data-reveal="up">
              <dt class="label">GitHub</dt>
              <dd class="mt-2">
                <a class="link" :href="profile.github" rel="noreferrer noopener" target="_blank">
                  mostafaaghaazlan
                </a>
              </dd>
            </div>
            <div data-reveal="up">
              <dt class="label">Availability</dt>
              <dd class="mt-2 max-w-[32ch] text-[0.9375rem] leading-relaxed text-muted">
                {{ profile.availability }}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.contact {
  position: relative;
  isolation: isolate;
}

/* The cursor glow. Sits behind content, cannot be interacted with, and defaults
   to the section centre so it is composed before the pointer ever arrives. */
.contact::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: radial-gradient(
    34rem circle at var(--gx, 50%) var(--gy, 40%),
    rgb(124 92 255 / 0.13),
    transparent 70%
  );
}

.field {
  display: grid;
  gap: 0.5rem;
}

/* Label above the input. Never a placeholder standing in for one. */
.field__label {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-muted);
}

.field__input {
  width: 100%;
  padding: 0.85rem 0;
  background: transparent;
  color: var(--color-fg);
  font-size: 1.0625rem;
  border: 0;
  border-bottom: 1px solid var(--line-strong);
  border-radius: 0;
  /* The animated underline: the border thickens and turns accent from the left. */
  background-image: linear-gradient(to right, var(--color-accent), var(--color-accent));
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0% 1px;
  transition: background-size 0.55s var(--ease-cine);
}
.field__input:focus {
  outline: none;
  background-size: 100% 1px;
}
.field__input:focus-visible {
  /* The underline is the focus indicator, but a visible ring must remain for
     anyone who needs a stronger one. */
  outline: 2px solid var(--color-accent);
  outline-offset: 4px;
}
.field__input--area {
  resize: vertical;
  min-height: 7rem;
  line-height: 1.6;
}

.field__hint {
  font-size: 0.8125rem;
  /* --faint clears 4.5:1 on ink. Anything lighter would fail. */
  color: var(--color-faint);
}

.field__error {
  font-size: 0.8125rem;
  color: #ff9b9b;
}

.status {
  font-size: 0.9375rem;
  color: var(--color-muted);
}
.status--error {
  color: #ff9b9b;
}

.morph-slot {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.morph-enter-active,
.morph-leave-active {
  transition:
    opacity 0.22s var(--ease-cine),
    transform 0.22s var(--ease-cine);
}
.morph-enter-from {
  opacity: 0;
  transform: translateY(60%);
}
.morph-leave-to {
  opacity: 0;
  transform: translateY(-60%);
}

.spin {
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.link {
  font-size: 1.0625rem;
  color: var(--color-fg);
  text-decoration: underline;
  text-decoration-color: var(--color-accent);
  text-decoration-thickness: 1px;
  text-underline-offset: 5px;
  transition: color 0.4s var(--ease-cine);
}
.link:hover {
  color: var(--color-accent);
}
</style>
