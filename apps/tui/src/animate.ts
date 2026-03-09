import { terminal as term } from 'terminal-kit'

const BOOT_LINES = [
  'FLIGHTS/RES GLOBAL DISTRIBUTION SYSTEM',
  'V0.1.0  (C) 2025 ALL RIGHTS RESERVED',
  '',
  'INITIALIZING TERMINAL...',
  'LOADING AIRPORT DATABASE... 654 KB',
  'SESSION MANAGER... OK',
  'CONNECTING GDS NETWORK...',
  'SYSTEM READY',
]

/**
 * Boeing 777 front view — parametric scales
 * Based on ASCII art by Jon Hyatt (https://asciiart.website/art/4289)
 *
 * Each scale is defined by: wing (underscore count per side),
 * dash (upper fuselage dashes), quote/gap/inner/strut (detail line).
 * Constraint: quote + strutLen + gap + inner = wing - 5
 */
interface PlaneScale {
  wing: number; dash: number; quote: number
  gap: number; inner: number; strut: string
}

const SCALES: PlaneScale[] = [
  { wing: 13, dash: 4,  quote: 2,  gap: 2, inner: 1, strut: '-|-' },
  { wing: 25, dash: 9,  quote: 6,  gap: 4, inner: 2, strut: '-|---|--' },
  { wing: 31, dash: 12, quote: 8,  gap: 5, inner: 3, strut: '-|----|---' },
  { wing: 37, dash: 15, quote: 10, gap: 6, inner: 4, strut: '-|-----|----' },
  { wing: 43, dash: 18, quote: 12, gap: 7, inner: 5, strut: '-|------|-----' },
  { wing: 49, dash: 21, quote: 14, gap: 8, inner: 6, strut: '-|--------|-----' },
]

function generatePlane(s: PlaneScale): string[] {
  const w = s.wing * 2 + 9
  const pad = (line: string) => {
    const p = Math.floor((w - line.length) / 2)
    return ' '.repeat(Math.max(0, p)) + line + ' '.repeat(Math.max(0, w - p - line.length))
  }
  const eng = '/' + ' '.repeat(s.gap) + '\\'
  const engBot = '\\' + ' '.repeat(s.gap) + '/'
  const eq = '='.repeat(s.inner)
  const rStrut = s.strut.split('').reverse().join('')
  const gSp = ' '.repeat(Math.max(2, s.gap - 1))

  return [
    pad('|'),
    pad(".-'-."),
    pad("' ___ '"),
    pad('-'.repeat(s.dash) + "'  .-.  '" + '-'.repeat(s.dash)),
    '_'.repeat(s.wing) + "'  '-'  '" + '_'.repeat(s.wing),
    ' ' + "'".repeat(s.quote) + s.strut + eng + eq + "][^',_m_,'^][" + eq + eng + rStrut + "'".repeat(s.quote) + ' ',
    pad(engBot + '  ' + '||/   H   \\||' + '  ' + engBot),
    pad("'--'" + gSp + 'OO' + gSp + 'O|O' + gSp + 'OO' + gSp + "'--'"),
  ]
}

/** Pick largest plane that fits terminal width (with 4-char margin) */
function selectPlane(termWidth: number): { lines: string[]; width: number } {
  let scale = SCALES[0]
  for (const s of SCALES) {
    if (s.wing * 2 + 13 <= termWidth) scale = s
  }
  const width = scale.wing * 2 + 9
  return { lines: generatePlane(scale), width }
}

const TITLE = [
  'F L I G H T S  /  R E S',
  '── GLOBAL DISTRIBUTION SYSTEM ──',
  'V0.1.0',
]

