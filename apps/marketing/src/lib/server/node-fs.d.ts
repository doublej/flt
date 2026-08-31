/** The site builds for Workers, where node:fs does not exist, so @types/node is
 *  not installed here. The dev-only queue still needs two calls from it, and
 *  declaring just those beats pulling in a types package the build never uses —
 *  the same trick packages/core plays for HTMLRewriter. */
declare module 'node:fs/promises' {
  export function mkdir(path: URL, options: { recursive: boolean }): Promise<string | undefined>
  export function writeFile(path: URL, data: string): Promise<void>
}
