# flights-app (web)

> SvelteKit flight search UI deployed on Cloudflare Pages

## Stack

- TypeScript, bun, Biome, Vitest
- SvelteKit + Vite, Cloudflare Pages adapter
- Flight engine from `@flights/core` (workspace package)

## Commands

Use `just` as the task runner:

- `just check` — run all checks (loc-check + lint + typecheck + test)
- `just loc-check` — check file lengths (warn >300, error >400 lines)
- `just typecheck` — TypeScript type checking
- `just dev` — start dev server
- `just build` — production build
- `just preview` — preview production build
- `just sync` — sync SvelteKit types
- `just test` — run tests
- `just lint-fix` — auto-fix lint issues
- `just install` — install dependencies

## Project Structure

```
src/
├── routes/
│   ├── +layout.svelte    # root layout
│   ├── +page.svelte      # home page
│   ├── api/              # API routes (airports, flights) — import from @flights/core
│   └── login/            # login page
├── lib/
│   ├── components/       # UI components (SearchForm, FlightCard, FlightMap, PriceGrid, etc.)
│   ├── data/             # static data (airports.ts)
│   ├── server/           # server-only code (session.ts)
│   ├── utils/            # utility modules (dates.ts re-export, geo.ts, markdown.ts, sort.ts)
│   ├── api.ts            # API client
│   ├── types.ts          # re-exports from @flights/core
│   └── recent-searches.ts
├── hooks.server.ts       # server hooks
├── app.css               # global styles
└── app.html              # HTML shell
svelte.config.js          # SvelteKit config (Cloudflare adapter)
vite.config.ts            # Vite config
wrangler.toml             # Cloudflare Workers config
package.json              # project config, dependencies
tsconfig.json             # TypeScript config
biome.json                # linter/formatter config
Justfile                  # task runner
```

## Conventions

- ES modules (`"type": "module"`)
- Strict TypeScript config
- Biome for linting and formatting (not ESLint/Prettier)
- SvelteKit file-based routing (`src/routes/`)
- Shared code in `src/lib/`
- Keep functions small (5–10 lines target, 20 max)
- Prefer explicit, readable code over cleverness
- Handle errors at boundaries; let unexpected errors surface

See [agent.md](agent.md) for AI coding agent workflow and guidelines.
