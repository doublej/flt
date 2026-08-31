<script lang="ts">
import { BLOBS as BLOB } from '$lib/blobs'
import { en as copy } from '$lib/i18n/en'
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
/*  align — where the copy sits against its photograph, so the four rows are
 *          not all centred on the same line
 *  pull  — how far the copy laps over the blob. The outline is curved, so
 *          there is always slack at its edge for a line of type to sit in.
 *  meas  — the copy's own measure, which narrows as its photograph widens */
const SHAPE = {
  gateway: {
    ar: '2 / 3',
    w: '20rem',
    rot: '-1.6deg',
    align: 'start',
    pull: '3.5rem',
    meas: '33rem',
    iw: 640,
    ih: 960,
  },
  ski: {
    ar: '1 / 1',
    w: '25rem',
    rot: '1.1deg',
    align: 'end',
    pull: '5.5rem',
    meas: '30rem',
    iw: 800,
    ih: 800,
  },
  cabin: {
    ar: '5 / 4',
    w: '30rem',
    rot: '-0.7deg',
    align: 'center',
    pull: '2rem',
    meas: '27rem',
    iw: 900,
    ih: 720,
  },
  holidays: {
    ar: '4 / 5',
    w: '23rem',
    rot: '1.9deg',
    align: 'start',
    pull: '6rem',
    meas: '31rem',
    iw: 720,
    ih: 900,
  },
} as const
const FALLBACK = {
  ar: '4 / 5',
  w: '23rem',
  rot: '0deg',
  align: 'center',
  pull: '0rem',
  meas: '34rem',
  iw: 720,
  ih: 900,
}
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
        /* fromTo with immediateRender off, never `from`: a reveal that hides
           its own content up front leaves the row blank for good if the
           trigger is ever computed against a stale layout. */
        gsap.fromTo(
          job,
          { opacity: 0, y: 48 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            immediateRender: false,
            scrollTrigger: { trigger: job, start: 'top 92%', once: true },
          },
        )

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

    /* the prints are lazy, so their boxes can land after the triggers were
       measured; one refresh once they are all in puts the marks back */
    const imgs = [...list.querySelectorAll('img')].filter((i) => !i.complete)
    if (imgs.length) {
      Promise.all(
        imgs.map((i) => new Promise((done) => i.addEventListener('load', done, { once: true }))),
      ).then(() => ScrollTrigger.refresh())
    }
  })()

  return () => ctx?.revert()
})
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
      style:--align={sh.align}
      style:--pull={sh.pull}
      style:--meas={sh.meas}
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
          style:clip-path={BLOB[s.id as keyof typeof BLOB] ? `url(#blob-${s.id})` : undefined}
        />
      </div>

      <div class="body">
        <p class="when">{s.window}</p>
        <blockquote>{copy.work.scenarios[s.id].ask}</blockquote>
        <p class="route">{s.route}</p>

        <div class="tally">
          <p class="count">
            <b>{s.queries}</b>
            <span>{copy.work.countUnit}</span>
          </p>
          <div class="of">
            <p class="shape">
              {copy.work.shape(s.grid.rows, copy.work.scenarios[s.id].rowKind, s.grid.cols)}
            </p>
            <p class="sub">{copy.work.jobTally(nf.format(s.options), s.seconds)}</p>
          </div>
        </div>
      </div>
    </article>
  {/each}
</div>

<p class="total">
  <b>{copy.work.totalLead(TOTALS.queries)}</b>
  {copy.work.totalBody(
    TOTALS.searchingSeconds,
    nf.format(TOTALS.options),
    TOTALS.carriers,
    MANUAL_S,
    TOTALS.queries,
    hours.toFixed(1),
  )}
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
    align-items: var(--align);
  }
  .job.flip {
    grid-template-columns: minmax(0, 1fr) var(--w);
  }
  /* every other row is pulled tighter into the list so the four do not fall on
     an even beat */
  .job:nth-child(even) {
    margin-block: calc(-1 * var(--space-4));
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
  /* the copy laps back over the photograph's column; the blob's curve leaves
     the room, and z-index keeps the type off the print itself */
  .body {
    position: relative;
    z-index: 2;
    grid-column: 2;
    grid-row: 1;
    align-content: center;
    max-width: var(--meas);
    margin-inline-start: calc(-1 * var(--pull));
  }
  .flip .frame {
    grid-column: 2;
  }
  .flip .body {
    grid-column: 1;
    justify-self: end;
    margin-inline-start: 0;
    margin-inline-end: calc(-1 * var(--pull));
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
  /* the numeral hangs out past the copy's own left edge on every row — the one
     thing all four do the same way, so the varied alignment above reads as
     composition rather than drift */
  .tally {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--space-3);
    align-items: center;
    margin-top: var(--space-4);
    margin-inline-start: -2.75rem;
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
