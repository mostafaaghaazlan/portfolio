<script setup lang="ts">
/*
 * The WebGL background: a slow drifting glow, a noise wash, and a particle field
 * with mouse parallax.
 *
 * Cost decisions, because this runs behind every section for the whole visit:
 *
 *   - Three is imported dynamically inside onMounted. It is the single largest
 *     dependency here, and loading it eagerly would put it in the entry chunk and
 *     push out LCP for a layer that is purely decorative.
 *   - One fullscreen shader quad draws the gradient and both glows. Doing that in
 *     GLSL rather than with lights and meshes means no per frame matrix work.
 *   - The particles are a single Points draw call. Their drift happens in the
 *     vertex shader, so no attribute is ever re-uploaded after setup.
 *   - Device pixel ratio is capped at 1.5. Past that the grain overlay hides any
 *     difference and the fill cost roughly doubles.
 *   - The loop stops when the tab is hidden and never starts under reduced
 *     motion, where a single static frame is drawn instead.
 *
 * Pointer position is held in a plain object and lerped inside the render loop.
 * It is never reactive state: that would re-render the Vue tree on every mouse
 * move for something only the GPU consumes.
 */

const host = ref<HTMLElement | null>(null)
let dispose: (() => void) | null = null

const VERTEX_QUAD = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAGMENT_FIELD = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uAspect;
  uniform vec3 uAccent;
  uniform vec3 uBase;

  // Cheap value noise. Enough to break up the gradient banding; not trying to
  // look like anything.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float glow(vec2 uv, vec2 at, float radius) {
    float d = length((uv - at) * uAspect);
    return exp(-d * d / radius);
  }

  void main() {
    vec2 uv = vUv;
    vec3 col = uBase;

    // Two glows on slow, mutually prime orbits, so they never visibly repeat.
    vec2 a = vec2(0.28 + sin(uTime * 0.055) * 0.16, 0.72 + cos(uTime * 0.041) * 0.13);
    vec2 b = vec2(0.78 + cos(uTime * 0.037) * 0.14, 0.24 + sin(uTime * 0.063) * 0.15);

    // The mouse nudges the glows rather than moving them one to one, which
    // reads as depth instead of as a cursor effect.
    a += uMouse * 0.035;
    b -= uMouse * 0.055;

    // Kept low on purpose, for two reasons. Visually, anything stronger stops
    // reading as a slow atmospheric glow and starts reading as a gradient
    // wallpaper. Practically, the glow lifts the background luminance under every
    // section, and at 0.42 the brightest patch dragged the smallest text colour
    // (--faint) below 4.5:1. These values keep the worst case above AA.
    col += uAccent * glow(uv, a, 0.24) * 0.2;
    col += uAccent * glow(uv, b, 0.15) * 0.12;

    // A cool lift toward the top so the hero copy has something to sit against.
    col += vec3(0.035, 0.036, 0.055) * smoothstep(0.15, 1.0, uv.y);

    // Dither. Without this the near black gradient bands badly on 8 bit panels.
    col += (noise(uv * vec2(900.0, 900.0) + uTime * 0.4) - 0.5) * 0.012;

    gl_FragColor = vec4(col, 1.0);
  }
`

const VERTEX_PARTICLES = /* glsl */ `
  attribute float aScale;
  attribute float aSpeed;
  attribute float aSeed;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uPixelRatio;
  varying float vFade;

  void main() {
    vec3 p = position;

    // Drift upward and wrap. Done here so the position buffer is uploaded once.
    p.y = mod(p.y + uTime * aSpeed * 0.35 + 60.0, 120.0) - 60.0;
    p.x += sin(uTime * 0.22 + aSeed * 6.2831) * 1.6;

    // Parallax by depth: near particles answer the mouse more than far ones.
    float depth = (p.z + 40.0) / 80.0;
    p.xy += uMouse * mix(1.0, 7.0, depth);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aScale * uPixelRatio * (36.0 / -mv.z);

    // Fade the ones nearest the camera, so nothing ever reads as a hard dot.
    vFade = smoothstep(0.0, 0.35, depth) * (1.0 - smoothstep(0.75, 1.0, depth));
  }
