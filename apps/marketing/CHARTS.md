# Bureau — chart briefing

A specification for the graphs on the marketing site. No implementation, no library choice, no Svelte.
Six proposals, ranked. Two of them say "do not draw a chart here" and explain what to do instead.

---

## Read this first: where the brief and the code disagree

I checked every claim in the brief against `packages/core/src/filter.ts`, `regions.ts`, `connections.ts`,
`routes.ts`, `apps/cli/src/commands/matrix.ts` and `connections.ts`, and re-ran the connection counts.
Most of the brief held. Six things did not, and three of them change what a chart is allowed to say.

### 1. "7 days per search" is not an engine cap. It is house practice.

There is no seven-day limit anywhere in the code. `flt search` takes one departure date.
`flt matrix` takes a date range, and on the one-way path it fetches **every day in the range with no cap at all**
(`apps/cli/src/commands/matrix.ts:213-233`); `--limit` only truncates the printed rows after all the fetching is done.

The real cap is narrower and applies only to round trips: `matrix.ts:241` refuses more than **21 departure × return
date combinations**. `flt prime` documents it as "max 21 combos; 5–7 is safer" (`prime.ts:12`), which is advice,
not a limit.

**Consequence for copy and charts:** do not print "7 days per search" as an engine limit next to a chart.
The honest limit line is: *"Round-trip date grids are capped at 21 date combinations. Everything else is a
choice we made, not a wall we hit."* The seven-day windows in the four jobs are a decision, and saying so is
better for the site than pretending to a constraint that is not there.

### 2. The four job durations do not add up to the stated total.

`12 + 75 + 37 + 76 = 200` seconds. `TOTALS.seconds` in `apps/marketing/src/lib/scenarios.ts:90` is **235**.
Every other total reconciles exactly: options `135+575+1060+1172 = 2942`, searches `5+28+14+28 = 75`,
days `22` minus one overlapping calendar day (3 November appears in both the gateway and cabin jobs) `= 21`,
routes `= 14`.

`days` and `carriers` are documented as distinct counts, so the shortfall there is expected. `seconds` cannot
be a distinct count. So either the total includes idle time between jobs, or one of the five figures is wrong.

**Consequence:** no chart may stack or sum the four job durations toward 235. Four bars that visibly total 200
under a headline reading 235 is a 17% gap a careful reader will find. Until this is resolved, use per-job seconds
or the total, never both in the same picture. Listed again in **Open numbers** at the bottom.

### 3. `--exclude-region` is not a filter concept. It is sugar for `--exclude-hub`.

`FilterOpts` (`filter.ts:3-14`) has `excludeHub` and `excludeCarrier` and nothing else. `mergeExclusions`
(`regions.ts:21`) expands region names to IATA codes and concatenates them into the single `excludeHub` string
before `applyFilters` ever runs. The region names and their airports in the brief are correct, and they are
mixable with raw IATA codes exactly as described.

**Consequence:** a chart may not show "regions" and "airports" as two different kinds of thing. There is one
mechanism: a list of airport codes.

### 4. Hub exclusion matches layover airports only, and nothing else.

`filter.ts:56-60` is `o.layovers.some((l) => hubs.has(l.airport))`. It cannot exclude an origin or a destination,
and it does not look at the operating carrier's nationality. A nonstop flown by a Gulf-based airline that does not
stop in the Gulf survives `--exclude-region gulf` untouched.

**Consequence:** never label this feature "avoid Emirates" or "avoid the Middle East". It filters options that
**connect** through a listed airport. The chart caption must use the word *connect* or *layover*.

### 5. Carrier exclusion is best-effort, not exact.

Name matching is a substring test (`filter.ts:50`, `.includes(c)`), and the two-letter form tests the
**flight number prefix** (`filter.ts:52`), which is the marketing carrier and not necessarily the operator.
Codeshares can slip through. Nothing on the site should promise that a named airline is definitely gone.

### 6. The connection counts are real, and they are capped by a detour budget.

I re-ran all five figures. Every one matched to the digit:

| Query | Result |
|---|---|
| `connections AMS HAN --max-stops 1` | 16 |
| `connections AMS HAN --max-stops 2` | 1,034 |
| `connections AMS HAN --max-stops 3` | 62,425 |
| `connections AMS HAN --max-stops 3 --exclude-region gulf` | 57,035 |
| `connections AMS SIN --max-stops 2` | 2,698 |

