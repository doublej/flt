# Bureau — chart briefing

A specification for the graphs on the marketing site. No implementation, no library choice, no Svelte.

The page now has five sections and one chart. Everything below is written against that page, not the
nine-section dark version this document used to describe. Four proposals, ranked. Two of them are edits
to the chart that already ships, one is a new picture, and one says *do not draw this*.

---

## Read this first

I re-ran every number in the brief against the cache and the code. **The brief was right about all of it**,
including the five items it resolved, and I could reproduce each one to the digit. Three things are worth
recording precisely, because two of them were stated loosely last time and one is new.

### The seven-day cap is real, and it is not on the path we use

My earlier claim — "there is no seven-day cap anywhere in the code" — was wrong as written. `MAX_RANGE_DAYS = 7`
exists at `packages/core/src/search.ts:10`. But it is used in exactly one place, `search.ts:55`, inside a
**private** `dateRange` declared at `search.ts:52` that only `buildDatePairs` calls. That is the shared search
path behind the web API.

`flt matrix` imports a **different** `dateRange`, from `packages/core/src/date-range.ts:15`
(`matrix.ts:10`), which has no cap at all. Its one-way loop fetches every day in the range;
`--limit` truncates printed rows after the fetching is done. So:

> The seven-day cap governs the web search path. `flt matrix`, which produced every number on this page, is
> uncapped on one-way date ranges. The only cap it enforces is 21 departure × return combinations, and only
> on round trips (`matrix.ts:241`). `MAX_TOTAL_SEARCHES = 21` (`search.ts:11`, applied at `search.ts:79`) is
> the same limit on the web path.

The practical conclusion stands, and the page's current line about the 21-combination cap is correct. The
seven-day windows in these runs were a choice.

### The 235 seconds reconciles exactly

I found the 75-search window in the cache by searching for the contiguous run whose offer counts sum to 2,942.
It is the last 75 of the 140 searches on disk. Every figure lands:

| Figure | Value | Source |
|---|---|---|
| searches | 75 | window length |
| options | 2,942 | sum of `offerCount` |
| nonstop options | 176 (6.0% of 2,942) | options with an empty `layovers` list |
| layover appearances | 3,314 | sum of `len(layovers)` |
| distinct layover airports | 66 | — |
| round-trip searches | **0** | `return_date` null on all 75 |
| cabins | 68 economy + 7 premium-economy | the cabin job is 7 dates × 2 cabins |
| first search to last | 235 s | `(max − min) / 1000` |
| gaps over 5 s | 16.97 + 10.30 + 8.31 = 35.58 s | 200 + 35.58 ≈ 235 |

`LAYOVER_TOP` also reproduces exactly: LHR 486, CDG 437, FRA 355, MUC 271, BKK 120, ZRH 111. The next two are
KUL 110 and LCY 106, close enough that "the top six" is a slightly arbitrary cut and the caption should say
*six most common*, never *the six that matter*.

All nine `SPREADS` rows reproduce to the euro. So does `CABIN`: seven premium-economy searches on
AMS–SIN, minimum €822 on every one of them, spread €0.

### The signal colour is used twice on the page, with opposite meanings

`--color-signal` appears in exactly two places (`+page.svelte:235` and `FareRange.svelte:103,117,151`).
The hero paints **"€9 on Lyon"** red — the *smallest* number in the dataset. Six hundred pixels later
FareRange paints **JFK's €147** red — the *largest*. Same colour, same scroll, opposite arguments, and
nothing tells the reader they are not the same claim.

The design rule in `app.css:9-10` says signal red is used once per screen on the number that carries the
argument. Two numbers cannot both carry it. **This must be resolved before either fix below ships**;
my recommendation is in proposal 2.

---

## Rules that bind every chart here

- **Two inks, and the second is rationed.** Pine `#0b5f52` (`--color-primary`) draws every mark by default.
  Signal red `#c34527` (`--color-signal`) is not a category colour, a highlight colour or an accent — it
  marks the one number the section is arguing about, at most once per section, and never on two numbers that
  mean different things (see above). Axes, ticks and captions are muted `#667069`; rules are `#dcded6`;
  any panel ground is surface `#fbfbf8` on the paper `#f2f3ee`.
- **Marks are lines and dots, not areas.** No filled bars, no filled areas, no gradients. The stock is paper
  and the existing chart is drawn in hairlines; a solid block of pine would be the heaviest thing on the page
  and would outrank the headline. Weight, not fill, is how a mark becomes emphatic — FareRange goes 2px → 3px
  and that is the correct amount.