/** Animated boot sequence — typewriter lines then logo reveal */
export async function bootAnimation(w: number, h: number): Promise<void> {
  const vH = h - 3
  const baseY = 2 // content starts at row 2

  // Phase 1: typewriter boot log
  for (let i = 0; i < BOOT_LINES.length; i++) {
    const line = BOOT_LINES[i]
    const row = baseY + i
    if (row > vH) break

    term.moveTo(1, row)
    term('\x1b[0;40;32m')
    term.eraseLine()

    for (let c = 0; c < line.length; c++) {
      term.noFormat(line[c])
      if (c % 3 === 0) await sleep(8)
    }
    await sleep(60)
  }

  await sleep(300)

  // Phase 2: scanline clear (top to bottom)
  for (let row = baseY; row <= baseY + BOOT_LINES.length; row++) {
    term.moveTo(1, row)
    term('\x1b[0;40;32m')
    term.eraseLine()
    await sleep(30)
  }

  // Phase 3: plane zoom — cycle through scales XS→largest that fits
  const fitScales = SCALES.filter(s => s.wing * 2 + 13 <= w)
  if (fitScales.length === 0) fitScales.push(SCALES[0])
  const finalScale = fitScales[fitScales.length - 1]
  const finalW = finalScale.wing * 2 + 9
  const finalPlane = generatePlane(finalScale)
  const totalH = finalPlane.length + 2 + TITLE.length + 2 + 1
  const startY = Math.max(baseY, Math.floor((vH - totalH) / 2) + baseY)

  // Animate: plane flies in from left edge → center while scaling up
  const last = fitScales.length - 1
  for (let si = 0; si <= last; si++) {
    const scale = fitScales[si]
    const planeW = scale.wing * 2 + 9
    const plane = generatePlane(scale)
    const t = last > 0 ? si / last : 1 // 0→1 progress
    const centerX = Math.max(1, Math.floor((w - planeW) / 2) + 1)
    const leftX = 1
    const px = Math.round(leftX + (centerX - leftX) * easeOut(t))
    const isLast = si === last

    // Draw this scale at interpolated X
    for (let i = 0; i < plane.length; i++) {
      term.moveTo(px, startY + i)
      term(isLast ? '\x1b[0;40;92m' : '\x1b[0;2;40;32m')
      term.eraseLine()
      term.noFormat(plane[i])
    }

    if (!isLast) {
      await sleep(280)
      // Clear before drawing next scale
      for (let i = 0; i < plane.length; i++) {
        term.moveTo(1, startY + i)
        term('\x1b[0;40;32m')
        term.eraseLine()
      }
      await sleep(80)
    }
  }

  // Title below plane
  const titleY = startY + finalPlane.length + 2
  for (let i = 0; i < TITLE.length; i++) {
    const line = TITLE[i]
    const tx = Math.max(1, Math.floor((w - line.length) / 2) + 1)
    term.moveTo(tx, titleY + i)
    term(i === 0 ? '\x1b[0;40;92m' : '\x1b[0;2;40;32m')
    term.noFormat(line)
    await sleep(60)
  }

  // Hint
  const hintY = titleY + TITLE.length + 2
  const hint = 'ENTER COMMAND OR H/ FOR HELP'
  const hintX = Math.max(1, Math.floor((w - hint.length) / 2) + 1)
  term.moveTo(hintX, hintY)
  term('\x1b[0;2;40;32m')
  for (const ch of hint) {
    term.noFormat(ch)
    await sleep(15)
  }
}

/** Animated content transition — quick scanline wipe then draw */
export function scanlineTransition(
  drawFn: () => void,
  vH: number,
): Promise<void> {
  return new Promise((resolve) => {
    let row = 0
    const step = () => {
      if (row >= Math.min(4, vH)) {
        drawFn()
        resolve()
        return
      }
      term.moveTo(1, 2 + row)
      term('\x1b[0;40;32m')
      term.eraseLine()
      row++
      setTimeout(step, 15)
    }
    step()
  })
}

/** Loading bar animation characters */
const LOAD_FRAMES = ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█']
const LOAD_SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export class LoadingAnimation {
  private frame = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private barWidth = 20
  private progress = 0
  private targetProgress = 0
  private label = ''
  private row: number
  private w: number
  private pulse = 0

  constructor(row: number, w: number) {
    this.row = row
    this.w = w
  }

  start(label: string) {
    this.label = label
    this.progress = 0
    this.targetProgress = 0
    this.frame = 0
    this.pulse = 0
    this.timer = setInterval(() => this.tick(), 80)
  }

  /** Set target progress 0-1, bar animates toward it */
  setProgress(p: number) {
    this.targetProgress = Math.min(1, Math.max(0, p))
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  }

  private tick() {
    this.frame = (this.frame + 1) % LOAD_SPIN.length
    this.pulse = (this.pulse + 1) % 8

    // Ease progress toward target
    if (this.targetProgress > this.progress) {
      this.progress += (this.targetProgress - this.progress) * 0.15
      if (this.targetProgress - this.progress < 0.005) this.progress = this.targetProgress
    }

    this.draw()
  }

  private draw() {
    const spin = LOAD_SPIN[this.frame]
    const filled = Math.floor(this.progress * this.barWidth)
    const partialIdx = Math.floor((this.progress * this.barWidth - filled) * LOAD_FRAMES.length)
    const partial = filled < this.barWidth ? LOAD_FRAMES[Math.max(0, partialIdx)] : ''
    const empty = this.barWidth - filled - (partial ? 1 : 0)

    const bar = '█'.repeat(filled) + partial + '░'.repeat(Math.max(0, empty))
    const pct = `${Math.floor(this.progress * 100)}%`.padStart(4)

    const x = Math.max(1, Math.floor((this.w - this.barWidth - this.label.length - 12) / 2) + 1)
    term.moveTo(x, this.row)
    term('\x1b[0;40;32m')
    term.eraseLine()
    term('\x1b[0;40;92m') // bright green
    term.noFormat(`${spin} `)
    term('\x1b[0;40;32m')
    term.noFormat(`${this.label}  `)
    // Pulsing bar color
    if (this.pulse < 4) term('\x1b[0;40;92m')
    else term('\x1b[0;40;32m')
    term.noFormat(bar)
    term('\x1b[0;40;93m') // bright yellow
    term.noFormat(` ${pct}`)
  }
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
