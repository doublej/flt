<script lang="ts">
import { MANUAL_S, SCENARIOS, TOTALS, byHandHours } from '$lib/scenarios'
import { onMount } from 'svelte'

let list: HTMLElement

/** Four jobs, alternating sides. The search count is set as the item's numeral
 *  and sized off the count itself, so five searches and twenty-eight are told
 *  apart before either number is read. */
const nf = new Intl.NumberFormat('en-GB')
const hours = byHandHours(TOTALS.queries)

/** No two photographs are the same size or proportion, and each sits at its
 *  own angle, the way prints do when they have been put down on a desk rather
 *  than mounted. Proportion follows the job behind it: five airports on one
 *  date is a tall narrow search, two cabins across a week is a wide one. The
 *  crops are composed at these ratios in the source files rather than squeezed
 *  from one master, so no one is cut through the chin to make a shape. */
const SHAPE = {
  gateway: { ar: '2 / 3', w: '20rem', rot: '-1.6deg', iw: 640, ih: 960 },
  ski: { ar: '1 / 1', w: '25rem', rot: '1.1deg', iw: 800, ih: 800 },
  cabin: { ar: '5 / 4', w: '30rem', rot: '-0.7deg', iw: 900, ih: 720 },
  holidays: { ar: '4 / 5', w: '23rem', rot: '1.9deg', iw: 720, ih: 900 },
} as const
const FALLBACK = { ar: '4 / 5', w: '23rem', rot: '0deg', iw: 720, ih: 900 }
const shapeOf = (id: string) => SHAPE[id as keyof typeof SHAPE] ?? FALLBACK

/** Each photograph sits on a wash cut to its neighbour's blob, so the two
 *  outlines never coincide and the print reads as laid on top of something. */

/** Print, wash and copy travel at three different rates while a row crosses
 *  the viewport. Nothing loops: every bit of movement here is spent by the
 *  scroll that caused it. */
onMount(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  let ctx: { revert: () => void } | undefined
  ;(async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ])
    gsap.registerPlugin(ScrollTrigger)

    ctx = gsap.context(() => {
      for (const job of gsap.utils.toArray<HTMLElement>('.job')) {
        gsap.from(job, {
          opacity: 0,
          y: 48,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: job, start: 'top 88%', once: true },
        })

        const scrub = { trigger: job, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
        gsap.fromTo(
          job.querySelector('.frame'),
          { y: 44 },
          { y: -44, ease: 'none', scrollTrigger: scrub },
        )
        gsap.fromTo(
          job.querySelector('.wash'),
          { y: 78, scale: 1.06 },
          { y: -78, scale: 0.97, ease: 'none', scrollTrigger: scrub },
        )
        gsap.fromTo(
          job.querySelector('.body'),
          { y: 14 },
          { y: -14, ease: 'none', scrollTrigger: scrub },
        )
      }
    }, list)
  })()

  return () => ctx?.revert()
})

/** One closed bezier per job, drawn round an eight-point ring with the radius
 *  jittered off a fixed seed, then normalised to fill its box. In
 *  objectBoundingBox units, so one path serves any size or proportion. */
