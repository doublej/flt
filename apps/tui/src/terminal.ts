import { terminal as term } from 'terminal-kit'
import { bootAnimation, LoadingAnimation, scanlineTransition, signOffAnimation, rowCascade } from './animate'

/** Style markers for format strings — control chars parsed by drawLine() */
export const M = {
  g: '\x01',  // green (base)
  G: '\x02',  // bright green
  y: '\x03',  // yellow
  Y: '\x04',  // bright yellow
  d: '\x05',  // dim green
} as const

/** ANSI sequences for each marker — always include bgBlack to prevent bleed */
const STYLE: Record<number, string> = {
  0x01: '\x1b[0;40;32m',
  0x02: '\x1b[0;40;92m',
  0x03: '\x1b[0;40;33m',
  0x04: '\x1b[0;40;93m',
  0x05: '\x1b[0;2;40;32m',
}

const MARKER_RE = /([\x01-\x05])/

export class Terminal {
  private lines: string[] = []
  private scroll = 0
  private input = ''
  private hist: string[] = []
  private hIdx = -1
  private status = ''
  private context = ''
  private sessionName: string | null = null
  private spinner = -1
  private spinTimer: ReturnType<typeof setInterval> | null = null
  private loader: LoadingAnimation | null = null
  private idleTimer: ReturnType<typeof setInterval> | null = null
  private idlePlane = -1  // -1 = not animating, 0..w = x position
  private idleFrame: ReturnType<typeof setTimeout> | null = null
  private onCmd: (cmd: string) => void

  constructor(onCmd: (cmd: string) => void) {
    this.onCmd = onCmd
  }

  private get w() { return term.width }
  private get h() { return term.height }
  private get vH() { return this.h - 3 }

  start() {
    term.fullscreen(true)
    term.grabInput({ mouse: false })
    term.hideCursor()
    term.on('key', (name: unknown) => this.key(name as string))
    term.on('resize', () => this.render())
    this.render()
    this.startIdle()
  }

  async stop() {
    this.stopIdle()
    this.stopSpinner()
    term.hideCursor()
    await signOffAnimation(this.w, this.h)
    term.grabInput(false)
    term.hideCursor(false)
    term.fullscreen(false)
    term.processExit()
  }

  setContent(l: string[]) { this.lines = l; this.scroll = 0; this.render() }
  setStatus(s: string) { this.status = s; this.render() }
  setContext(ctx: string) { this.context = ctx; this.render() }
  setSessionName(name: string | null) { this.sessionName = name; this.render() }

  /** Show boot animation (first launch) or static splash (XI reset) */
  async showSplash(animate = false) {
    this.lines = []
    this.scroll = 0
    this.status = ''
    this.context = ''
    this.render()

    if (animate) {
      await bootAnimation(this.w, this.h)
      return
    }

    this.drawStaticSplash()
  }

  private drawStaticSplash() {
    const W = 44
    const rows = [
      '╔' + '═'.repeat(W - 2) + '╗',
      '║' + ' '.repeat(W - 2) + '║',
      null, null, null,
      '║' + ' '.repeat(W - 2) + '║',
      null,
      '║' + ' '.repeat(W - 2) + '║',
      '╚' + '═'.repeat(W - 2) + '╝',
    ]
    const text: [number, string, (t: typeof term) => typeof term][] = [
      [2, 'F L I G H T S / R E S', (t) => t.bgBlack.brightGreen],
      [3, 'RESERVATION SYSTEM', (t) => t.bgBlack.green],
      [4, 'V0.1.0', (t) => t.bgBlack.green],
      [6, 'ENTER COMMAND OR H/ FOR HELP', (t) => t.bgBlack.green],
    ]

    const x = Math.max(1, Math.floor((this.w - W) / 2) + 1)
    const y = Math.max(2, Math.floor((this.vH - rows.length) / 2) + 2)

    for (let i = 0; i < rows.length; i++) {
      term.moveTo(x, y + i)
      if (rows[i]) term.bgBlack.dim.green.noFormat(rows[i]!)
    }

    for (const [ri, txt, style] of text) {
      const inner = W - 2
      const padded = txt.padStart(Math.floor((inner + txt.length) / 2)).padEnd(inner)
      term.moveTo(x, y + ri)
      term.bgBlack.dim.green.noFormat('║')
      style(term).noFormat(padded)
      term.bgBlack.dim.green.noFormat('║')
    }
  }

