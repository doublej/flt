import { spawn } from 'node:child_process'
import {
  CONSENT_COOKIE,
  type Fetcher,
  type ScrapeResult,
  type SearchQuery,
  buildGoogleFlightsUrl,
  decodeShoppingResults,
} from '@flights/core'

/**
 * Fetch results Google only serves to a real browser. Multi-city (open-jaw) pages
 * arrive without results; the page's own scripts request them afterwards with an
 * anti-bot token we don't forge. So headless Chrome loads the page and we read
 * the GetShoppingResults response it receives, then decode it like ds:1.
 *
 * Shares the instance `just chrome` starts (port 9222, /tmp/flights-chrome).
 */
const PORT = 9222
// ponytail: macOS Chrome path only; add a FLT_CHROME override when someone runs this elsewhere
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const TIMEOUT_MS = 20_000
// The consent cookies the plain fetch sends, as [name, value] pairs for CDP.
const COOKIES = CONSENT_COOKIE.split('; ').map((c) => [c.slice(0, c.indexOf('=')), c.slice(c.indexOf('=') + 1)])

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const isUp = () =>
  fetch(`http://127.0.0.1:${PORT}/json/version`).then(
    (r) => r.ok,
    () => false,
  )

async function ensureChrome(): Promise<void> {
  if (await isUp()) return
  spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--user-data-dir=/tmp/flights-chrome'], {
    detached: true,
    stdio: 'ignore',
  }).unref()
  for (let i = 0; i < 40; i++) {
    if (await isUp()) return
    await sleep(250)
  }
  throw new Error(`Headless Chrome never answered on port ${PORT}. Is Google Chrome installed at ${CHROME}?`)
}

/** Open-jaw results only reach a real browser; everything else keeps the plain fetch. */
export const fetcherFor = (q: SearchQuery): Fetcher | undefined => (q.return_from ? fetchFlightsViaChrome : undefined)

async function fetchFlightsViaChrome(b64: string, currency: string): Promise<ScrapeResult> {
  await ensureChrome()
  const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((r) => (ws.onopen = r))

  let id = 0
  const pending = new Map<number, (v: any) => void>()
  const send = (method: string, params: object = {}) =>
    new Promise<any>((r) => {
      pending.set(++id, r)
      ws.send(JSON.stringify({ id, method, params }))
    })
  let resolveBody: (body: string) => void = () => {}
  const body = new Promise<string>((r) => (resolveBody = r))

  ws.onmessage = async (e) => {
    const m = JSON.parse(e.data as string)
    if (m.id) pending.get(m.id)?.(m.result)
    if (m.method !== 'Fetch.requestPaused') return
    const res = await send('Fetch.getResponseBody', { requestId: m.params.requestId })
    await send('Fetch.continueRequest', { requestId: m.params.requestId })
    if (res) resolveBody(res.base64Encoded ? Buffer.from(res.body, 'base64').toString('utf8') : res.body)
  }

  await send('Network.enable')
  for (const [name, value] of COOKIES)
    await send('Network.setCookie', { name, value, domain: '.google.com', path: '/', secure: true })
  await send('Fetch.enable', { patterns: [{ urlPattern: '*GetShoppingResults*', requestStage: 'Response' }] })
  await send('Page.navigate', { url: buildGoogleFlightsUrl(b64, currency) })

  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<null>((r) => (timer = setTimeout(() => r(null), TIMEOUT_MS)))
  const raw = await Promise.race([body, timeout])
  clearTimeout(timer) // a pending timer would hold the process open for the full timeout
  ws.close()
  await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`)
  return raw === null ? { flights: [], error: 'no_data' } : decodeShoppingResults(raw)
}
