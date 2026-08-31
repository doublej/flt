<script lang="ts">
/** The lit sign above a board. Its box IS the lit panel — the glow overflows it
 *  on purpose, so a caller can position the panel where the panel goes and not
 *  have to know how far the light spreads. */
import { SIGN, SIGN_ASPECT, type Sign, paintSign } from '$lib/lightbox-canvas'

let {
  text = '',
  /** panel width : height. The photograph's fixture is 24:1. */
  aspect = SIGN_ASPECT,
  sign,
  /** draw above device resolution: the composite homography scales it down */
  scale = 2,
}: {
  text?: string
  aspect?: number
  sign?: Partial<Sign>
  scale?: number
} = $props()

let canvas = $state<HTMLCanvasElement | null>(null)
let w = $state(0)

const s = $derived({ ...SIGN, ...sign, text })
const h = $derived(aspect > 0 ? w / aspect : 0)
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

<div class="sign" bind:clientWidth={w} style:--h="{h}px" style:--up="{up}px" style:--down="{down}px">
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
	{#if text}<span class="sr">{text}</span>{/if}
</div>

<style>
	.sign {
		position: relative;
		height: var(--h);
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
