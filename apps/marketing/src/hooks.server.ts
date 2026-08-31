import type { Handle } from '@sveltejs/kit'

/** The whole site is prerendered, so this runs once per page at build time —
 *  never at request time in production — and its output is baked into the
 *  static HTML. It exists only to stamp the real `<html lang>` onto the shell
 *  in `app.html`, which SvelteKit itself has no template variable for. Driven
 *  off the URL rather than route params so it also covers the 404 page and
 *  anything else outside the `[[lang]]` tree, which all default to English. */
export const handle: Handle = async ({ event, resolve }) => {
  const locale = event.url.pathname === '/nl' || event.url.pathname.startsWith('/nl/') ? 'nl' : 'en'
  return resolve(event, {
    transformPageChunk: ({ html }) => html.replace('<html lang="en">', `<html lang="${locale}">`),
  })
}
