# flights

Flight search engine with CLI, TUI, and web interfaces. Scrapes Google Flights and compares results.

## Quick start

```bash
bun install
just dev                              # web dev server
just flt search AMS NRT 2026-04-10    # CLI search
just tui                              # Sabre-style terminal
```

## Apps

| App | Description | Docs |
|-----|-------------|------|
| [Web UI](apps/web/) | SvelteKit search UI on Cloudflare Pages — streaming results, price grid, filter panel, itinerary builder, route maps | [apps/web/README.md](apps/web/README.md) |
| [CLI](apps/cli/) | `flt` command-line tool (citty) — search, matrix, inspect, itinerary, takeout export | [apps/cli/README.md](apps/cli/README.md) |
| [TUI](apps/tui/) | Sabre/GDS-style green-on-black fullscreen terminal — keyboard-driven with CRT aesthetics | [apps/tui/README.md](apps/tui/README.md) |
| [MCP](apps/mcp/) | `flt-mcp` MCP server (stdio) — the flt CLI's command surface as agent tools | — |

## Packages

| Package | Description |
|---------|-------------|
| [`@flights/core`](packages/core/) | Flight search engine — pure TypeScript, zero npm dependencies |

## MCP server

`apps/mcp` exposes the flt CLI's command surface as MCP tools over stdio: `search`, `compare`, `matrix`, `airports`, `connections`, `inspect`, `itinerary`, `learn`, `vote`, `learnings`, and `session`. All logic is imported from `@flights/core` and `@flights/cli`; cache, sessions, and the learnings store (`~/.config/flt/learnings.json`) are shared with the CLI, so offer IDs and refs work across both.

```bash
just mcp                    # start the server (stdio)
claude mcp add flt -- bun run /path/to/flights/apps/mcp/src/index.ts
```

## Structure

```
packages/core/       @flights/core — search engine, scraper, types, booking
apps/web/            SvelteKit UI (Cloudflare Pages)
apps/cli/            flt CLI (citty, bun-only)
apps/tui/            Sabre-style TUI (terminal-kit)
apps/mcp/            flt-mcp MCP server (@modelcontextprotocol/sdk, stdio)
docs/                marketing landing page
```

## Commands

| Command | Description |
|---------|-------------|
| `just install` | Install all workspace deps |
| `just dev` | Start web dev server |
| `just build` | Production build |
| `just check` | Lint + typecheck + test |
| `just flt <cmd>` | Flight search CLI |
| `just tui` | Sabre-style terminal UI |
| `just mcp` | flt MCP server (stdio) |
