# Bureau — split-flap board build prompt

Paste the block below into a fresh Claude Code session opened at
`~/Documents/development/multi-stack/flights/apps/marketing`.

---

```
<task>
Build a photoreal split-flap departure board (Solari di Udine / Pragotron type) as a Svelte 5
component in this repo. It must be size-adaptive, animate authentically, and support a
compositing mode that drops it into a photograph convincingly enough to survive a second look.
</task>

<repo_facts>
Verified before writing this brief — do not re-derive:
- `apps/marketing` is SvelteKit 2 + Svelte 5 (runes), TypeScript, biome. Zero runtime deps.
- Design tokens live in `src/app.css` (`--color-bg: #0c0e14`, `--color-primary: #f0a030`,
  `--font-mono: "Departure Mono"`, radius/shadow/type-scale vars). Reuse them.
- Components live in `src/lib/components/*.svelte`. Data modules in `src/lib/*.ts`.
- Checks: `bun run check` (svelte-check), `bun run lint` (biome). Dev: `bun run dev`.
</repo_facts>

<mechanics>
This is the part that separates a real board from the hundreds of fake ones. Implement the
mechanism, not the impression of it.

**The glyph is split across two physical flaps.** Each flap in the drum carries the *bottom half
of character N* on its front face and the *top half of character N+1* on its back face. At rest
you are reading the back of the flap still standing (top half) plus the front of the flap that
has already fallen (bottom half). Consequences you must render:
- A permanent horizontal seam bisecting every glyph at exactly 50% height.
- The top half sits ~1mm *behind* the bottom half. The standing flap casts a thin drop shadow
  down onto the fallen one — darkest at the seam, fading over ~6% of cell height.
- Sub-pixel horizontal misregistration between halves (±0.3px, fixed per cell, not animated).
  Real drums are not perfectly aligned and this is the single strongest realism cue.
- The axle rod is visible at seam level in many boards. Optional, but it reads well.

**Drums only ever advance forwards.** To get from Z to A the drum cycles through the entire
remaining stack. Never take the shortest path. Never reverse.

**Flap stack: 40 positions**, in this order — blank, A–Z, 0–9, `.`, `-`, `/`. Cycling distance
is `(target - current + 40) % 40`.

**Timing.** ~62ms per flap step (a full 40-flap revolution is ~2.5s). Per-drum motor tolerance:
give each cell a fixed random ±4% rate multiplier at mount, so drums drift apart over a long
cycle instead of clacking in lockstep.

**The cascade is emergent, not staggered.** Every drum that needs to change starts at the same
instant and stops when its own target arrives. Short distances finish first. Do NOT add a
left-to-right animation-delay — that is the most common tell, and it produces a wave that runs
the wrong way relative to the real thing.

**Cells whose character does not change do not move at all.**

**Per-step motion.** The leaf falls under drive plus gravity, then lands hard:
- Phase 1 (0–55% of step): top leaf, `transform-origin: bottom`, `rotateX(0 → -90deg)`,
  ease-in (accelerating). Face carries the *outgoing* top half.
- Phase 2 (55–100%): bottom leaf, `transform-origin: top`, `rotateX(90deg → 0)`, ease-out with
  a 1–2% overshoot and settle. Face carries the *incoming* bottom half.
- The leaf catches light as it tilts: brightness ramps up through phase 1, then drops sharply
  on landing. A `filter: brightness()` keyframe on the moving leaf, not a static one.
- Motion blur on the leaf only during phase 1.
</mechanics>

<architecture>
Start with DOM + CSS 3D. `transform-style: preserve-3d`, four planes per cell, one `rAF` loop
driving all drums from a single state array — never one timer per cell.

Escape hatch with a measured trigger, not a guess: build the CSS version first and profile a
full-board reshuffle at 12 rows × 40 columns (480 cells). **If it holds ≥55fps, stop there.**
If it does not, move glyph rendering to a single WebGL layer (instanced quads, one glyph atlas
texture, per-instance rotation angle, one draw call) and keep the DOM only for the
accessibility mirror. Say in your report which path you took and the frame numbers behind it.
</architecture>

