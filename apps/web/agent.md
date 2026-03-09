# Agent Guidelines

See [CLAUDE.md](CLAUDE.md) for stack, commands, structure, and conventions.

## Verify Loop

Run after every change:

1. `just lint-fix` — auto-fix lint and format issues
2. `just sync` (only after adding/renaming routes)
3. `just check` — runs loc-check + lint + typecheck + test

## Common Tasks

- Add a page: create `src/routes/<path>/+page.svelte`
- Add a server route: create `src/routes/<path>/+server.ts`
- Add a load function: create `+page.ts` or `+page.server.ts` alongside the page
- Add a shared component: create it in `src/lib/components/`
- Use the `$lib/` alias for imports from `src/lib/`
- Add a dependency: `bun add <package>`

## Testing

- Test files: `src/**/*.test.ts` (co-located with source)
- Framework: Vitest
- Test load functions by importing directly and mocking fetch/params
- Run a single test: `bun run vitest run src/foo.test.ts`

## Boundaries

- Do not run `just dev` — never start the dev server
- Do not deploy
- Do not install ESLint or Prettier — this project uses Biome
- Do not modify `svelte.config.js` without asking

## Session Completion

When ending a work session, complete ALL steps:

1. **Run quality gates** (if code changed) — tests, linters, builds
2. **Push to remote**:
   ```bash
   git pull --rebase
   git push
   git status  # must show "up to date with origin"
   ```
3. **Hand off** — provide context for next session

Work is NOT complete until `git push` succeeds.
