/** Force a real viewport in headless Chrome over CDP, because resize_window in
 *  the extension reports success without moving anything.
 *
 *    bun scripts/view.ts <url> <width> <height> measure <probe-file.js>
 *    bun scripts/view.ts <url> <width> <height> shot <out.png> [selector]
 *
 *  Omit the selector to capture the whole page. Under 768 the page gets touch
 *  emulation and a 3x DPR, so pointer:coarse rules and retina canvases behave. */
const [url, w, h, mode, arg, sel] = process.argv.slice(2)
const [width, height] = [+w, +h]
const mobile = width < 768

const t = await (
  await fetch(`http://127.0.0.1:9222/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
).json()
const ws = new WebSocket(t.webSocketDebuggerUrl)
let id = 0
const pending = new Map<number, (v: any) => void>()
const logs: string[] = []
ws.onmessage = (e) => {
  const m = JSON.parse(e.data as string)
  if (m.id && pending.has(m.id)) pending.get(m.id)!(m)
  if (m.method === 'Runtime.consoleAPICalled' && /error|warning/.test(m.params.type))
    logs.push(`${m.params.type}: ${m.params.args.map((a: any) => a.value ?? a.description).join(' ')}`)
  if (m.method === 'Runtime.exceptionThrown')
    logs.push(`exception: ${m.params.exceptionDetails.text} ${m.params.exceptionDetails.exception?.description ?? ''}`)
}
await new Promise((r) => (ws.onopen = r))
const send = (method: string, params: any = {}) =>
  new Promise<any>((r) => {
    const i = ++id
    pending.set(i, r)
    ws.send(JSON.stringify({ id: i, method, params }))
  })

await send('Runtime.enable')
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  // A full-page capture of this page at 3x is gigabytes and never returns.
  deviceScaleFactor: mode === 'shot' ? 1 : mobile ? 3 : 1,
  // Chrome's mobile flag inflates the CSS viewport (390 comes back as 417), which
  // is fatal for a breakpoint audit. Leave it off and emulate touch separately:
  // that keeps the width exact and still gives pointer:coarse.
  mobile: false,
  screenWidth: width,
  screenHeight: height,
})
if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 })
await send('Page.navigate', { url })
await Bun.sleep(3000)

if (mode === 'measure') {
  const probe = await Bun.file(arg).text()
  const res = await send('Runtime.evaluate', {
    expression: probe,
    returnByValue: true,
    awaitPromise: true,
  })
  console.log(res.result?.result?.value ?? JSON.stringify(res.result))
  if (logs.length) console.log('--- console ---\n' + logs.join('\n'))
} else {
  let clip: any
  let beyond = true
  if (sel) {
    // Two traps here, both of which produce a blank PNG that reads as a rendering
    // bug and is not one. First, captureBeyondViewport does not rasterize content
    // far down a long page, so the element has to be scrolled into view — and the
    // page sets scroll-behavior: smooth, so that scroll must be forced instant or
    // the wait expires mid-glide. Second, clip is in DOCUMENT coordinates even
    // with captureBeyondViewport off, so it stays r.y + scrollY, not r.y.
    beyond = false
    const box = await send('Runtime.evaluate', {
      expression: `(async () => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return 'null';
        e.scrollIntoView({ block: 'center', behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 1200));
        const r = e.getBoundingClientRect();
        return JSON.stringify({ x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }) })()`,
      returnByValue: true,
      awaitPromise: true,
    })
    if (box.result.result.value === 'null') throw new Error(`no element matches ${sel}`)
    clip = { ...JSON.parse(box.result.result.value), scale: +(process.env.SCALE ?? 1) }
  } else {
    // captureBeyondViewport alone pads the image by a scrollbar's width, so the
    // PNG comes out 26px wider than the viewport we asked for. Clip explicitly.
    const doc = await send('Runtime.evaluate', {
      expression: 'document.documentElement.scrollHeight',
      returnByValue: true,
    })
    clip = { x: 0, y: 0, width, height: doc.result.result.value, scale: 1 }
  }
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    ...(clip ? { clip } : {}),
    captureBeyondViewport: beyond,
  })
  await Bun.write(arg, Buffer.from(shot.result.data, 'base64'))
  console.log(`${arg} ${width}x${height}${clip ? ` clip=${JSON.stringify(clip)}` : ' fullpage'}`)
}
await send('Page.close')
ws.close()