`

const FRAGMENT_PARTICLES = /* glsl */ `
  precision mediump float;
  uniform vec3 uAccent;
  varying float vFade;

  void main() {
    // Soft round sprite, no texture fetch.
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.0, d) * vFade * 0.5;
    if (alpha < 0.01) discard;
    vec3 tint = mix(vec3(1.0), uAccent, 0.45);
    gl_FragColor = vec4(tint, alpha);
  }
`

/**
 * Should this device pay 483 KB for a decorative canvas?
 *
 * Below 768px the particle field is a handful of specks behind copy that fills the
 * screen, so the CSS gradient underneath carries the look on its own and Three is
 * never fetched. The same applies when the visitor has asked the OS to save data.
 * This is the single largest dependency on the site and it draws nothing anyone
 * reads.
 */
function shouldRenderWebgl(): boolean {
  if (window.innerWidth < 768) return false
  const connection = (navigator as { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return false
  const memory = (navigator as { deviceMemory?: number }).deviceMemory
  return !(typeof memory === 'number' && memory < 4)
}

/** Resolves after the browser has finished the work that actually matters. */
function whenIdle(): Promise<void> {
  return new Promise((resolve) => {
    const idle = (window as { requestIdleCallback?: (cb: () => void, o?: object) => void })
      .requestIdleCallback
    if (idle) idle(() => resolve(), { timeout: 1500 })
    else setTimeout(resolve, 300)
  })
}

onMounted(async () => {
  if (!host.value || !shouldRenderWebgl()) return

  const still = !motionOk()

  // Import after the page is interactive. Three is prefetched at low priority, so
  // waiting for idle keeps it off the critical path for first paint entirely.
  if (!still) await whenIdle()
  if (!host.value) return

  const {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    BufferGeometry,
    BufferAttribute,
    Points,
    Mesh,
    PlaneGeometry,
    ShaderMaterial,
    AdditiveBlending,
    Color,
    Vector2,
  } = await import('three')

  const el = host.value
  const scene = new Scene()
  const camera = new PerspectiveCamera(60, 1, 0.1, 200)
  camera.position.z = 46

  const renderer = new WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: 'low-power',
  })
  renderer.setClearColor(new Color('#050505'), 1)
  el.appendChild(renderer.domElement)
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'

  const accent = new Color('#7c5cff')
  const base = new Color('#050505')
  const mouse = new Vector2(0, 0)

  /* --- Fullscreen gradient quad ------------------------------------------ */
  // Drawn with a clip space vertex shader, so it needs no camera and cannot be
  // clipped by the near plane.
  const fieldUniforms = {
    uTime: { value: 0 },
    uMouse: { value: new Vector2(0, 0) },
    uAspect: { value: new Vector2(1, 1) },
    uAccent: { value: accent },
    uBase: { value: base },
  }
  const field = new Mesh(
    new PlaneGeometry(2, 2),
    new ShaderMaterial({
      vertexShader: VERTEX_QUAD,
      fragmentShader: FRAGMENT_FIELD,
      uniforms: fieldUniforms,
      depthTest: false,
      depthWrite: false,
    }),
  )
  field.frustumCulled = false
  field.renderOrder = -1
  scene.add(field)

  /* --- Particles --------------------------------------------------------- */
  const COUNT = window.innerWidth < 768 ? 320 : 900
  const positions = new Float32Array(COUNT * 3)
  const scales = new Float32Array(COUNT)
  const speeds = new Float32Array(COUNT)
  const seeds = new Float32Array(COUNT)

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 150
    positions[i * 3 + 1] = (Math.random() - 0.5) * 120
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80
    scales[i] = 0.6 + Math.random() * 2.4
    speeds[i] = 0.4 + Math.random() * 1.5
    seeds[i] = Math.random()
  }

  const cloudGeometry = new BufferGeometry()
  cloudGeometry.setAttribute('position', new BufferAttribute(positions, 3))
  cloudGeometry.setAttribute('aScale', new BufferAttribute(scales, 1))
  cloudGeometry.setAttribute('aSpeed', new BufferAttribute(speeds, 1))
  cloudGeometry.setAttribute('aSeed', new BufferAttribute(seeds, 1))

  const particleUniforms = {
    uTime: { value: 0 },
    uMouse: { value: new Vector2(0, 0) },
    uPixelRatio: { value: 1 },
    uAccent: { value: accent },
  }
  const cloud = new Points(
    cloudGeometry,
    new ShaderMaterial({
      vertexShader: VERTEX_PARTICLES,
      fragmentShader: FRAGMENT_PARTICLES,
      uniforms: particleUniforms,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    }),
  )
  cloud.frustumCulled = false
  scene.add(cloud)

  /* --- Sizing ------------------------------------------------------------ */
  const resize = () => {
    const w = el.clientWidth || window.innerWidth
    const h = el.clientHeight || window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    fieldUniforms.uAspect.value.set(Math.max(1, w / h), Math.max(1, h / w))
    particleUniforms.uPixelRatio.value = dpr
  }
  resize()

  const onResize = () => resize()
  window.addEventListener('resize', onResize, { passive: true })

  /* --- Pointer ----------------------------------------------------------- */
  // Target and current are kept apart so the lerp does the smoothing. Neither is
  // reactive; the render loop is the only reader.
  const target = { x: 0, y: 0 }
  const onPointer = (event: PointerEvent) => {
    target.x = (event.clientX / window.innerWidth) * 2 - 1
    target.y = -((event.clientY / window.innerHeight) * 2 - 1)
  }
  if (!still) window.addEventListener('pointermove', onPointer, { passive: true })

  /* --- Loop -------------------------------------------------------------- */
  let raf = 0
  let last = performance.now()
  let elapsed = 0

  const frame = (now: number) => {
    // Clamp delta, so returning to a backgrounded tab does not fast forward the
    // drift by however long the visitor was away.
    const delta = Math.min((now - last) / 1000, 1 / 30)
    last = now
    elapsed += delta

    mouse.x += (target.x - mouse.x) * 0.045
    mouse.y += (target.y - mouse.y) * 0.045

    fieldUniforms.uTime.value = elapsed
    fieldUniforms.uMouse.value.set(mouse.x, mouse.y)
    particleUniforms.uTime.value = elapsed
    particleUniforms.uMouse.value.set(mouse.x, mouse.y)

    renderer.render(scene, camera)
    raf = requestAnimationFrame(frame)
  }

  const play = () => {
    if (raf || still) return
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }
  const pause = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
  }

  const onVisibility = () => (document.hidden ? pause() : play())
  document.addEventListener('visibilitychange', onVisibility)

  if (still) {
    // One frame, so the background is composed rather than flat black, then stop.
    renderer.render(scene, camera)
  } else {
    play()
  }

  dispose = () => {
    pause()
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('resize', onResize)
    window.removeEventListener('pointermove', onPointer)
    cloudGeometry.dispose()
    cloud.material.dispose()
    field.geometry.dispose()
    field.material.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
})

onBeforeUnmount(() => {
  dispose?.()
  dispose = null
})
</script>

<template>
  <!-- z-0. Behind everything; the layout sits at z-10.
       The gradient is not a placeholder: on small screens and save-data
       connections it is the whole background, because Three never loads there.
       On desktop the canvas is appended on top of it once it is ready, so there is
       no flash of flat black while the chunk arrives. -->
  <div ref="host" class="field" aria-hidden="true" />
</template>

<style scoped>
.field {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(70% 50% at 22% 68%, rgb(124 92 255 / 0.16), transparent 70%),
    radial-gradient(50% 40% at 80% 22%, rgb(124 92 255 / 0.1), transparent 70%),
    linear-gradient(to top, var(--color-ink) 40%, #0a0a12 100%);
}

/* The canvas Three appends. Sits over the gradient and fills the layer. */
.field :deep(canvas) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
</style>