const BLOB: Record<string, string> = {
  gateway:
    'M0.9998,0.4711C0.9969,0.5980 0.9530,0.7556 0.8635,0.8436C0.7739,0.9317 0.5863,1.0085 0.4625,0.9993C0.3387,0.9901 0.1977,0.8767 0.1207,0.7887C0.0437,0.7007 0.0050,0.5811 0.0006,0.4711C-0.0039,0.3611 0.0171,0.2069 0.0941,0.1288C0.1711,0.0506 0.3314,0.0099 0.4625,0.0022C0.5937,-0.0056 0.7915,0.0041 0.8810,0.0823C0.9706,0.1605 1.0027,0.3442 0.9998,0.4711Z',
  ski: 'M1.0000,0.5258C0.9973,0.6407 0.9227,0.7844 0.8419,0.8620C0.7611,0.9396 0.6361,0.9787 0.5150,0.9912C0.3939,1.0037 0.2010,1.0145 0.1152,0.9370C0.0294,0.8594 -0.0037,0.6588 0.0003,0.5258C0.0043,0.3929 0.0533,0.2268 0.1391,0.1392C0.2249,0.0517 0.3952,-0.0052 0.5150,0.0004C0.6349,0.0060 0.7774,0.0853 0.8582,0.1729C0.9391,0.2605 1.0027,0.4110 1.0000,0.5258Z',
  cabin:
    'M0.9995,0.4537C0.9930,0.5706 0.9197,0.6935 0.8392,0.7845C0.7586,0.8756 0.6223,1.0014 0.5161,1.0000C0.4098,0.9986 0.2874,0.8669 0.2015,0.7759C0.1155,0.6848 0.0055,0.5665 0.0002,0.4537C-0.0051,0.3409 0.0837,0.1746 0.1697,0.0990C0.2557,0.0235 0.3981,0.0030 0.5161,0.0004C0.6341,-0.0023 0.7972,0.0078 0.8778,0.0833C0.9583,0.1589 1.0059,0.3368 0.9995,0.4537Z',
  holidays:
    'M0.9985,0.4737C1.0119,0.5856 0.9349,0.7628 0.8479,0.8502C0.7608,0.9376 0.5859,1.0126 0.4762,0.9982C0.3665,0.9839 0.2690,0.8515 0.1896,0.7641C0.1103,0.6767 0.0058,0.5761 0.0002,0.4737C-0.0053,0.3713 0.0769,0.2284 0.1562,0.1495C0.2355,0.0706 0.3744,-0.0047 0.4762,0.0002C0.5781,0.0051 0.6804,0.0998 0.7674,0.1787C0.8545,0.2576 0.9851,0.3618 0.9985,0.4737Z',
}
</script>

