<!-- Block-level: never put one inside a <p>. See the note on SplitFlapBoard —
     the parser closes the paragraph, hydration throws, and it takes every
     onMount on the page with it. -->
<script lang="ts">
/** The lit sign above a board. It fills whatever box it is given and paints the
 *  panel edge to edge; the glow overflows that box on purpose, so a caller can
 *  position the panel where the panel goes and never has to know how far the
 *  light spreads. It has no size of its own — the parent decides. */
import { SIGN, type Sign, paintSign } from '$lib/lightbox-canvas'

let {
  text = '',
  sign,
  /** draw above device resolution: the composite homography scales it down */
  scale = 2,
}: {
  text?: string
  sign?: Partial<Sign>
  scale?: number
} = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let w = $state(0)
let h = $state(0)

const s = $derived({ ...SIGN, ...sign, text })
const up = $derived(h * s.up)
const down = $derived(h * s.down)

$effect(() => {
  const c = canvas
  if (!c || w <= 0 || h <= 0) return
  const total = h + up + down
  const dpr = Math.min(window.devicePixelRatio || 1, 2) * scale
  c.width = Math.round(w * dpr)
  c.height = Math.round(total * dpr)
  const ctx = c.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, total)
  paintSign(ctx, 0, up, w, h, s)
})
</script>

<div
	class="sign"
	bind:clientWidth={w}
	bind:clientHeight={h}
	style:--h="{h}px"
	style:--up="{up}px"
	style:--down="{down}px"
>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
	{#if text}<span class="sr">{text}</span>{/if}
</div>

<style>
	.sign {
		position: relative;
		height: 100%;
	}
	canvas {
		position: absolute;
		left: 0;
		top: calc(var(--up) * -1);
		width: 100%;
		height: calc(var(--h) + var(--up) + var(--down));
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
