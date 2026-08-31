/**
 * Minimal ambient types for the node and bun surface this app touches.
 *
 * The workspace has no @types/node or @types/bun installed, so `tsc --noEmit` cannot
 * see `node:path` or `bun:test` on its own. Same trick, and same reason, as
 * `packages/core/src/cloudflare.d.ts`: declare the handful of members actually used
 * rather than pull in a types package that conflicts with what is already here.
 * Delete this file the day @types/bun lands in the workspace.
 */

declare module 'node:fs' {
  export function existsSync(path: string): boolean
}

declare module 'node:fs/promises' {
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>
  export function readFile(path: string, encoding: 'utf-8'): Promise<string>
  export function writeFile(path: string, data: string, encoding: 'utf-8'): Promise<void>
  export function readdir(path: string): Promise<string[]>
  export function rename(from: string, to: string): Promise<void>
  export function rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>
}

declare module 'node:path' {
  export function join(...parts: string[]): string
  export function resolve(...parts: string[]): string
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string
}

declare module 'node:os' {
  export function tmpdir(): string
}

declare module 'bun:test' {
  type Matchers = {
    toBe(expected: unknown): void
    toEqual(expected: unknown): void
    toThrow(expected?: string | RegExp): void
    toContain(expected: string): void
  }
  export function describe(name: string, fn: () => void): void
  export function test(name: string, fn: () => void | Promise<void>): void
  export function expect(actual: unknown): Matchers
}

declare const process: {
  argv: string[]
  env: Record<string, string | undefined>
  exit(code?: number): never
}

declare function setTimeout(fn: () => void, ms: number): unknown
