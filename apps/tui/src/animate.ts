import { terminal as term } from 'terminal-kit'

const BOOT_LINES = [
  'FLT  RESERVATION SYSTEM',
  'V0.1.0',
  '',
  'LOADING AIRPORT DATABASE... 654 KB',
  'FARE CACHE............ OK',
  'SESSION MANAGER....... OK',
  'TERMINAL READY',
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
  'F L T',
  '── RESERVATION SYSTEM ──',
  'V0.1.0',
]

/** CRT power-on flicker — brief white flash then phosphor glow */
async function crtPowerOn(w: number, h: number): Promise<void> {
  // Flash white line across center (CRT warming up)
  const midY = Math.floor(h / 2)
  term.moveTo(1, midY)
  term('\x1b[0;47;97m') // bright white on white bg
  term.noFormat('─'.repeat(w))
  await sleep(60)

  // Expand to 3 lines
  for (const dy of [-1, 1]) {
    term.moveTo(1, midY + dy)
    term('\x1b[0;40;94m')
    term.noFormat('░'.repeat(w))
  }
  await sleep(40)

  // Expand further with dimmer phosphor
  for (const dy of [-2, 2]) {
    const row = midY + dy
    if (row < 1 || row > h) continue
    term.moveTo(1, row)
    term('\x1b[0;40;34m')
    term.noFormat('░'.repeat(w))
  }
  await sleep(50)

  // Quick clear — phosphor fade
  for (let row = 1; row <= h; row++) {
    term.moveTo(1, row)
    term('\x1b[0;40;30m')
    term.eraseLine()
  }
  await sleep(80)

  // Faint scanline sweep (top to bottom, fast)
  for (let row = 1; row <= Math.min(h, 8); row++) {
    term.moveTo(1, row)
    term('\x1b[0;2;40;34m')
    term.noFormat('▁'.repeat(Math.floor(w * (row / 8))))
    await sleep(15)
  }
  // Clear the scanlines
  for (let row = 1; row <= Math.min(h, 8); row++) {
    term.moveTo(1, row)
    term('\x1b[0;40;30m')
    term.eraseLine()
  }
  await sleep(40)
}

/** Animated boot sequence — CRT power-on, typewriter lines, then logo reveal */
export async function bootAnimation(w: number, h: number): Promise<void> {
  const vH = h - 3
  const baseY = 2 // content starts at row 2

  // Phase 0: CRT power-on flicker
  await crtPowerOn(w, h)

  // Phase 1: typewriter boot log
  for (let i = 0; i < BOOT_LINES.length; i++) {
    const line = BOOT_LINES[i]
    const row = baseY + i
    if (row > vH) break

    term.moveTo(1, row)
    term('\x1b[0;40;34m')
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
    term('\x1b[0;40;34m')
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
      term(isLast ? '\x1b[0;40;94m' : '\x1b[0;2;40;34m')
      term.eraseLine()
      term.noFormat(plane[i])
    }

    if (!isLast) {
      await sleep(280)
      // Clear before drawing next scale
      for (let i = 0; i < plane.length; i++) {
        term.moveTo(1, startY + i)
        term('\x1b[0;40;34m')
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
    term(i === 0 ? '\x1b[0;40;94m' : '\x1b[0;2;40;34m')
    term.noFormat(line)
    await sleep(60)
  }

  // Hint
  const hintY = titleY + TITLE.length + 2
  const hint = 'ENTER COMMAND OR H/ FOR HELP'
  const hintX = Math.max(1, Math.floor((w - hint.length) / 2) + 1)
  term.moveTo(hintX, hintY)
  term('\x1b[0;2;40;34m')
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
      term('\x1b[0;40;34m')
      term.eraseLine()
      row++
      setTimeout(step, 35)
    }
    step()
  })
}

