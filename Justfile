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

# Bureau — commercial site
[group('develop')]
marketing:
    cd apps/marketing && bun run dev

[group('build')]
marketing-build:
    cd apps/marketing && bun run build

# Deploy marketing site to Cloudflare Pages (flt-ecom.jurrejan.com)
[group('deploy')]
marketing-deploy: marketing-build
    cd apps/marketing && CLOUDFLARE_ACCOUNT_ID=e26bfba81a629fb8b4dcd538b1f73781 \
        bunx wrangler pages deploy .svelte-kit/cloudflare --project-name flights-marketing --branch production

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
    cd apps/mcp && bun run test

# Flight search CLI
[group('cli')]
flt *args:
    cd apps/cli && bun run src/index.ts {{args}}

# Sabre-style TUI
[group('cli')]
tui *args:
    cd apps/tui && bun run src/index.ts {{args}}

# flt MCP server (stdio)
[group('cli')]
mcp:
    cd apps/mcp && bun run src/index.ts
