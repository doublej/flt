# flights-app

SvelteKit + FastAPI flight search UI, backed by [`fast-flights`](../fast-flights/).

## Requirements

- [Bun](https://bun.sh/)
- [uv](https://docs.astral.sh/uv/) (for the Python API)
- [just](https://just.systems/) (task runner)

## Getting Started

```bash
just install        # install UI dependencies
just install-api    # install API dependencies
just tmux-dev       # start API + UI in tmux
```

## Common Commands

| Command | Description |
|---------|-------------|
| `just dev` | Start API + UI dev servers |
| `just build` | Build for production |
| `just check` | Run all checks (loc-check + lint + typecheck + test) |
| `just test` | Run tests |
| `just lint-fix` | Auto-fix lint issues |

Run `just` for the full command list.