Wall clock for the AMS→SIN run was 0.19 s including Bun start-up, consistent with the 0.16 s claim.
The graph figures in the brief match the header of `routes.ts` exactly: 3,409 origin keys, 3,425 airports,
19,257 undirected city pairs, 37,595 directed entries.

Two qualifiers the brief omits, both of which must reach the page:

- **These are routes within 3× the great-circle distance.** `findConnectionRoutes` defaults `maxDetour = 3.0`
  (`connections.ts:91`). The counts are not "all routes", they are "all sane-ish routes". The label must say so.
- **The graph is undirected.** `buildRouteGraph` adds both directions for every entry (`routes.ts:26-28`).
  A route the graph offers may only be flown one way in the real world. This is a second reason, on top of the
  ones the brief already lists, that these routings are theoretical.

Also worth knowing for anyone regenerating these numbers: `maxResults` defaults to 50 and the search itself
stops at `maxResults * 10` (`connections.ts:103`). The counts above only reproduce with `--max-results` raised
above the answer.

---

## Rules that bind every chart here

- **One accent.** Amber `#f0a030` on the dark ground `#0c0e14`, surface `#161b22` for plot backgrounds where a
  panel is wanted. Everything that is not the point of the chart is muted `#7d8590`. No second accent colour is
  proposed anywhere in this document, and none is needed.
- **Colour is never the only encoding.** Every series is also separated by position, and every bar carries its
  own printed value in Departure Mono. A reader who sees no colour at all still gets the number.
- **Text equivalent, always.** Every chart ships with a real sentence or a real table stating the same fact,
  visible to screen readers and not hidden behind a hover. The existing accordion in `Scenarios.svelte` is the
  house pattern for this and should be reused rather than reinvented.
- **No percentage without its denominator on the page.** See chart 3, where the obvious percentage is not
  available and must not be invented.
- **Numerals in Departure Mono with tabular figures**, prose in Space Grotesk, matching `.num` and `.cap`
  in `Scenarios.svelte`.
- **No chart may imply booking, holding, live inventory, fare rules, baggage, taxes, CO2 or loyalty.**
  Prices are display prices scraped from public Google Flights results at one moment in time. The word
  "cheapest" always means "cheapest we saw", and at least one chart caption per section must say so in full.

---

## 1. The price of a preference — **the one chart that earns its place**

**Question it answers**
"I would rather not change planes in Dubai. What is that going to cost me?"

**Chart type, and why**
Two groups of two bars. Grouped, not stacked, and not a single "difference" bar.

The obvious alternative is one bar showing €73, the cost of avoiding the Gulf on the Singapore route. That is a
worse chart, because a single number invites the reader to remember it as *the* answer, and the whole point of
the feature is that there is no such number. Two routes side by side, one where the preference costs money and
one where it is free, makes the variability the subject rather than a caveat. A table would carry the same four
numbers and none of the "one pair is level and one pair steps up" recognition that lands without reading.

**Data shape**

```
{ route: string          // "Amsterdam → Singapore"
  scope: "all" | "no-gulf"
  cheapestEur: number    // integer EUR, display price
  optionsSeen: number    // integer count
  optionsViaGulf: number // integer count, subset of optionsSeen
}
```

Four rows:

| route | scope | cheapestEur | optionsSeen | optionsViaGulf |
|---|---|---|---|---|
| Amsterdam → Singapore | all | 335 | 1060 | 113 |
| Amsterdam → Singapore | no-gulf | 408 | 1060 | 113 |
| Amsterdam → Hanoi (5 gateways) | all | 320 | 135 | 50 |
| Amsterdam → Hanoi (5 gateways) | no-gulf | 320 | 135 | 50 |

**Encoding**
- x: the two route groups, Singapore first, Hanoi second.
- y: cheapest EUR seen, **from zero**. Not a truncated axis. The €73 gap is real and does not need exaggerating,
  and a truncated axis on a price chart is the single most common way to lie with a bar.
- colour: the *no-gulf* bar is amber, the *all options* bar is muted. Two bars per group, touching, no gap inside
  the pair and a wide gap between pairs.
- size: not used.
- order: Singapore first so the reader learns "it costs something", Hanoi second so the surprise is the ending.
- Each bar prints its own euro figure above it in mono. The gap in each group is annotated: `+€73` and `+€0`.

**Three-second takeaway**
The same preference costs €73 on one route and nothing on another.

