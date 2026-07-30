/*
 * Shared handoff between the loader and the hero.
 *
 * The hero builds its opening timeline paused and waits on this flag, so the
 * headline starts moving as the loader panel clears rather than after it, and the
 * two read as one continuous move.
 *
 * It must start `false`, including on the server. `useState` serialises the
 * server value into the payload and hydration reads that, not the factory, so a
 * server default of `true` would arrive on the client already done and the hero
 * would fire the instant it mounted, behind the loader.
 *
 * Nothing is stranded by starting false: the loader sets it true on mount when
 * motion is off, and if JS never runs at all then `.motion-ready` is absent, so no
 * element was hidden in the first place.
 */
export const useIntroDone = () => {
  // With the loader switched off nothing will ever flip this, so it starts done
  // and the hero plays its entrance the moment it mounts.
  const enabled = useRuntimeConfig().public.intro as boolean
  return useState<boolean>('intro-done', () => !enabled)
}