- **Colour is never the only encoding.** Every emphasised row also carries its value printed in mono. A reader
  who sees no colour still gets the number and the ranking.
- **Text equivalent, always.** Every chart is a `<figure>` with a real `<figcaption>` stating the same fact in
  a sentence, visible, not hover-only, not `aria-label`-only. FareRange's caption is the house pattern.
- **Figures in IBM Plex Mono with `font-variant-numeric: tabular-nums`.** Labels in IBM Plex Sans. Newsreader
  is for headings and never for a numeral — a serif with old-style figures in a chart gutter will not align.
- **No percentage without its denominator on the page.** 6.0% nonstop is fine because 176 and 2,942 are both
  printable. "Most flights connect in Europe" is not, and never will be from this data.
- **No chart may imply booking, holding, live inventory, fare rules, baggage, taxes, CO2 or loyalty.** Every
  price is a one-way display price scraped from public Google Flights results at one moment. "Cheapest" always
  means "cheapest we saw", and each section says so once in full.

---

## The chart that ships: FareRange

Nine routes on a shared €60–€650 axis, each a segment from its cheapest departure date to its dearest, dot at
each end, spread in the right gutter, widest spread in red. Sorted descending by spread.

I read `FareRange.svelte` line by line. The sort is correct, the percentage arithmetic is correct, no segment
is clipped by the axis, and the caption already does the three things a caption must. What follows is a
critique of the design, not a bug list.

### The shared axis earns itself, comfortably

It does two jobs with one geometry: **position** shows what the flight costs, **length** shows what a week of
flexibility is worth. It also gets a third thing free — the four ski routes cluster in the left twelfth of the
axis and the five long-hauls occupy the right two-thirds, so the reader sees *two different kinds of trip*
without a grouping, a legend or a facet. Nine small multiples would need nine axes and would destroy that.
Keep it.

The cost is real and lands on the worst possible row. In the left twelfth, Geneva's €30 and Innsbruck's €37
are about five pixels apart and read as identical, and **Lyon's €9 is roughly one and a half pixels — a
segment shorter than its own end dots**. The hero's punchline route is, in the chart, invisible.

My verdict: **leave it, and say so in the caption.** A line you cannot see is the correct picture of €9, and
the printed €9 in the gutter carries the row. Do not add a minimum segment width — a floor would be the only
actual lie available in this chart, because it would draw a spread that does not exist. One sentence in the
caption ("the shortest lines are the point; every spread is printed") is the whole fix.

### The non-zero baseline is defensible, and for a better reason than the caption gives

The caption says "the axis starts at €60, not zero," which is honest but concedes too much. The
truncation objection applies to **bars**, where length is measured from zero and therefore *is* the value.
Here length encodes the **spread** and position encodes the **fare**, and neither is distorted by moving the
origin: a €147 spread is the same number of pixels wherever it sits on the axis. €60 also sits below the
cheapest value in the set (€84), so nothing is clipped and no dot is pinned to the wall.

Defensible as labelled. Keep the sentence — it costs nothing and it pre-empts the objection — but this is
not a chart with a truncation problem.

### The proportional-versus-absolute question — my verdict

**The red highlight does not lie about what it draws, but the chart as a whole teaches a rule that the section
directly above it says is false. That is the real problem, and it is bigger than the red.**

Sorted by absolute spread:

| Route | Low | High | Spread | % of low |
|---|---|---|---|---|
| Innsbruck | 84 | 121 | €37 | **44.0%** |
| Singapore | 335 | 479 | €144 | 43.0% |
| New York JFK | 400 | 547 | **€147** | 36.8% |
| Newark | 400 | 544 | €144 | 36.0% |
| Turin | 109 | 148 | €39 | 35.8% |
| Geneva | 89 | 119 | €30 | 33.7% |
| Philadelphia | 490 | 625 | €135 | 27.6% |
| Boston | 432 | 534 | €102 | 23.6% |
| Lyon | 119 | 128 | €9 | 7.6% |

Two things follow.

**First, absolute is the right thing to rank by, and I would not change it.** You save euros, not percentages.
€147 off New York is a hotel night; 44% off Innsbruck is €37 and buys lunch. The hero is an absolute-euro
argument ("€147 on New York. €9 on Lyon.") and the chart is consistent with it. Ranking or colouring by
percentage would put Innsbruck at the top with a five-pixel line while a long grey line sat below it, and a
red mark shorter than its unmarked neighbours reads as a rendering error, not as a finding.