**Must not imply**
- That Bureau asks Google to exclude anything. This is a filter applied to results after they are scraped.
- That the airline is excluded. Only options that **connect** through DXB, DOH, AUH, BAH, MCT or KWI are removed.
  A nonstop on a Gulf carrier is unaffected.
- That €408 is bookable, or that either figure will be the same tomorrow. Caption: *"Display prices from one run.
  Bureau hands you the booking link; it does not hold, price or sell the ticket."*
- That €73 is a rate. It is one measurement on one route on one date range.

**Numbers sufficient?** Yes. All four bars and both annotations come straight from the brief.

**Honest version versus flattering version.** The flattering version drops the Hanoi pair and shows only
"avoiding the Gulf costs €73", or inverts it to "we found you a €73 saving". Both are more impressive and both
destroy the argument, which is that you cannot know the number without running it. Specifying the honest version,
and the €0 bar is the most valuable ink on the page.

---

## 2. What one search actually covers — the search-shape grid

**Question it answers**
"When you say you ran 28 searches, 28 of what?"

**Chart type, and why**
Not a chart in the axis sense. A small block of squares per job, one square per search, arranged as a grid whose
two sides are the two things being swept: routes down, departure days across.

The obvious alternative is a bar chart of searches per job. That chart says "some jobs are bigger than others",
which nobody asked and nobody doubts. The grid says *what the engine does*, which is the site's actual job in this
section, and it does it with no axis, no legend and no colour scale. The arithmetic is visible: five squares in a
row is five routes on one day; four rows of seven is four destinations across a week.

**Data shape**

```
{ id: string                  // "gateway" | "ski" | "cabin" | "holidays"
  ask: string                 // the traveller's sentence, already in scenarios.ts
  routes: number              // grid rows
  days: number                // grid columns
  extraDimension?: string     // label for a third sweep, e.g. "× 2 cabin classes"
  queries: number             // must equal routes × days × (extra factor)
  options: number             // integer, printed beside the grid
  seconds: number             // integer, printed beside the grid
}
```

The arithmetic checks out on all four, and the fourth is the interesting one:

| job | routes × days | = | queries | note |
|---|---|---|---|---|
| gateway | 5 × 1 | 5 | 5 | five departure airports, one date |
| ski | 4 × 7 | 28 | 28 | four snow destinations, one week |
| cabin | 1 × 7 | 7 | **14** | × 2 cabin classes, economy and premium economy |
| holidays | 4 × 7 | 28 | 28 | four New York area airports, one week |

**Encoding**
- Grid position: row = route, column = departure day. Nothing is mapped to a continuous axis.
- colour: every square amber at low opacity, one flat value. Colour carries no information and is not required
  to read the chart.
- size: every square identical. The *count* of squares is the encoding, not the area of anything.
- order: jobs in the existing `SCENARIOS` order, so the grid can sit inside the accordion that already exists.
- The cabin job's grid is drawn twice, once per cabin class, with the label `economy` and `premium economy`.
  Do not hide the doubling behind a multiplier.
- Beside each grid, in mono: options read, and seconds.

**Three-second takeaway**
Twenty-eight searches means four destinations across seven days, and you can count them.

**Must not imply**
- That each square is a flight or an offer. It is one search, which returned many options.
- That the grid could be extended indefinitely. Round-trip date grids stop at 21 combinations
  (see correction 1). If a caption mentions a limit, it must be the 21, not a seven.
- Do not draw the four jobs' seconds as a stacked total. See correction 2.

**Numbers sufficient?** Yes for all four grids. The cabin job's second dimension is inferred from
`5 × 1 = 5`, `4 × 7 = 28`, `1 × 7 × 2 = 14`, `4 × 7 = 28` and the job's own description in `scenarios.ts:53`
("economy and premium economy"). Worth one confirmation from whoever ran it before it ships as a stated fact.

---

## 3. Where you would connect if you said nothing — top layover airports

**Question it answers**
"If I don't tell it to avoid anywhere, where do I end up changing planes?"

**Chart type, and why**
Horizontal bars, six of them, sorted longest first.

Not a map. A map of connecting traffic needs a projection, a size scale, geography the reader may not have, and
it answers a vaguer question than the one asked. Not a pie, for a harder reason: these are six airports out of
sixty-six, and a pie asserts that its slices are the whole. Horizontal because the labels are airport names and
horizontal bars give them room without rotating text.

**Data shape**

