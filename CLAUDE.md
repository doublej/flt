# flights-app

> SvelteKit + FastAPI flight search UI, backed by `fast-flights`

## Stack

- TypeScript, bun, Biome, Vitest
- SvelteKit + Vite

## Commands

Use `just` as the task runner:

- `just check` — run all checks (loc-check + lint + typecheck + test)
- `just loc-check` — check file lengths (warn >300, error >400 lines)
- `just dev` — start dev server
- `just build` — production build
- `just preview` — preview production build
- `just sync` — sync SvelteKit types
- `just test` — run tests
- `just lint-fix` — auto-fix lint issues

## Project Structure

```
src/
├── routes/
│   └── +page.svelte    # home page
├── lib/                # shared modules
└── app.html            # HTML shell
svelte.config.js        # SvelteKit config
vite.config.ts          # Vite config
package.json            # project config, dependencies
tsconfig.json           # TypeScript config
biome.json              # linter/formatter config
Justfile                # task runner
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
