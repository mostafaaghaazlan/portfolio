<template>
  <div class="relative z-10 flex min-h-[100dvh] flex-col">
    <SiteHeader />
    <!-- tabindex="-1" so the skip link can actually move focus here, not just scroll. -->
    <main id="main" tabindex="-1" class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