  startSpinner() {
    this.spinner = 0
    this.spinTimer = setInterval(() => {
      this.spinner = (this.spinner + 1) % 4
      this.render()
    }, 250)
  }

  stopSpinner() {
    this.spinner = -1
    if (this.spinTimer) { clearInterval(this.spinTimer); this.spinTimer = null }
  }

  /** Start a loading bar animation on the content area */
  startLoading(label: string) {
    this.stopLoading()
    const row = Math.max(2, Math.floor(this.vH / 2) + 2)
    this.loader = new LoadingAnimation(row, this.w)
    this.loader.start(label)
  }

  /** Update loading progress (0-1) */
  setLoadingProgress(p: number) {
    this.loader?.setProgress(p)
  }

  stopLoading() {
    if (this.loader) { this.loader.stop(); this.loader = null }
  }

  private startIdle() {
    this.idleTimer = setInterval(() => this.flyPlane(), 30_000 + Math.random() * 30_000)
  }

  private stopIdle() {
    if (this.idleTimer) { clearInterval(this.idleTimer); this.idleTimer = null }
    if (this.idleFrame) { clearTimeout(this.idleFrame); this.idleFrame = null }
    this.idlePlane = -1
  }

  private flyPlane() {
    if (this.idlePlane >= 0) return // already animating
    this.idlePlane = 0
    this.stepPlane()
  }

  private stepPlane() {
    const row = this.h - 1 // separator bar
    const x = this.idlePlane + 1

    // Erase previous position
    if (x > 1) {
      term.moveTo(x - 1, row)
      term('\x1b[0;40;32m')
      term.noFormat('─')
    }

    if (x > this.w) {
      this.idlePlane = -1
      this.renderChrome() // redraw separator cleanly
      return
    }

    // Draw plane character
    term.moveTo(x, row)
    term('\x1b[0;40;92m')
    term.noFormat('✈')

    this.idlePlane++
    this.idleFrame = setTimeout(() => this.stepPlane(), 25)
  }

  /** Set content with row cascade animation */
  setContentAnimated(l: string[]) {
    this.stopLoading()
    this.lines = l
    this.scroll = 0

    // Quick scanline wipe, then cascade rows in one-by-one
    const visCount = Math.min(l.length, this.vH)
    scanlineTransition(() => {
      // Render header/status immediately
      this.renderChrome()
      // Cascade visible content rows
      rowCascade(
        (row) => this.drawLine(row, l[row - 2] ?? ''),
        2,
        visCount,
      ).then(() => {
        // Fill remaining empty rows
        for (let i = visCount; i < this.vH; i++)
          this.drawLine(2 + i, '')
      })
    }, this.vH)
  }

  scrollDown() {
    this.scroll = Math.min(this.scroll + this.vH, Math.max(0, this.lines.length - this.vH))
    this.render()
  }

  scrollUp() { this.scroll = Math.max(0, this.scroll - this.vH); this.render() }
  scrollTop() { this.scroll = 0; this.render() }

  scrollBottom() {
    this.scroll = Math.max(0, this.lines.length - this.vH)
    this.render()
  }

  /** Inject a key event (for demo mode) */
  injectKey(name: string) { this.key(name) }

  render() {
    this.renderChrome()

    // Content area
    const vis = this.lines.slice(this.scroll, this.scroll + this.vH)
    for (let i = 0; i < this.vH; i++)
      this.drawLine(2 + i, vis[i] ?? '')
  }

