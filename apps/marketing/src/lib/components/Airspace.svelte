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
  <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
    {#each plan.clouds as c, i (i)}
      <g
        class="drift"
        style="--dx:{(9 * c.depth).toFixed(1)}px; --dy:{(-5 * c.depth).toFixed(
          1,
        )}px; --dur:{(26 + c.depth * 11).toFixed(0)}s; --delay:{-7.5 * i}s"
      >
        <path
          class="cloud"
          d={BLOB_LIST[c.blob % BLOB_LIST.length]}
          data-depth={c.depth}
          transform="translate({c.x} {c.y}) scale({c.w} {c.h})"
        />
      </g>
    {/each}
    {#each plan.trails as d, i (i)}
      <path class="trail" {d} />
      <path class="pulse" {d} pathLength="1" style="--dur:{9 + i * 3.5}s; --delay:{-4 * i}s" />
    {/each}
  </svg>
</div>

<style>
  /* Explicit user instruction, twice: no top/bottom crop, full stop. "slice"
     always crops vertically once the band is shorter than the box scaled to
     this artwork's 1000:600 ratio — true at most desktop widths — no matter
     whether the box is sized by aspect-ratio or by height:100%. "meet" is the
     only mode that never crops: it fits the whole artwork inside its box,
     letterboxed instead. The box itself still needs to be viewport-width, not
     the section's own 74rem column — inset:0 alone re-confines the artwork
     to the narrow reading column, the original complaint this whole thing
     started from. Full viewport width + the section's own height as the box,
     "meet" fit inside it: a short band lets the artwork spill past the
     reading column into the margins (still centered, not edge-to-edge); a
     tall band lets it reach the true viewport edges on its own. Either way,
     never cropped. */
  .airspace {
    position: absolute;
    top: 0;
    left: 50%;
    width: 100vw;
    height: 100%;
    margin-left: -50vw;
    z-index: -1;
    pointer-events: none;
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

  /* The scroll work above owns the cloud's own transform attribute and the
     trail's dash offset, so the constant motion is put on properties neither
     of them touches: a wrapper <g> that drifts, and a second copy of the path
     that carries a single travelling dash. Nothing here needs to know the
     path's real length — pathLength="1" normalises it, so one dash cycle is
     exactly one offset of 1 whatever the curve. */
  .drift {
    animation-name: drift;
    animation-duration: var(--dur, 30s);
    animation-delay: var(--delay, 0s);
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    will-change: transform;
  }
  @keyframes drift {
    0%,
    100% {
      transform: translate(0, 0);
    }
    34% {
      transform: translate(var(--dx), var(--dy));
    }
    67% {
      transform: translate(calc(var(--dx) * -0.65), calc(var(--dy) * -0.8));
    }
  }
  .pulse {
    fill: none;
    stroke: color-mix(in oklab, var(--color-primary) 60%, var(--color-bg));
    stroke-width: 2.5;
    stroke-linecap: round;
    vector-effect: non-scaling-stroke;
    stroke-dasharray: 0.03 0.97;
    animation-name: run;
    animation-duration: var(--dur, 9s);
    animation-delay: var(--delay, 0s);
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  @keyframes run {
    from {
      stroke-dashoffset: 1;
    }
    to {
      stroke-dashoffset: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .drift {
      animation: none;
    }
    .pulse {
      display: none;
    }
  }
</style>
