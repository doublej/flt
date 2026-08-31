<script lang="ts">
import { BLOBS as BLOB } from '$lib/blobs'
import { getCopy, getLocale } from '$lib/i18n/copy.svelte'
import { MANUAL_S, SCENARIOS, TOTALS, byHandHours } from '$lib/scenarios'
import { onMount } from 'svelte'

let list: HTMLElement

const copy = $derived(getCopy())

/** Four jobs, alternating sides. The search count is set as the item's numeral
 *  and sized off the count itself, so five searches and twenty-eight are told
 *  apart before either number is read. */
const nf = $derived(new Intl.NumberFormat(getLocale() === 'nl' ? 'nl-NL' : 'en-GB'))
/** One decimal, but still through Intl: `1.9` is not what 1.9 looks like in
 *  Dutch, and `.toFixed(1)` always writes a period no matter the locale. */
const nf1 = $derived(
  new Intl.NumberFormat(getLocale() === 'nl' ? 'nl-NL' : 'en-GB', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
)
const hours = byHandHours(TOTALS.queries)

/** Every print is the same size and the same proportion — tall, the way a
 *  portrait is. Varying the proportion per job made the row with the widest
 *  print look like a different component, and the widths it produced were what
 *  drove the copy onto the photograph. What varies now is only placement: which
 *  side the print sits on, how far down the row it is dropped, the angle it was
 *  put down at, and whether it runs off the edge.
 *
 *  indent — how far the whole row is set in from the list's own edge, so the
 *           four do not all start on one vertical
 *  drop — how far down its row the print sits, so the four do not band
 *  rot  — the angle it was put down at, the way prints lie on a desk
 *  out  — this one breaks the list's own edge and runs to the page's */
const SHAPE = {
  gateway: { rot: '-1.6deg', drop: '7rem', indent: '7rem', out: false, iw: 640, ih: 960 },
  ski: { rot: '1.1deg', drop: '3rem', indent: '0rem', out: true, iw: 800, ih: 800 },
  cabin: { rot: '-0.9deg', drop: '0rem', indent: '3rem', out: false, iw: 900, ih: 720 },
  holidays: { rot: '1.7deg', drop: '5rem', indent: '0rem', out: false, iw: 720, ih: 900 },
} as const
const FALLBACK = { rot: '0deg', drop: '0rem', indent: '0rem', out: false, iw: 720, ih: 900 }
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
      class:out={sh.out}
      style:--n={s.queries}
      style:--rot={sh.rot}
      style:--drop={sh.drop}
      style:--indent={sh.indent}
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
    nf1.format(hours),
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
    /* Narrower than it was, and deliberately: the list needs a margin for the
       one print that breaks it to have something to break out of. At the old
       full-bleed width there was no room left and the print could only overflow
       the document. */
    --bleed: min(88rem, calc(100vw - 4 * var(--gutter)));
    /* The wash is 11% wider than its frame on this side and the print is
       rotated on top of that, so the outermost painted pixel sits about this
       far beyond the frame's own box. The break-out is measured against it. */
    --wash-over: 6rem;
    display: grid;
    gap: var(--space-6);
    width: var(--bleed);
    margin-top: var(--space-5);
    margin-inline: calc((100% - var(--bleed)) / 2);
  }

  /* The photograph changes sides down the list so four jobs read as a sequence
     rather than four of the same thing. */
  .job {
    /* The gap is real and the copy no longer laps back over the print. The lap
       relied on the blob's curve leaving slack, but the tally sits at the
       print's vertical midpoint where the blob is at its widest, and the wash
       reaches 11% beyond the frame on top of that — so there was never slack
       there to lap into. */
    --w: 22rem;
    display: grid;
    grid-template-columns: var(--w) minmax(0, 1fr);
    gap: var(--space-6);
    align-items: start;
    /* set in from the list's edge, per row — the first is set in furthest, so
       it starts below and to the right of the paragraph above it rather than
       flush under it */
    margin-inline-start: var(--indent);
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
    /* margin, not a transform: the row has to actually grow around the drop or
       the next print climbs into this one */
    margin-block-start: var(--drop);
  }
  /* One of the four breaks the list's edge and runs at the page's own. What it
     may take is the room outside the list minus the wash's overhang, floored at
     zero — so on a narrow viewport it simply stops breaking out rather than
     pushing the document sideways. Measured, not assumed: an earlier version of
     this pushed by the full gutter, forgot the overhang, and put the document
     at 1502px inside a 1440px window. */
  .job.out {
    /* Floored at zero so a narrow viewport simply stops breaking out, and
       capped so a very wide one does not fling the print halfway to the edge
       of a 2560 display and drag its own row's copy under it. */
    --break: clamp(0px, calc((100vw - var(--bleed)) / 2 - var(--wash-over)), 8rem);
  }
  .job.out.flip .frame {
    margin-inline-end: calc(-1 * var(--break));
  }
  .job.out:not(.flip) .frame {
    margin-inline-start: calc(-1 * var(--break));
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
    aspect-ratio: 3 / 4;
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
    max-width: 32rem;
    /* the copy hangs a little below its print's top, so the pair is not two
       things starting on one line */
    margin-block-start: calc(var(--drop) + var(--space-4));
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
  /* the numeral hangs out past the copy's own left edge on every row — the one
     thing all four do the same way, so the varied alignment above reads as
     composition rather than drift */
  .tally {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: var(--space-3);
    align-items: center;
    margin-top: var(--space-4);
    /* Outdented so the numeral lines up with the quote's hanging opening mark
       rather than with the text after it. */
    margin-inline-start: -2.75rem;
  }
  /* Except when the print is on this side. The copy laps back over the print's
     column on the strength of the blob's curve leaving slack at its edge — but
     the tally sits at the print's vertical midpoint, which is exactly where the
     blob is widest and there is no slack at all. Left as it was, the outdent
     put the whole numeral inside the photograph on the first row and 22px of it
     on the third. So on these rows the tally gives back both the outdent and
     the lap and starts at the column edge; the quote above it still laps,
     because at its own height the curve really has pulled away. */
  /* On the rows where the print is on this side, the outdent would walk the
     numeral back toward it. The gap absorbs it on the flipped rows, where the
     print is a column away. */
  .job:not(.flip) .tally {
    margin-inline-start: 0;
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
    /* English never needs this, but a Dutch compound like "vertrekluchthavens"
       is one unbreakable word — without a hyphenation point it pushes this
       narrow grid column past the viewport on mobile instead of wrapping. */
    hyphens: auto;
    overflow-wrap: break-word;
  }
  .sub {
    font-family: var(--font-mono);
    font-size: 0.78rem;
    color: var(--color-muted);
  }

  /* Stacked. These rules used to be aimed at .who, which is the <img> inside
     .frame and not a grid item at all, so every grid property on it was inert
     and .frame kept its two-column placement. On the flipped rows that left
     `grid-column: 2` standing, which conjured an implicit second track and
     squeezed the copy into 29.6px at 320; on the others .frame and .body stayed
     in the same cell and the quote was printed straight over the photograph,
     512px of it at 800. Placement belongs on .frame — and so does the width, or
     the wash keeps the old full-column box while the print alone shrinks, which
     is what put the wash 7px past the viewport at 800. */
  /* 1100 and not 800. What the copy column gets is the list less the print's
     22rem, less the 96px gap, less this row's indent — so at 801 it came out
     81px wide, 129px at 861 and 259px at 1024, and the quote ran two words to a
     line while the tally hyphenated to "de-part-ure air-ports". The two-column
     list needs about 1140 before that column is worth having; below it the row
     stacks and the copy gets the full width. */
  @media (max-width: 1100px) {
    .jobs {
      gap: var(--space-5);
    }
    .job,
    .job.flip {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-3);
      /* the indent is a two-column composition device; stacked it is just 7rem
         off the front of a 224px column */
      margin-inline-start: 0;
    }
    .frame,
    .flip .frame {
      grid-column: 1;
      grid-row: 1;
      /* 22vw is exactly 11rem at 800, so every width that already stacked keeps
         the print it had and only the range this breakpoint just took over
         grows one — 11rem on a 1024 screen reads as a thumbnail. */
      width: clamp(11rem, 22vw, 17rem);
      margin-block-start: 0;
    }
    .body,
    .flip .body {
      grid-column: 1;
      grid-row: 2;
      justify-self: start;
      margin-block-start: 0;
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
