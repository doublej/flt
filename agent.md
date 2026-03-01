# Agent Guidelines

See [CLAUDE.md](CLAUDE.md) for stack, commands, structure, and conventions.

## Verify Loop

Run after every change:

1. `just lint-fix`
2. `just sync` (after adding/renaming routes)
3. `just typecheck`
4. `just test`

## Auto-fixable

- `bun run biome check --write src/` — auto-fix lint and format issues in one command
- `just sync` — regenerate SvelteKit types after route changes

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
- Do not deploy or push
- Do not install ESLint or Prettier — this project uses Biome
- Do not modify `svelte.config.js` without asking

## Issue Tracking (beads)

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Session Completion

When ending a work session, complete ALL steps:

1. **File issues** for remaining work
2. **Run quality gates** (if code changed) — tests, linters, builds
3. **Update issue status** — close finished work, update in-progress items
4. **Push to remote**:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # must show "up to date with origin"
   ```
5. **Hand off** — provide context for next session

Work is NOT complete until `git push` succeeds.
