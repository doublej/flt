# flights

Bun workspace monorepo: `@flights/core` engine + SvelteKit web UI + `flt` CLI + Sabre-style TUI + MCP server.

## Structure

```
packages/core/     # @flights/core — flight search engine (pure TS, zero deps)
apps/web/          # SvelteKit UI (Cloudflare Pages)
apps/cli/          # flt CLI (citty, bun-only)
apps/tui/          # Sabre-style TUI (terminal-kit)
apps/mcp/          # flt-mcp MCP server (stdio) — mirrors the CLI, reuses core/cli modules
apps/marketing/    # Bureau — the commercial SvelteKit site + Stripe Checkout,
                   #   deployed to Cloudflare Pages (flt-ecom.jurrejan.com), dev on 3848
apps/bureau/       # @flights/bureau — the Claude Agent SDK desk that runs paid briefs
docs/              # docs site
```

## Quick start

```bash
bun install
just dev
```

## Commands

- `just install` — install all workspace deps
- `just dev` — start web dev server
- `just build` — production build
- `just check` — lint + typecheck + test
- `just flt <cmd>` — flight search CLI
- `just tui` — Sabre-style terminal UI
- `just mcp` — flt MCP server (stdio)
- `just upstream` — fast-flights commits our scraper port hasn't been checked against (`--ack` after porting); runs as a SessionStart hook too

Bureau (the commercial site):

- `just marketing` — marketing dev server (**3848**)
- `just marketing-build` / `just marketing-deploy` — build and ship to Cloudflare Pages
- `just pull` — pull paid briefs out of Stripe into `.bureau/queue/` for the desk

Eyes — headless Chrome over CDP, because the browser extension's `resize_window`
reports success without moving anything:

- `just shot <url> <w> <h> <out.png> [selector]` — one screenshot into `local/shots/`
- `just measure <url> <w> <h> <probe.js>` — evaluate a probe in the page
- `just breakpoints <url>` — the standard 7-width sweep

See `apps/web/CLAUDE.md` for the flight-search UI and `apps/marketing/CLAUDE.md`
for the commercial site — the latter also carries the owned-paths table that keeps
concurrent sessions off each other's files.
