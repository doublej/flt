import { expect, test } from 'bun:test'
import { Glob } from 'bun'

/** `nl.ts` is typed `Messages = typeof en`, so a *missing* key is a type error.
 *  A *bypassed* lookup is not: a component that imports `en` directly compiles
 *  clean and quietly serves English on /nl. Four of them did, which is why this
 *  exists. Copy is reached through `getCopy()` inside `$derived`, never here. */
const ALLOWED = new Set([
  'src/lib/i18n/copy.svelte.ts', // the one place that chooses between en and nl
  'src/lib/i18n/nl.ts', // typed against en
  'src/lib/i18n/no-direct-en.test.ts', // this file
  'src/routes/api/checkout/+server.ts', // server route, no reactive context
])

test('nothing imports the English copy directly', async () => {
  const root = new URL('../../../', import.meta.url).pathname
  const offenders: string[] = []

  for await (const file of new Glob('src/**/*.{svelte,ts}').scan(root)) {
    if (ALLOWED.has(file) || file === 'src/lib/i18n/en.ts') continue

    const source = await Bun.file(root + file).text()
    // `import type { en }` is erased at build time and cannot serve a string.
    const runtime = source.replace(/^\s*import\s+type\s[^\n]*$/gm, '')
    if (/from\s+['"][^'"]*i18n\/en['"]/.test(runtime)) offenders.push(file)
  }

  expect(offenders).toEqual([])
})