<svg class="defs" aria-hidden="true" focusable="false">
  <defs>
    {#each Object.entries(BLOB) as [id, d] (id)}
      <clipPath id="blob-{id}" clipPathUnits="objectBoundingBox"><path {d} /></clipPath>
    {/each}
  </defs>
</svg>

<div class="jobs" bind:this={list}>
  {#each SCENARIOS as s, i (s.id)}
    {@const sh = shapeOf(s.id)}
    {@const ids = Object.keys(BLOB)}
    {@const wash = ids[(ids.indexOf(s.id) + 1) % ids.length] ?? s.id}
    <article
      class="job"
      class:flip={i % 2 === 1}
      style:--n={s.queries}
      style:--ar={sh.ar}
      style:--w={sh.w}
      style:--rot={sh.rot}
    >
      <div class="frame">
        <span class="wash" aria-hidden="true" style:clip-path="url(#blob-{wash})"></span>
        <img
          class="who"
          src="/img/people/{s.id}.webp"
          alt=""
          width={sh.iw}
          height={sh.ih}
          loading="lazy"
          style:clip-path={BLOB[s.id] ? `url(#blob-${s.id})` : undefined}
        />
      </div>

      <div class="body">
        <p class="when">{s.window}</p>
        <blockquote>{s.ask}</blockquote>
        <p class="route">{s.route}</p>

        <div class="tally">
          <p class="count">
            <b>{s.queries}</b>
            <span>searches</span>
          </p>
          <div class="of">
            <p class="shape">
              {s.grid.rows}
              {s.grid.rowKind} × {s.grid.cols}
              {s.grid.cols === 1 ? 'date' : 'dates'}
            </p>
            <p class="sub">{nf.format(s.options)} options · {s.seconds} seconds</p>
          </div>
        </div>
      </div>
    </article>
  {/each}
</div>

<p class="total">
  <b>{TOTALS.queries} searches</b> in {TOTALS.searchingSeconds} seconds of actual searching, which
  returned {nf.format(TOTALS.options)} options across {TOTALS.carriers} airlines. Run by hand at a
  generous {MANUAL_S} seconds each (type the route, wait for it, scan the results, write the price
  down) the same {TOTALS.queries} searches take about {hours.toFixed(1)} hours. The largest of the
  four — twenty-eight searches across four American cities — is a €10 Survey. That by-hand estimate
  is the only number on this page we did not measure.
</p>

<style>
  .defs {
    position: absolute;
    width: 0;
    height: 0;
  }

  /* The list is the widest thing on the page: it steps out of the 74rem
     measure into the gutters so the photographs get the room, while the copy
     beside them keeps its own line length. */
  .jobs {
    --bleed: min(94rem, calc(100vw - 2 * var(--gutter)));
    display: grid;
    gap: var(--space-6);
    width: var(--bleed);
    margin-top: var(--space-5);
    margin-inline: calc((100% - var(--bleed)) / 2);
  }

  /* The photograph changes sides down the list so four jobs read as a sequence
     rather than four of the same thing. */
  .job {
    display: grid;
    grid-template-columns: var(--w) minmax(0, 1fr);
    gap: var(--space-5);
    align-items: center;
  }
  .job.flip {
    grid-template-columns: minmax(0, 1fr) var(--w);
  }
  .frame {
    grid-column: 1;
    grid-row: 1;
    position: relative;
    isolation: isolate;
  }
  /* the wash is generously larger than the print so it never uncovers a corner
     as it turns, and it is always the neighbour's blob, never its own */
  .wash {
    position: absolute;
    inset: -9% -11% -7% -12%;
    z-index: 0;
    background: color-mix(in oklab, var(--color-primary) 13%, var(--color-bg));
  }
  .who {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: var(--ar);
    object-fit: cover;
    object-position: 50% 42%;
    rotate: var(--rot);
  }
  .body {
    grid-column: 2;
    grid-row: 1;
    align-content: center;
    max-width: 34rem;
  }
  .flip .frame {
    grid-column: 2;
  }
  .flip .body {
    grid-column: 1;
    justify-self: end;
  }

  .when {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  blockquote {
    margin: 0.5rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(1.35rem, 2.2vw, 1.9rem);
    line-height: 1.28;
    letter-spacing: -0.012em;
    text-wrap: pretty;
    /* hang the opening quote in the margin so the first word starts on the
       same line as the date above it and the route below */
    text-indent: -0.42em;
  }
  blockquote::before {
    content: "“";
  }
  blockquote::after {
    content: "”";
  }
  .route {
    margin-top: 0.7rem;
    font-size: 0.92rem;
    line-height: 1.5;
    color: var(--color-muted);
  }

  /* The numeral carries the work: its size comes off the search count, so the
     five-search job and the twenty-eight-search job are different weights on
     the page before you read either figure. */
  /* The number is the subject and the two lines beside it are its predicate:
     what the searches were made of, then what they came back with. The unit
     sits under the numeral in the same caps as the date at the top, so the
     block is bracketed by the utility face at both ends. */
  .tally {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--space-3);
    align-items: center;
    margin-top: var(--space-4);
  }
  .count {
    display: grid;
    justify-items: start;
    gap: 0.3rem;
  }
  .count b {
    font-family: var(--font-display);
    font-stretch: var(--display-wide);
    font-weight: 600;
    font-size: calc(3.2rem + var(--n) * 0.13rem);
    line-height: 0.78;
    color: var(--color-primary);
    font-variant-numeric: lining-nums tabular-nums;
  }
  .count span {
    font-family: var(--font-mono);
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  .of {
    display: grid;
    gap: 0.3rem;
    border-left: 1px solid var(--color-border);
    padding-left: var(--space-3);
  }
  .shape {
    font-size: 0.95rem;
    color: var(--color-text);
  }
  .sub {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--color-muted);
  }

  @media (max-width: 800px) {
    .jobs {
      gap: var(--space-5);
    }
    .job,
    .job.flip {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-3);
    }
    .who,
    .flip .who {
      grid-column: 1;
      grid-row: 1;
      width: 11rem;
    }
    .body,
    .flip .body {
      grid-column: 1;
      justify-self: start;
    }
  }

  .total {
    margin-top: var(--space-6);
    max-width: var(--measure);
    font-size: 0.95rem;
    color: var(--color-muted);
  }
  .total b {
    color: var(--color-text);
    font-weight: 500;
  }
</style>
