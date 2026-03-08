# flights-app

SvelteKit flight search UI deployed on Cloudflare Pages.

## Requirements

- [Bun](https://bun.sh/)
- [just](https://just.systems/) (task runner)

## Getting Started

```bash
just install        # install dependencies
just dev            # start dev server
```

## Common Commands

| Command | Description |
|---------|-------------|
| `just dev` | Start dev server |
| `just build` | Build for production |
| `just check` | Run all checks (loc-check + lint + typecheck + test) |
| `just test` | Run tests |
| `just lint-fix` | Auto-fix lint issues |
| `just flt <cmd>` | Flight search CLI (search, inspect, matrix, itinerary, airports, takeout, config, prime) |

Run `just` for the full command list.
