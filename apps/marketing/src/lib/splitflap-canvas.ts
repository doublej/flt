/** Canvas painter for the board. Same machine, different surface.
 *
 *  Canvas 2D has no 3D, but it does not need one: a leaf rotating about a
 *  horizontal axis, seen head on, is exactly a vertical squash by cos(angle).
 *  That is what the DOM path's perspective is very nearly doing anyway, and it
 *  buys one draw surface instead of four DOM planes per cell. */

import { FLAPS } from './splitflap'

export type Skin = {
  /** mid tone of the flap; the rest of the gradient is derived from it */
  face: string
  ink: string
  seam: string
  /** glyph size and horizontal squeeze, as in the CSS path */
  glyph: number
  squeeze: number
  font: string
  /** 0..1, ink density for this particular flap */
  wear: number
  /** sub-pixel offset of the lower half against the upper */
  mis: number
  /** scuffed plastic over the face, 0 for none */
  grain: number
  radius: number
}

/** One noise tile, made once and patterned over every cell. Per-pixel noise per
 *  frame at 480 cells is not affordable; a repeating tile is indistinguishable. */
let noise: CanvasPattern | null = null
function grainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (noise) return noise
  const tile = document.createElement('canvas')
  tile.width = 64
  tile.height = 64
  const g = tile.getContext('2d')
  if (!g) return null
  const img = g.createImageData(64, 64)
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 90 + Math.random() * 76
    img.data[i] = v
    img.data[i + 1] = v
    img.data[i + 2] = v
    img.data[i + 3] = 255
  }
  g.putImageData(img, 0, 0)
  noise = ctx.createPattern(tile, 'repeat')
  return noise
}

export function shade(hex: string, k: number): string {
  const n = Number.parseInt(hex.slice(1), 16)
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)))
  return `rgb(${c((n >> 16) & 255)} ${c((n >> 8) & 255)} ${c(n & 255)})`
}

function plate(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  face: string,
) {
  const g = ctx.createLinearGradient(0, y, 0, y + h)
  g.addColorStop(0, shade(face, 2.7))
  g.addColorStop(0.47, face)
  g.addColorStop(0.53, shade(face, 2.1))
  g.addColorStop(1, shade(face, 0.6))
  ctx.fillStyle = g
  ctx.fillRect(x, y, w, h)
}

/** One half of a glyph, clipped to its own plate. `half` 0 is the upper. */
function half(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  s: Skin,
  char: string,
  upper: boolean,
) {
  const hh = h / 2
  const top = upper ? y : y + hh
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, top, w, hh)
  ctx.clip()
  plate(ctx, x, y, w, h, s.face)

  if (char !== ' ') {
    const size = h * s.glyph
    ctx.font = `700 ${size}px ${s.font}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.globalAlpha = s.wear
    ctx.fillStyle = s.ink
    ctx.save()
    // the seam bisects the glyph; the lower half sits a hair out of register
    ctx.translate(x + w / 2 + (upper ? 0 : s.mis), y + h / 2)
    ctx.scale(s.squeeze, 1)
    ctx.fillText(char, 0, 0)
    ctx.restore()
    ctx.globalAlpha = 1
  }

  if (upper) {
    // the seam itself
    ctx.fillStyle = s.seam
    ctx.fillRect(x, y + hh - Math.max(0.5, h * 0.016), w, Math.max(0.5, h * 0.016))
  } else {
    // shadow the standing flap drops on the fallen one
    const g = ctx.createLinearGradient(0, y + hh, 0, y + hh + h * 0.06)
    g.addColorStop(0, 'rgb(0 0 0 / 0.5)')
    g.addColorStop(1, 'rgb(0 0 0 / 0)')
    ctx.fillStyle = g
    ctx.fillRect(x, y + hh, w, h * 0.06)
  }
  ctx.restore()
}

export type Leaf = { upper: boolean; cos: number; bright: number; char: string }

/** Paint one drum. `leaf` is null at rest; otherwise it carries the flap in
 *  flight — which half is moving, how far over it is, and how hard it is
 *  catching the light. */
export function paintCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  s: Skin,
  topChar: string,
  botChar: string,
  leaf: Leaf | null,
) {
  ctx.clearRect(x, y, w, h)
  half(ctx, x, y, w, h, s, topChar, true)
  half(ctx, x, y, w, h, s, botChar, false)

  if (leaf) {
    const pivot = y + h / 2
    ctx.save()
    ctx.beginPath()
    // the leaf sweeps only within its own half of the cell
    ctx.rect(x, leaf.upper ? y : pivot, w, h / 2)
    ctx.clip()
    ctx.translate(0, pivot)
    ctx.scale(1, Math.max(leaf.cos, 0.001))
    ctx.translate(0, -pivot)
    half(ctx, x, y, w, h, s, leaf.char, leaf.upper)
    ctx.restore()

    // light on the tilting face, then the hard landing
    const lit = leaf.upper ? y : pivot
    const tall = (h / 2) * Math.max(leaf.cos, 0)
    ctx.fillStyle =
      leaf.bright >= 1
        ? `rgb(255 255 255 / ${Math.min(leaf.bright - 1, 1)})`
        : `rgb(0 0 0 / ${1 - leaf.bright})`
    ctx.fillRect(x, leaf.upper ? lit + h / 2 - tall : lit, w, tall)
  }

  if (s.grain > 0) {
    const p = grainPattern(ctx)
    if (p) {
      ctx.save()
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = s.grain
      ctx.fillStyle = p
      ctx.fillRect(x, y, w, h)
      ctx.restore()
    }
  }

  // the axle, poking out at seam level
  const rod = Math.max(0.5, h * 0.035)
  ctx.fillStyle = 'rgb(118 125 134 / 0.55)'
  ctx.fillRect(x - w * 0.04, y + h / 2 - rod / 2, w * 0.13, rod)
  ctx.fillRect(x + w * 0.91, y + h / 2 - rod / 2, w * 0.13, rod)
}

/** Widest advance across the flap set for a font stack, in em. Measured rather
 *  than remembered: the stack falls through to much wider faces when the
 *  condensed one is missing, and the difference decides whether type clips. */
const advances = new Map<string, number>()
export function widestFlap(face: string): number {
  const hit = advances.get(face)
  if (hit !== undefined) return hit
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return 0.944
  probe.font = `700 1000px ${face}`
  let max = 0
  for (const ch of FLAPS) max = Math.max(max, probe.measureText(ch).width / 1000)
  const em = max > 0 ? max : 0.944
  advances.set(face, em)
  return em
}
