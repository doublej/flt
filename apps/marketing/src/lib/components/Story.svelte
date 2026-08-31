<script lang="ts">
import { BLOBS as BLOB } from '$lib/blobs'
import { getCopy, getLocale } from '$lib/i18n/copy.svelte'
import { STORIES, type Story } from '$lib/scenarios'
import { onMount } from 'svelte'

/** One job from `STORIES`, set into whichever band its figures argue for. The
 *  work band shows four of these at once and needs a composition to keep four
 *  from reading as a mechanism; a story is alone in its band, so it needs none
 *  of that — a rule above it, a print, a quote, and the counting line the grid
 *  uses. `side` is the only placement control, and it exists so the five do not
 *  all sit on one edge as you scroll past them. */
let { id, side = 'left' }: { id: Story['id']; side?: 'left' | 'right' } = $props()

let root: HTMLElement

/* A missing id would render a blank aside in the middle of a band, which is
   worse than a page that stops. */
const story = $derived.by(() => {
  const s = STORIES.find((x) => x.id === id)
  if (!s) throw new Error(`Story.svelte was given an id that is not in STORIES: ${id}`)
  return s
})

const copy = $derived(getCopy())
const text = $derived(copy.stories[id])
const nf = $derived(new Intl.NumberFormat(getLocale() === 'nl' ? 'nl-NL' : 'en-GB'))

/** Print and wash are clipped to two different blobs so the two outlines never
 *  coincide, same as the work band. The four paths in `blobs.ts` are reused
 *  rather than five more being generated: no two stories are ever on screen
 *  together, so a repeat cannot be seen. Ids are prefixed and carry the story's
 *  own name, which is what keeps them out of the work band's `blob-*` defs. */
const ids = Object.keys(BLOB) as (keyof typeof BLOB)[]
const n = $derived(STORIES.indexOf(story))
const clip = $derived(ids[n % ids.length])
const wash = $derived(ids[(n + 2) % ids.length])
/** The angle it was put down at. Off the index, so the five differ and none of
 *  them is straight. */
const rot = $derived(`${[-1.4, 1.2, -0.8, 1.6, -1.1][n % 5]}deg`)

/* Reveal once, then let the print and the copy travel at different rates while
   the row crosses the viewport — the same two moves the work band makes, minus
   its own list mechanics. fromTo with immediateRender off, never `from`: a
   reveal that hides its content up front leaves the aside blank for good if the
   trigger is ever measured against a stale layout. */
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
      gsap.fromTo(
        root,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          immediateRender: false,
          scrollTrigger: { trigger: root, start: 'top 92%', once: true },
        },
      )
      const scrub = { trigger: root, start: 'top bottom', end: 'bottom top', scrub: 0.6 }
      gsap.fromTo(
        root.querySelector('.wash'),
        { y: 46, scale: 1.05 },
        { y: -46, scale: 0.98, ease: 'none', scrollTrigger: scrub },
      )
    }, root)

    /* the print is lazy, so its box can land after the trigger was measured */
    const img = root.querySelector('img')
    if (img && !img.complete) {
      img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
    }
  })()

  return () => ctx?.revert()
})
</script>

<svg class="defs" aria-hidden="true" focusable="false">
  <defs>
    <clipPath id="story-{id}-print" clipPathUnits="objectBoundingBox">
      <path d={BLOB[clip]} />
    </clipPath>
    <clipPath id="story-{id}-wash" clipPathUnits="objectBoundingBox">
      <path d={BLOB[wash]} />
    </clipPath>
  </defs>
</svg>

<figure class="story" class:right={side === 'right'} bind:this={root}>
  <div class="frame">
    <span class="wash" aria-hidden="true" style:clip-path="url(#story-{id}-wash)"></span>
    <img
      src="/img/people/{id}.webp"
      alt=""
      width="720"
      height="960"
      loading="lazy"
      style:clip-path="url(#story-{id}-print)"
      style:rotate={rot}
    />
  </div>

  <figcaption>
    <p class="when">{story.window}</p>
    <blockquote>{text.ask}</blockquote>
    <p class="route">{story.route}</p>
    <p class="point">{text.point(story.low, story.high, story.high - story.low)}</p>
    <p class="tally">
      <b>{story.queries}</b>
      {copy.work.countUnit} · {copy.work.shape(story.grid.rows, text.rowKind, story.grid.cols)} ·
      {copy.work.jobTally(nf.format(story.options), story.seconds)}
    </p>
  </figcaption>
