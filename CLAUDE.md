# flights

Bun workspace monorepo: `@flights/core` engine + SvelteKit web UI + `flt` CLI + Sabre-style TUI + MCP server.

## Structure

```
packages/core/     # @flights/core — flight search engine (pure TS, zero deps)
apps/web/          # SvelteKit UI (Cloudflare Pages)
apps/cli/          # flt CLI (citty, bun-only)
apps/tui/          # Sabre-style TUI (terminal-kit)
apps/mcp/          # flt-mcp MCP server (stdio) — mirrors the CLI, reuses core/cli modules
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

See `apps/web/CLAUDE.md` for web-specific commands.