```
{ iata: string        // "LHR"
  city: string        // "London Heathrow"
  appearances: number // count of options whose layover list includes this airport
}
```

| iata | city | appearances |
|---|---|---|
| LHR | London Heathrow | 486 |
| CDG | Paris Charles de Gaulle | 437 |
| FRA | Frankfurt | 355 |
| MUC | Munich | 271 |
| BKK | Bangkok | 120 |
| ZRH | Zurich | 111 |

**Encoding**
- y: airport, one row each, IATA in mono followed by city name in prose.
- x: appearances, from zero, single amber bar.
- colour: one colour throughout. There are no categories here, so there is nothing to colour by.
- order: descending by count. This is the whole reason the chart works at a glance.
- Each bar prints its count at its end in mono.
- A muted line under the chart states the scope: *"Across 2,942 options from four jobs, all departing the
  Netherlands. 66 airports appeared as a connection; these are the six most common."*

**Three-second takeaway**
Connections in Europe funnel through a handful of airports, which is why "avoid one of them" is a real question
with a real cost.

**Must not imply**
- **A percentage of anything.** An option can have zero, one or two layovers, so the denominator is not 2,942 and
  the six bars sum to 1,780 *appearances*, not options. No "16% of flights go through Heathrow". See
  **Open numbers**.
- That this is world traffic. Every one of the four jobs starts in or near the Netherlands, so LHR, CDG, FRA and
  MUC lead partly because of where the traveller is standing. Say this in the scope line, do not bury it.
- That these six are avoidable at no cost. That claim belongs to chart 1 and is route-specific.

**Numbers sufficient?** To draw the six bars, yes. To state any share, ratio or "most flights" claim, no.
Missing figures listed at the bottom.

---

## 4. What one question is worth in euros — range bars per job *(optional)*

**Question it answers**
"How different can the answers to one question be?"

**Chart type, and why**
Four horizontal floating bars, each spanning that job's cheapest to dearest.

Optional, and it comes with a condition: `Scenarios.svelte:46-48` already prints
`Cheapest to dearest €X — €Y` in the accordion for every job. Drawing this chart alongside that row states the
same fact twice. **Build it only if it replaces that row.** If it goes in, the spans are the whole point: the ski
job's €84 to €412 and the holiday job's €400 to €4,775 are different questions living at different scales, and
the picture says that faster than the numbers do.

**Data shape**

```
{ id: string
  ask: string           // truncated to one line
  priceLowEur: number   // integer EUR
  priceHighEur: number  // integer EUR
}
```

All four rows already exist in `apps/marketing/src/lib/scenarios.ts:22-79`.

**Encoding**
- y: job, labelled with the traveller's question, one line, truncated.
- x: EUR, **linear, from zero**.
- colour: amber bar, muted axis. No colour distinction between jobs; position is the separator.
- order: by `priceLowEur` ascending, so ski sits at the top and the bars grow downward.
- Both endpoints printed in mono at the ends of each bar.

**On the axis choice.** A log axis flatters this chart. It makes the ski job's €84–€412 span look comparable to
the holiday job's €400–€4,775, and it lets a caption claim "a 5× to 14× spread in every job". It also needs a
sentence of explanation and it visually equalises ranges that are not equal. Specifying linear. On a linear axis
the ski job is a stub next to the long holiday bar, and that is the truth: these jobs are not the same size, and
one of them is a €100 flight.

**Three-second takeaway**
Within a single question, the cheapest and dearest answers are thousands of euros apart.

**Must not imply**
- That the top of a range is a bad option. The €4,586 Singapore result is very likely a premium cabin, and the
  cabin job exists precisely to compare cabins. Label the axis "display price", not "cost".
- That Bureau gets you the low end. It shows you what it saw and hands over a link.
- That these prices are current.

**Numbers sufficient?** Yes, all eight endpoints are in `scenarios.ts` and in the brief.

---

## 5. Route discovery — **do not draw a chart. Use three numerals.**

**Question it would answer**
"How many ways are there even to get from Amsterdam to Hanoi?"

**Recommendation: three big numbers, not a graph.** The figures are 16, 1,034 and 62,425. On a linear axis the
first two bars are invisible. On a log axis the reader needs to be taught the axis before they can read the
chart, and a log axis on a "look how many" claim is exactly where a sceptical reader starts checking. Three
numerals in the existing `.num` treatment from `Scenarios.svelte:73-87` are bigger, faster, cheaper to build and
harder to argue with.

