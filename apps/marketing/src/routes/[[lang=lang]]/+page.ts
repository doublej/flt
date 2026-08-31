import type { EntryGenerator } from './$types'

/** Both locales, explicitly — the crawler would find `''` on its own by
 *  seeding from `/`, but `nl` only exists as a route param value and has to
 *  be told. */
export const entries: EntryGenerator = () => [{ lang: '' }, { lang: 'nl' }]
