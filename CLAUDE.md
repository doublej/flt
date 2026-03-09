# flights

Bun workspace monorepo: `@flights/core` engine + SvelteKit web UI + `flt` CLI + Sabre-style TUI.

## Structure

```
packages/core/     # @flights/core — flight search engine (pure TS, zero deps)
packages/partner/  # @flights/partner — Travelpayouts partner API client
apps/web/          # SvelteKit UI (Cloudflare Pages)
apps/cli/          # flt CLI (citty, bun-only)
apps/tui/          # Sabre-style TUI (terminal-kit)
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

See `apps/web/CLAUDE.md` for web-specific commands.