  /** Render header, status bar, and input line (no content) */
  private renderChrome() {
    // Header bar
    term.moveTo(1, 1)
    term.styleReset()
    term.bgGreen.black.eraseLine()
    term.bgGreen.black(this.hdr())

    // Separator with status + MORE
    term.moveTo(1, this.h - 1)
    term.styleReset()
    term.bgBlack.green.eraseLine()
    const more = this.scroll + this.vH < this.lines.length
    const st = this.status ? ` ${this.status} ` : ''
    const mr = more ? ' ) MORE ' : ''
    const fill = Math.max(0, this.w - st.length - mr.length - (st ? 1 : 0))
    if (st) {
      term.bgBlack.dim.green('─')
      term.styleReset()
      term.bgBlack.brightGreen(st)
    }
    term.bgBlack.dim.green('─'.repeat(fill))
    if (mr) {
      term.styleReset()
      term.bgBlack.brightYellow(mr)
    }

    // Input line
    term.moveTo(1, this.h)
    term.styleReset()
    term.bgBlack.green.eraseLine()
    term.bgBlack.brightGreen('>')
    term.bgBlack.green(this.input)
    term.moveTo(2 + this.input.length, this.h)
    term.hideCursor(false)
  }

  /** Draw a format-string line: parse M.* markers → ANSI, rest as text */
  private drawLine(row: number, line: string) {
    term.moveTo(1, row)
    term('\x1b[0;40;32m') // base: green on black
    term.eraseLine()
    for (const seg of line.split(MARKER_RE)) {
      if (seg.length === 1 && STYLE[seg.charCodeAt(0)])
        term(STYLE[seg.charCodeAt(0)])
      else if (seg)
        term.noFormat(seg)
    }
  }

  private hdr(): string {
    const n = new Date()
    const D = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const MO = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    const dow = D[n.getDay()]
    const d = `${String(n.getDate()).padStart(2, '0')}${MO[n.getMonth()]}${String(n.getFullYear()).slice(2)}`
    const t = `${String(n.getHours()).padStart(2, '0')}${String(n.getMinutes()).padStart(2, '0')}Z`
    const spin = this.spinner >= 0 ? ['-', '\\', '|', '/'][this.spinner] + ' ' : ''
    const ctx = this.context ? `  ${spin}${this.context}` : ''
    const right = `${dow} ${d} ${t}`
    const mid = this.sessionName ? this.sessionName.toUpperCase() : 'AREA A'
    const left = ' FLIGHTS/RES'
    const g1 = Math.max(1, Math.floor((this.w - left.length - mid.length - right.length - ctx.length) / 2))
    const g2 = Math.max(1, this.w - left.length - ctx.length - g1 - mid.length - right.length)
    const text = `${left}${ctx}${' '.repeat(g1)}${mid}${' '.repeat(g2)}${right}`
    return text.length >= this.w ? text.slice(0, this.w) : text + ' '.repeat(this.w - text.length)
  }

  private key(name: string) {
    if (name === 'CTRL_C') { this.stop(); return }
    if (name === 'CTRL_L') { this.render(); return }
    if (name === 'CTRL_U') { this.input = ''; this.render(); return }
    if (name === 'ENTER') {
      const cmd = this.input.trim()
      this.input = ''
      if (cmd) { this.hist.unshift(cmd); this.hIdx = -1; this.onCmd(cmd) }
      else this.render()
      return
    }
    if (name === 'BACKSPACE' || name === 'DELETE') {
      this.input = this.input.slice(0, -1)
      this.render()
      return
    }
    if (name === 'UP') {
      if (this.hIdx < this.hist.length - 1) { this.hIdx++; this.input = this.hist[this.hIdx]; this.render() }
      return
    }
    if (name === 'DOWN') {
      if (this.hIdx > 0) { this.hIdx--; this.input = this.hist[this.hIdx]; this.render() }
      else if (this.hIdx === 0) { this.hIdx = -1; this.input = ''; this.render() }
      return
    }
    if (name === 'PAGE_UP') { this.scrollUp(); return }
    if (name === 'PAGE_DOWN') { this.scrollDown(); return }
    if (name.length === 1 && name.charCodeAt(0) >= 32 && name.charCodeAt(0) < 127) {
      this.input += name.toUpperCase()
      this.render()
    }
  }
}
