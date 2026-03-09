/**
 * Minimal ambient types for Cloudflare Workers globals used in server code.
 * Avoids importing the full @cloudflare/workers-types which conflicts with DOM types.
 */

interface TextChunk {
  readonly text: string
  readonly lastInTextNode: boolean
  replace(content: string, options?: { html?: boolean }): this
  before(content: string, options?: { html?: boolean }): this
  after(content: string, options?: { html?: boolean }): this
  remove(): this
  readonly removed: boolean
}

interface ElementHandlers {
  element?(element: Element): void | Promise<void>
  text?(chunk: TextChunk): void | Promise<void>
}

declare class HTMLRewriter {
  on(selector: string, handlers: ElementHandlers): this
  transform(response: Response): Response
}