</figure>

<style>
  .defs {
    position: absolute;
    width: 0;
    height: 0;
  }

  /* An aside inside a band, not a section of its own: the rule above it is what
     says the argument just stopped being made in charts and started being made
     by a person. Narrower than the band's own measure, and pushed to whichever
     edge `side` names, so the five do not stack up one under the other. */
  .story {
    --w: 15rem;
    display: grid;
    grid-template-columns: var(--w) minmax(0, 1fr);
    gap: var(--space-5);
    align-items: center;
    /* Deliberately short of the band's own 74rem: an aside that runs the full
       measure reads as another section rather than as an interruption, and the
       copy beside a 15rem print then sets lines nobody wants to read. Every
       block inside it is capped again below, so the quote, the point and the
       counting line each break before the column does. */
    max-width: 52rem;
    margin: var(--space-6) 0 0;
    padding-top: var(--space-5);
    border-top: 1px solid var(--color-border);
  }
  .story.right {
    grid-template-columns: minmax(0, 1fr) var(--w);
    margin-inline-start: auto;
  }
  .frame {
    grid-column: 1;
    grid-row: 1;
    position: relative;
    isolation: isolate;
  }
  .right .frame {
    grid-column: 2;
  }
  figcaption {
    grid-column: 2;
    grid-row: 1;
    max-width: 33rem;
  }
  .right figcaption {
    grid-column: 1;
    justify-self: end;
  }

  /* generously larger than the print so it never uncovers a corner as the print
     turns, and always the other blob, never the print's own */
  .wash {
    position: absolute;
    inset: -8% -10% -6% -11%;
    z-index: 0;
    background: color-mix(in oklab, var(--color-primary) 13%, var(--color-bg));
  }
  img {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 4;
    object-fit: cover;
    object-position: 50% 38%;
  }

  .when {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-muted);
  }
  /* Smaller than the work band's quote on purpose: that one is the section's
     subject, this one interrupts a section that already has one. */
  blockquote {
    margin: 0.45rem 0 0;
    /* Display type sets fewer characters to the line than body type does, so it
       gets its cap in ems off its own size rather than in rem. */
    max-width: 20em;
    font-family: var(--font-display);
    font-size: clamp(1.15rem, 1.7vw, 1.5rem);
    line-height: 1.3;
    letter-spacing: -0.01em;
    text-wrap: pretty;
    /* hang the opening quote in the margin so the first word starts on the same
       vertical as the date above it */
    text-indent: -0.4em;
  }
  blockquote::before {
    content: "“";
  }
  blockquote::after {
    content: "”";
  }
  .route {
    margin-top: 0.6rem;
    max-width: 30rem;
    font-size: 0.88rem;
    line-height: 1.5;
    color: var(--color-muted);
  }
  /* What the two fares were. The one line here that is doing the arguing, and
     short of `--measure` on purpose: 62ch is right for a section's lead, too
     long for three sentences set next to a photograph. */
  .point {
    margin-top: var(--space-3);
    max-width: 46ch;
    font-size: 0.95rem;
    line-height: 1.6;
  }
  /* No cap of its own: it is one short mono line, and 46ch broke the longest of
     the five across two lines mid-tally. The figcaption's own width holds it. */
  .tally {
    margin-top: var(--space-3);
    font-family: var(--font-mono);
    font-size: 0.72rem;
    letter-spacing: 0.02em;
    color: var(--color-muted);
  }
  .tally b {
    font-weight: 600;
    color: var(--color-primary);
    font-variant-numeric: lining-nums tabular-nums;
  }

  @media (max-width: 800px) {
    .story,
    .story.right {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-3);
      margin-inline-start: 0;
    }
    .frame,
    .right .frame {
      grid-column: 1;
      grid-row: 1;
      width: 9rem;
    }
    figcaption,
    .right figcaption {
      grid-column: 1;
      grid-row: 2;
    }
  }
</style>
