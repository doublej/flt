<script lang="ts">
import { BLOB_LIST } from '$lib/blobs'
import { onMount } from 'svelte'

/** The same blob vocabulary as the portraits, put to the thing the whole site
 *  is about: cloud sitting still and a contrail being drawn across it. The
 *  trails are great-circle sweeps rather than straight lines, because that is
 *  the shape a long flight makes on a flat map. Purely decorative, so the
 *  layer is hidden from the accessibility tree and never takes a pointer. */
let { set = 0 }: { set?: number } = $props()

type Cloud = { blob: number; x: number; y: number; w: number; h: number; depth: number }

const SETS: { trails: string[]; clouds: Cloud[] }[] = [
  {
    trails: ['M-60,486 C210,352 486,300 1060,168'],
    clouds: [
      { blob: 1, x: 604, y: 44, w: 372, h: 250, depth: 0.5 },
      { blob: 3, x: -70, y: 322, w: 300, h: 218, depth: 1 },
    ],
  },
  {
    trails: ['M-60,150 C260,236 520,318 1060,388', 'M-60,540 C300,470 640,500 1060,432'],
    clouds: [{ blob: 0, x: 690, y: 300, w: 330, h: 268, depth: 0.75 }],
  },
  {
    trails: ['M-60,404 C240,404 470,180 1060,208'],
    clouds: [
      { blob: 2, x: -110, y: 92, w: 344, h: 232, depth: 0.6 },
      { blob: 1, x: 720, y: 366, w: 288, h: 226, depth: 1.15 },
    ],
  },
]

const plan = $derived(SETS[set % SETS.length])

let root: HTMLElement

onMount(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  let ctx: { revert: () => void } | undefined
  ;(async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ])
    gsap.registerPlugin(ScrollTrigger)

    const band = root.parentElement ?? root
    ctx = gsap.context(() => {
      /* the trail is drawn by the scroll that reveals it: one dash the length
         of the path, walked back to zero offset */
      for (const t of gsap.utils.toArray<SVGPathElement>('.trail')) {
        const len = t.getTotalLength()
        gsap.set(t, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(t, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: band, start: 'top 82%', end: 'bottom 60%', scrub: 0.8 },
        })
      }

      for (const c of gsap.utils.toArray<SVGPathElement>('.cloud')) {
        const depth = Number(c.dataset.depth ?? 1)
        gsap.fromTo(
          c,
          { yPercent: 9 * depth },
          {
            yPercent: -9 * depth,
            ease: 'none',
            scrollTrigger: { trigger: band, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
          },
        )
      }
    }, root)
  })()

  return () => ctx?.revert()
})
</script>

<div class="airspace" aria-hidden="true" bind:this={root}>
  <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
    {#each plan.clouds as c, i (i)}
      <path
        class="cloud"
        d={BLOB_LIST[c.blob % BLOB_LIST.length]}
        data-depth={c.depth}
        transform="translate({c.x} {c.y}) scale({c.w} {c.h})"
      />
    {/each}
    {#each plan.trails as d, i (i)}
      <path class="trail" {d} />
    {/each}
  </svg>
</div>

<style>
  .airspace {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    overflow: clip;
  }
  svg {
    width: 100%;
    height: 100%;
    display: block;
  }
  .cloud {
    fill: color-mix(in oklab, var(--color-primary) 8%, var(--color-bg));
  }
  .trail {
    fill: none;
    stroke: color-mix(in oklab, var(--color-primary) 34%, var(--color-bg));
    stroke-width: 1.5;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
  }
</style>
