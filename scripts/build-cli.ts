import { resolve } from 'node:path'

const libDir = resolve(import.meta.dirname, '../src/lib')

const result = await Bun.build({
  entrypoints: ['src/cli/index.ts'],
  outdir: 'dist',
  target: 'bun',
  naming: 'flt.js',
  plugins: [
    {
      name: 'resolve-lib',
      setup(build) {
        build.onResolve({ filter: /^\$lib/ }, async (args) => {
          const base = resolve(libDir, args.path.replace('$lib/', ''))
          for (const ext of ['', '.ts', '.js', '/index.ts', '/index.js']) {
            const candidate = base + ext
            if (await Bun.file(candidate).exists()) {
              return { path: candidate }
            }
          }
          return { path: base }
        })
      }
    }
  ]
})

if (!result.success) {
  console.error('Build failed:', result.logs)
  process.exit(1)
}

const outPath = resolve(import.meta.dirname, '../dist/flt.js')
const content = await Bun.file(outPath).text()
await Bun.write(outPath, `#!/usr/bin/env bun\n${content}`)

console.log(`Built dist/flt.js (${(result.outputs[0].size / 1024).toFixed(0)} KB)`)