<sizing>
- Cell size derives from the container, not the viewport. `ResizeObserver` on the board root,
  or a container query — either is fine, pick one and be consistent.
- Every internal dimension (seam width, shadow spread, bezel inset, gap) expressed as a ratio
  of cell height so the board is identical at 8px and 200px cells.
- Glyphs stay crisp at any size: real text nodes in the CSS path; atlas rendered at
  `devicePixelRatio` and re-rasterised on significant resize in the WebGL path.
- Column widths are content-driven (a TIME column is 5 cells, DESTINATION is 18) with the whole
  board scaling as one unit. Board never reflows mid-animation.
</sizing>

<compositing>
A `composite` mode that makes the board sit inside a photograph. Required pieces:
1. **Corner pin.** Accept four destination corner points in container space; solve the
   homography (8 unknowns, standard 4-point linear system) and apply the result as a single
   `matrix3d` on the board root. Not a hand-tuned `rotate3d` — corner pinning is what lets a
   user match an actual photo.
2. **Light match.** An overlay layer (multiply + screen pair) whose colour and gradient
   direction are props, plus exposure / white-balance / contrast on the board root, so the
   board's key light agrees with the photo's.
3. **Lens pass.** Film grain (`feTurbulence`), chromatic aberration (per-channel `feOffset`),
   vignette, and a defocus `blur()` amount to match the photo's depth of field. All amounts are
   props with sane defaults; all off when `composite` is absent.
4. **Occlusion slot.** Accept a `mask-image` so a foreground element in the photo (a pillar, a
   person's shoulder) can cut into the board.
5. **Glass.** Optional specular sheet over the board: a broad soft highlight plus faint dust.
   Boards are behind acrylic and it shows.
6. Outside its bezel the board renders fully transparent so it drops onto anything.
</compositing>

<component_api>
Single component, Svelte 5 runes, in `src/lib/components/SplitFlapBoard.svelte`.
Drum/step logic in `src/lib/splitflap.ts` (pure, unit-testable, no DOM).

Props: `rows` (array of records), `columns` (id + label + width in cells + align),
`variant` ("airport" = white on black flaps | "railway" = black on cream), `composite`
(optional object holding corners / grade / lens / mask), `flapMs` (default 62).

Behaviour: updating `rows` triggers only the drums whose target character changed.
</component_api>

<constraints>
- No new dependencies. This package has zero runtime deps and keeps it that way.
- Reuse `src/app.css` tokens; add split-flap-specific vars scoped to the component.
- `prefers-reduced-motion: reduce` → characters set instantly, no rotation, seam still rendered.
- Accessibility: the flap layers are `aria-hidden`; a visually-hidden mirror carries the current
  board text in an `aria-live="polite"` region that updates once per settle, not per flap.
- Do not touch existing components, routes, or `src/app.css` beyond adding tokens.
- No config surface for values that never change. No abstraction with one caller.
</constraints>

<deliverable>
1. `src/lib/splitflap.ts` — drum state, cycling distance, step scheduling. Pure.
2. `src/lib/components/SplitFlapBoard.svelte` — the board.
3. `src/routes/labs/splitflap/+page.svelte` — a demo route with three states: a live departure
   board reshuffling on an interval, a size sweep (tiny / medium / huge in one view), and a
   composite example over a placeholder photo with draggable corner pins.
4. One runnable check for the non-trivial logic: assert-based, covering forward-only cycling,
   wrap-around distance, and "unchanged character produces zero steps".

Then run `bun run check` and `bun run lint` — both must pass — and open the demo route in the
browser to confirm the animation reads correctly at all three sizes.
</deliverable>

<output>
Build all four deliverables in one pass; do not stop after the first for approval. Report at the
end in under 200 words: which rendering path you took and the frame numbers, anything in this
brief you deliberately did not implement and why, and the demo URL. No feature tour, no design
essay. Stop after that report.
</output>
```