const LOAD_SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export class LoadingAnimation {
  private frame = 0
  private timer: ReturnType<typeof setInterval> | null = null
  private trackWidth = 40
  private progress = 0
  private targetProgress = 0
  private label = ''
  private row: number
  private w: number

  constructor(row: number, w: number) {
    this.row = row
    this.w = w
    this.trackWidth = Math.min(40, Math.floor(w * 0.6))
  }

  start(label: string) {
    this.label = label
    this.progress = 0
    this.targetProgress = 0
    this.frame = 0
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

    // Ease progress toward target
    if (this.targetProgress > this.progress) {
      this.progress += (this.targetProgress - this.progress) * 0.15
      if (this.targetProgress - this.progress < 0.005) this.progress = this.targetProgress
    }

    this.draw()
  }

  private draw() {
    const spin = LOAD_SPIN[this.frame]
    const pos = Math.floor(this.progress * (this.trackWidth - 1))
    const left = '─'.repeat(pos)
    const right = '─'.repeat(Math.max(0, this.trackWidth - pos - 1))
    const prefix = `${spin} ${this.label}  `

    const x = Math.max(1, Math.floor((this.w - prefix.length - this.trackWidth) / 2) + 1)
    term.moveTo(x, this.row)
    term('\x1b[0;40;34m')
    term.eraseLine()
    term('\x1b[0;40;94m') // bright green
    term.noFormat(`${spin} `)
    term('\x1b[0;40;34m')
    term.noFormat(`${this.label}  `)
    term('\x1b[0;40;94m') // bright green — completed track
    term.noFormat(left)
    term('\x1b[0;40;97m') // bright white — plane
    term.noFormat('✈')
    term('\x1b[0;2;40;34m') // dim green — remaining track
    term.noFormat(right)
  }
}

/** Sign-off animation — CRT power-down effect */
export async function signOffAnimation(w: number, h: number): Promise<void> {
  // Collapse content to center line
  const midY = Math.floor(h / 2)

  // Phase 1: rapid scanline collapse — clear from edges toward center
  const half = Math.ceil(h / 2)
  for (let d = half; d >= 0; d--) {
    const top = midY - d
    const bot = midY + d
    if (top >= 1 && top !== midY) {
      term.moveTo(1, top)
      term('\x1b[0;40;30m')
      term.eraseLine()
    }
    if (bot <= h && bot !== midY && bot !== top) {
      term.moveTo(1, bot)
      term('\x1b[0;40;30m')
      term.eraseLine()
    }
    await sleep(12)
  }

  // Phase 2: bright center line
  term.moveTo(1, midY)
  term('\x1b[0;40;94m')
  term.noFormat('─'.repeat(w))
  await sleep(100)

  // Phase 3: shrink center line
  for (let i = 0; i < Math.ceil(w / 2); i += 2) {
    const left = i
    const right = w - i
    if (left >= right) break
    term.moveTo(1, midY)
    term('\x1b[0;40;30m')
    term.eraseLine()
    term.moveTo(left + 1, midY)
    term('\x1b[0;40;94m')
    term.noFormat('─'.repeat(Math.max(0, right - left)))
    await sleep(8)
  }

  // Phase 4: dot fade
  const cx = Math.floor(w / 2) + 1
  term.moveTo(1, midY)
  term('\x1b[0;40;30m')
  term.eraseLine()
  term.moveTo(cx, midY)
  term('\x1b[0;40;94m')
  term.noFormat('●')
  await sleep(200)
  term.moveTo(cx, midY)
  term('\x1b[0;2;40;34m')
  term.noFormat('·')
  await sleep(150)
  term.moveTo(cx, midY)
  term('\x1b[0;40;30m')
  term.noFormat(' ')
  await sleep(100)
}

/** Row cascade — reveal content lines one-by-one with stagger delay */
export function rowCascade(
  drawRow: (row: number) => void,
  startRow: number,
  count: number,
): Promise<void> {
  return new Promise((resolve) => {
    let i = 0
    const step = () => {
      if (i >= count) { resolve(); return }
      drawRow(startRow + i)
      i++
      // Fast start, slight deceleration
      const delay = i < 3 ? 20 : i < 8 ? 30 : 45
      setTimeout(step, delay)
    }
    step()
  })
}

function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
