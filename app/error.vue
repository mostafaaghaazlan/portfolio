<script setup lang="ts">
import type { NuxtError } from '#app'

/*
 * Error page. Kept inside the site's language rather than falling back to a bare
 * Nuxt screen, and it always offers a way out.
 */
const props = defineProps<{ error: NuxtError }>()

const is404 = computed(() => props.error?.statusCode === 404)

useHead({ title: is404.value ? 'Page not found' : 'Something went wrong' })
</script>

<template>
  <div>
    <WebglField />
    <GrainOverlay />

    <div class="relative z-10 flex min-h-[100dvh] items-center">
      <div class="shell py-24">
        <p class="label">{{ error?.statusCode || 'Error' }}</p>
        <h1 class="display-lg mt-6 max-w-[22ch]">
          {{ is404 ? 'That page is not here.' : 'Something went wrong.' }}
        </h1>
        <p class="mt-7 max-w-[48ch] text-lg leading-relaxed text-muted">
          {{
            is404
              ? 'The link may be out of date. The work index has everything.'
              : 'Reloading usually clears it. If it does not, the work index still works.'
          }}
        </p>
        <div class="mt-10 flex flex-wrap gap-4">
          <AppButton to="/" variant="solid">Back home</AppButton>
          <AppButton to="/#work" variant="ghost">View work</AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
