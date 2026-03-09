import { env } from '$env/dynamic/private'
import { COOKIE, verifySession } from '$lib/server/session'
import { redirect } from '@sveltejs/kit'

export async function handle({ event, resolve }) {
  if (event.url.pathname.startsWith('/login')) return resolve(event)

  // Skip auth if no PASSWORD configured (local dev without env vars)
  if (!env.PASSWORD || !env.SESSION_SECRET) return resolve(event)

  const token = event.cookies.get(COOKIE)
  if (token && (await verifySession(env.SESSION_SECRET, env.PASSWORD, token))) return resolve(event)

  redirect(303, `/login?next=${encodeURIComponent(event.url.pathname)}`)
}