**Second, the chart nevertheless argues something false.** On a shared axis with absolute lengths, expensive
routes have longer segments almost mechanically. Sort by spread and you get, top to bottom, five long-hauls
then four short-hauls, with one exception. The reader takes away *long-haul rewards flexibility, short-haul
does not* — which is exactly the rule the section headline denies ("nothing about the route tells you which in
advance"). And the data refutes it: the largest proportional swing in the set is Innsbruck, an €84 hop.

So the fix is not to the red. The fix is to put the second number where the eye already goes. That is
proposal 1.

---

## 1. Print the percentage next to the euro spread — **do this first**

**Question it answers**
"€147 sounds like a lot and €37 sounds like nothing. Are they the same kind of thing?"

**Form, and why not a chart**
No new mark, no new row, no new geometry. The right gutter already prints `€147`; it prints `€147 · 37%`
instead. The obvious alternative is a second chart, or a second axis, or a toggle between absolute and
proportional views. All three cost a section on a page whose entire point is that it is short, and all three
make the reader choose a framing when what they need is to see both at once. A toggle is the worst of them:
it hides half the argument behind an interaction and screen-reads as one view or the other.

**Data shape** — already in `SPREADS`. Nothing new is computed but `(high − low) / low`.

**Encoding**
- Gutter widens from `3.5rem` to about `6rem`; the euro figure keeps its current weight and colour, the
  percentage sits after a middot at ~0.8× size in muted.
- The percentage is never coloured, never sorted on, never the emphasised figure. It is the check on the
  euro figure, not a rival to it.
- Round to whole percent. `37%`, not `36.75%` — the underlying prices moved in whole euros and a decimal
  implies a precision the scrape does not have.
- Sort order does not change. Absolute descending.

**Three-second takeaway**
The longest line is not the biggest swing.

**Must not imply**
- That the percentage is a discount, a saving, or a rate you can expect. It is (dearest − cheapest) ÷ cheapest
  on one week of one route, and the denominator is printed on the same line.
- That percentages are comparable across the two windows — the ski week and the December week are different
  months of different demand.

**Data exists?** Yes, entirely derived from what is already on screen.

---

## 2. Seven day-dots per row — **the one new picture, and it costs no space**

**Question it answers**
"You say the week was worth €147. Was it a slope I could have guessed, or one day I would have missed?"

**Form, and why not small multiples**
Each row already has a full-width `.scale` span with a segment on it. Add **seven small dots**, one per
departure date, each at that date's cheapest fare. The range endpoints stop being the whole story and become
the outer two of seven. No new rows, no new axis, no legend, no second chart, and the footprint of the figure
does not change by a pixel.

Nine sparkline small multiples would answer the same question and would need nine axes, nine labels and about
four hundred pixels of page. On a page distilled from nine sections to five that is not affordable, and it
would push the pricing section below a second fold.

What the dots show, from the cache:

| Route | Seven daily cheapest, in date order | Shape |
|---|---|---|
| Singapore, 3–9 Nov | 410 · 450 · **335** · 479 · 362 · 479 · 479 | one spike |
| New York JFK, 19–25 Dec | 547 · 511 · 484 · **400** · 441 · 441 · **400** | two troughs |
| Philadelphia, 19–25 Dec | 625 · 590 · 508 · **490 · 490 · 490 · 490** | step down, then flat |
| Boston, 19–25 Dec | 534 · 534 · 449 · 433 · 433 · 433 · **432** | step down |
| Innsbruck, 16–22 Jan | 121 · **84** · 92 · 88 · 113 · 92 · 98 | jagged |
| Lyon, 16–22 Jan | **119** · 128 · 120 · 120 · 120 · 120 · **119** | flat |

Singapore is the argument: €335 on one single day, €479 on three of the seven, and the cheap day is a Thursday
sitting between two dearer ones. No rule about weekends, no rule about booking Tuesdays, no slope. Lyon is the
control — seven dots on top of each other is what "flexibility was worth nothing" actually looks like.

**Data shape**

```
{ route: string      // "Amsterdam → Singapore"
  window: string     // "3–9 Nov"
  days: Array<{ date: string; cheapest: number }>   // exactly 7, date order
}
```

Nine routes × 7 = 63 numbers. Not currently in `scenarios.ts`; `SPREADS` carries only the min and max.
Regenerate with the same cache walk `scenario-stats.py` already does — group the 75 searches by
`(from_airport, to_airport, seat)`, keep `seat == 'economy'`, take the minimum parsed price per
`departure_date`. I ran exactly this and the min and max of each series match `SPREADS` on all nine routes,
which is the check that the new array and the old one describe the same runs.

**Encoding**
- x: existing shared price axis. Unchanged.
- y: none. All seven dots sit on the row's own baseline, overlapping where prices repeat.
- Dots: 4px, pine, hairline, no fill — smaller and lighter than the existing 7px end dots, which stay as they
  are so the range still reads as a range. Overlapping dots are correct and must not be jittered: a pile of
  dots *is* the finding.
- The segment stays. Dots sit on it.
- No date labels on the dots. Seven labels per row × nine rows is 63 labels and would bury the chart. The
  window is already in the data and belongs in the caption, not on the marks.
- Order of routes unchanged.

**Three-second takeaway**
The cheap day is one day, and it is a different day on every route.

**Must not imply**
- **That any weekday is cheap.** The three windows are in three different months with different demand, so the
  weekday alignment across jobs is coincidence. Never label the dots Mon–Sun and never say "book on a Tuesday".
  Within one window the comparison is fair; across windows it is not.
- That the dots are flights or offers. Each dot is the cheapest of many options seen on one departure date.
- That a low dot is still there. Same caveat as the segment: display price, one moment, one-way.
- That the seven dots are a price history. They are seven different departure dates priced at the same moment,
  not one date priced over seven days. This is the single most likely misreading of this chart and the caption
  must close it explicitly: *"Seven departure dates, all priced in the same afternoon."*

**Data exists?** Yes, in the cache, verified. It needs one new export in `scenarios.ts`.

---

## 3. Cabin: one line moving, one line flat — **yes, but as an aside, not a chart**

**Question it answers**
"Should I bother being flexible if I'm flying premium economy?"

**Verdict: it earns a place, and it must displace one of the two existing asides.** A flat line against a
moving one is an unusual picture and it makes a product point nothing else on the page makes — whether
flexibility is worth anything depends on the *cabin*, not only the route. Amsterdam–Singapore, same week,
both cabins: economy moved €335 to €479 across the seven days; premium economy was €822 on every single one
of them. Verified — seven premium-economy searches, minimum €822 on all seven, spread €0.

**Form, and why it cannot join FareRange**
€822 is above FareRange's €650 ceiling. Adding it forces the axis to ~€900, which squeezes all nine existing
segments by a third and shrinks Lyon's €9 to under a pixel. It has to live elsewhere.

The `.asides` grid is `auto-fit / minmax(20rem, 1fr)`, so a third card either makes a 3-up at wide widths or
leaves an orphan. Adding one is not free. **Replace the route-graph aside** — the 62,425-routings number is
interesting but it is about how the engine picks what to search, not about what the traveller gets, and it
carries the heaviest caveat load on the page for the least commercial return. Keep the Gulf aside; it is the
only place the avoid-a-hub feature appears at all.

**What it looks like**
A single small figure inside the aside card, about 5rem tall, no axis frame:

- Two horizontal-time lines, seven points each, sharing one vertical price scale from about €300 to €850.
- Premium economy: a dead-flat pine line across the top with seven dots on it, labelled `€822 every day`.
- Economy: a jagged pine line in the lower third, labelled `€335–€479`.
- The vertical distance between them is half the argument and must not be compressed. A shared scale is
  mandatory here; two separately-scaled sparklines would make the flat line look like the moving one.
- The economy line is the one that gets weight (2px vs 1px), because it is the one doing something.

Text equivalent, and honestly the version I would ship first, because it may be sufficient on its own:

> Same route, same week, both cabins. Economy moved between €335 and €479 depending on the day. Premium
> economy was €822 on all seven — the same fare every day. Being flexible was worth €144 in one cabin and
> nothing in the other.

**Must not imply**
- **That premium economy never varies.** Seven observations on one route in one week. A flat line means the
  same cheapest fare was showing on each date, not that the cabin is immune to date.
- That €822 is the premium economy price, or a fair comparison of value. No baggage, no seat pitch, no fare
  conditions — display price only, and the page says so.
- That the €487 gap between cabins is what an upgrade costs. It is the gap between two cheapest-we-saw
  figures, not an upgrade fee.

**Data exists?** Yes for the two summary numbers (`CABIN` in `scenarios.ts`). The seven daily premium points
are all €822 and the seven economy points come from the same array proposal 2 needs — build proposal 2 first
and this one is nearly free.

---

## 4. The Gulf comparison — **do not restore it as a chart**

**Question it would answer**
"I would rather not change planes in Dubai. What does that cost?"

**Recommendation: leave it as the prose aside it is now.** This was chart 1 in the previous version of this
document, it was built, and the distillation removed it. That was the right call and I would not reverse it.

Four bars — €335 / €408 for Singapore, €320 / €320 for Hanoi — carry four numbers, and the aside already
carries all four in two sentences that read faster than the chart does. The picture's only advantage was the
recognition that one pair steps up and one pair is level, and the prose states that outright ("on the Hanoi
brief the same preference cost nothing at all"). A chart that needs a sentence to explain its own point should
be the sentence.

There is a second reason, and it is the stronger one. Two bars per group invites the reader to compute the
difference themselves and remember €73 as *the* price of avoiding the Gulf. There is no such number — the
whole finding is that it is €73 on one route and €0 on another, and a chart is a poor instrument for arguing
that a number does not exist. Prose can say "it depends" in three words. A bar chart cannot say it at all.

The same verdict applies to the route-discovery numbers now in the second aside, for the same reason: 16 /
1,034 / 62,425 is unplottable on a linear axis and requires teaching a log axis before the reader can read it,
and the caveat load ("possible routes rather than offers: no price, no timetable check, nothing you can book")
is longer than any chart it could sit under. Prose, or three numerals if it ever needs more weight — never a
graph. If proposal 3 displaces this aside, the numbers can go in the pricing kicker or nowhere; nothing is
lost.

**If it is ever restored**, the caption must use the word *connect* or *layover* and nothing else.
`filter.ts:56-58` is `o.layovers.some((l) => hubs.has(l.airport))` — it matches connecting airports only. It
cannot exclude an origin or a destination, it does not read the operating carrier, and a nonstop flown by a
Gulf airline survives `--exclude-region gulf` untouched. Never label the feature "avoid Emirates" or "avoid
the Middle East". `--exclude-region` is sugar: `mergeExclusions` (`regions.ts:20-27`) expands region names to
IATA codes and concatenates them into the single `excludeHub` string before `applyFilters` runs, so regions
and airports are one mechanism, not two. Carrier exclusion is a substring test plus a flight-number-prefix
test (`filter.ts:49-54`), which is the marketing carrier and not necessarily the operator — codeshares slip
through, and nothing on the site may promise a named airline is gone.

---

## Ranked summary

| # | Proposal | Form | Verdict |
|---|---|---|---|
| 1 | Percentage beside the euro spread in FareRange's gutter | Two characters of text | **Do first.** Kills the false "long-haul rewards flexibility" rule the chart currently teaches, for no new ink. |
| 2 | Seven day-dots on each FareRange row | Dots on the existing segments | **Build.** Turns a range into a distribution inside the same footprint; the Singapore spike is the best evidence on the page. Needs one new array in `scenarios.ts`. |
| 3 | Cabin: economy moves, premium is flat | Two shared-scale lines in an aside card | **Build after 2**, and only by replacing the route-graph aside. Ship the sentence first; it may be enough. |
| 4 | Gulf comparison, and route discovery | **Nothing** | **Leave as prose.** Both arguments are about a number that does not generalise, which is the one thing a chart cannot say. |

**Blocking, ahead of all four:** the signal red is on Lyon in the hero and on JFK in the chart, meaning opposite
things two screens apart. Pick one. My recommendation is to **drop FareRange's red to pine and leave the hero
red alone** — the chart's argument is the whole spread of nine routes, not one winner, and the row it currently
singles out is not the row the data says is most extreme. That also restores the once-per-screen rule the
palette was built on, and it makes proposal 1's percentage column the thing that ranks the rows, which is
where the ranking belongs.

---

## Open numbers

None. Every figure this document uses was reproduced from `$TMPDIR/flt/session.json`, the result cache, or
the source files cited by line. The one array it asks for that does not yet exist — seven daily cheapest fares
per route, for proposal 2 — I computed from the cache and cross-checked against `SPREADS` on all nine routes
before proposing it.
