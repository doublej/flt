/**
 * Stateless HMAC session helpers.
 * Token format: `${day}:${HMAC(secret, password+":"+day)}`
 * Works in CF Workers (Web Crypto) and Node 20+.
 */

const DAYS = 30
export const COOKIE = 'session'
export const COOKIE_OPTS = {
  path: '/',
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  maxAge: DAYS * 86400,
}

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function signSession(secret: string, password: string): Promise<string> {
  const day = Math.floor(Date.now() / 86400000)
  return `${day}:${await hmac(secret, `${password}:${day}`)}`
}

export async function verifySession(
  secret: string,
  password: string,
  token: string,
): Promise<boolean> {
  const colon = token.indexOf(':')
  if (colon < 1) return false
  const day = Number(token.slice(0, colon))
  if (!day) return false
  if (Math.floor(Date.now() / 86400000) - day > DAYS) return false
  const expected = await hmac(secret, `${password}:${day}`)
  return token === `${day}:${expected}`
}
