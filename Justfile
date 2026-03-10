set shell := ["zsh", "-eu", "-o", "pipefail", "-c"]

default:
    @just --list

[group('setup')]
install:
    bun install

[group('develop')]
dev:
    cd apps/web && bun run dev

[group('build')]
build:
    cd apps/web && bun run build

[group('quality')]
check:
    cd apps/web && just check

[group('quality')]
typecheck:
    cd apps/web && just typecheck

[group('quality')]
lint:
    cd apps/web && just lint

[group('quality')]
lint-fix:
    cd apps/web && just lint-fix

[group('quality')]
test:
    cd apps/web && bun run test
    cd apps/cli && bun run test

# Flight search CLI
[group('cli')]
flt *args:
    cd apps/cli && bun run src/index.ts {{args}}

# Sabre-style TUI
[group('cli')]
tui *args:
    cd apps/tui && bun run src/index.ts {{args}}