Lay it out as the existing totals grid:

```
16          1,034        62,425
1 stop      2 stops      3 stops
```

**Data shape**

```
{ maxStops: number    // 1 | 2 | 3
  routes: number      // integer count of distinct routings
  from: string        // "AMS"
  to: string          // "HAN"
  maxDetour: number   // 3.0, the great-circle multiple these are bounded by
  seconds: number     // 0.16, local, no network
}
```

**Three-second takeaway**
Allow one more stop and the number of possible routings explodes.

**The caveat block is part of the component, not a footnote.** Directly beneath the three numerals, at body size
and not in muted grey:

> These are **theoretical routings** through a static snapshot of the world's airline network. They are not
> flights. Nothing here is bookable, priced, or checked against a timetable. This runs locally in about a sixth
> of a second, before any searching happens, to work out which routes are worth searching at all. Counted within
> three times the direct distance.

**Must not imply**
- That any of these can be bought, or that a price exists for them.
- That the network snapshot is current, or that a listed connection is flown in both directions
  (the graph is undirected, correction 6).
- That 62,425 is "all" routings. It is all routings within 3× the great-circle distance.
- Under no circumstances render these as a list, a table of routings, or anything with a row per route.
  A list looks like search results, and search results look purchasable.

**Numbers sufficient?** Yes, and I verified all three by running the command.

**Honest versus flattering.** The flattering version is a log-scale bar chart headlined "62,425 ways to reach
Hanoi", with the theoretical caveat in grey below the fold. That version is a lie by layout even if every word
in it is true. Specifying the numerals with the caveat set at full weight, immediately adjacent, above the fold.

---

## 6. Gulf-free route space — **drop it, or fold it into item 5**

62,425 routings become 57,035 when Gulf hubs are excluded. As a chart that is two bars of near-identical length,
a 9% shave, and a reader who squints to find the difference has learned nothing.

It also risks the worst confusion on the site, which is conflating the route-graph exclusion in
`flt connections --exclude-region` (a planning filter over theoretical routings, `connections.ts:150`) with the
results exclusion in `applyFilters` (a filter over scraped options, `filter.ts:56`). They share a flag name and a
region table and they are not the same operation. Two features, two very different kinds of number, and a chart
that puts them near each other invites the reader to average them.

**Recommendation:** drop it. If the number must appear, add it as a fourth cell in item 5's numeral grid
(`57,035 / 3 stops, no Gulf`) and nothing more. Chart 1 already carries the "what does a preference cost"
argument, with money attached, which is the version a traveller cares about.

---

## Ranked summary

| # | Proposal | Feature | Form | Verdict |
|---|---|---|---|---|
| 1 | The price of a preference | 2 | Grouped bars, 2 × 2 | **Build first.** The only chart that makes an argument that cannot be made in a sentence. |
| 2 | Search-shape grid | 1 | Squares, one per search | **Build.** The only visual that explains what the engine does rather than how much it did. |
| 3 | Default connecting airports | 2 | Horizontal bars, 6 rows | **Build.** Cheap, honest, sets up chart 1. Percentages forbidden. |
| 4 | Price range per job | 1 | Floating bars, 4 rows | Optional. Only if it replaces the existing accordion row. |
| 5 | Route discovery counts | 3 | **Three numerals, not a chart** | Build as numerals with the caveat block attached. |
| 6 | Gulf-free route space | 3 | **Nothing** | Drop, or one extra numeral in item 5. |

---

## Open numbers

Figures a chart in this document wants and that I could not confirm. Nothing here has been estimated or filled
in with a plausible value.

1. **Total layover appearances across all 2,942 options**, and how many of those options were nonstop.
   Without this, chart 3 cannot state any percentage or "most flights" claim, and currently does not.
2. **The 235 vs 200 second discrepancy** in `scenarios.ts` (correction 2). Needed before any chart or copy shows
   per-job durations and the total together.
3. **Confirmation that the cabin job's 14 searches are 7 days × 2 cabin classes** (chart 2). The arithmetic and
   the job description both point that way; it is inference, not a read fact.
4. **The 113 and 50 Gulf-routing counts**: whether they count options with a Gulf airport anywhere in the layover
   list, or only as the first stop. Chart 1's caption wording depends on it. Everything else in chart 1 is solid
   without it.
5. **Whether the €335 / €408 / €320 figures are one-way or return.** The caption should say which, and the brief
   does not.
