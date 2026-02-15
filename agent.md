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

## Agent

### Verify Loop

Run after every change:

1. `just lint-fix`
2. `just sync` (after adding/renaming routes)
3. `just typecheck`
4. `just test`

### Auto-fixable

- `bun run biome check --write src/` — auto-fix lint and format issues in one command
- `just sync` — regenerate SvelteKit types after route changes

### Common Tasks

- Add a page: create `src/routes/<path>/+page.svelte`
- Add a server route: create `src/routes/<path>/+server.ts`
- Add a load function: create `+page.ts` or `+page.server.ts` alongside the page
- Add a shared component: create it in `src/lib/components/`
- Use the `$lib/` alias for imports from `src/lib/`
- Add a dependency: `bun add <package>`

### Testing

- Test files: `src/**/*.test.ts` (co-located with source)
- Framework: Vitest
- Test load functions by importing directly and mocking fetch/params
- Run a single test: `bun run vitest run src/foo.test.ts`

### Boundaries

- Do not run `just dev` — never start the dev server
- Do not deploy or push
- Do not install ESLint or Prettier — this project uses Biome
- Do not modify `svelte.config.js` without asking
