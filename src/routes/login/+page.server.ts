import { fail, redirect } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { signSession, COOKIE, COOKIE_OPTS } from '$lib/server/session'

export const actions = {
  default: async ({ request, cookies, url }) => {
    const pw = String((await request.formData()).get('password') ?? '')
    if (!env.PASSWORD || !env.SESSION_SECRET) return fail(500, { error: 'Auth not configured' })
    if (pw !== env.PASSWORD) return fail(401, { error: 'Incorrect password' })
    cookies.set(COOKIE, await signSession(env.SESSION_SECRET, pw), COOKIE_OPTS)
    const next = url.searchParams.get('next') ?? '/'
    redirect(303, next.startsWith('/') ? next : '/')
  },
}
