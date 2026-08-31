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
    cd apps/marketing && just check

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
    cd apps/marketing && bun run test

# Pull paid briefs out of Stripe into .bureau/queue for the desk to run.
[group('bureau')]
pull:
    cd apps/marketing && onenv run -- bun scripts/pull-briefs.ts

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

# --- eyes ---------------------------------------------------------------------
# Headless Chrome over CDP, because the browser extension's resize_window reports
# success without moving anything. See scripts/view.ts for the traps it encodes.

# Chrome on 9222, started once and left running.
[private]
chrome:
    #!/usr/bin/env zsh
    curl -sf http://127.0.0.1:9222/json/version >/dev/null && exit 0
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
        --headless=new --remote-debugging-port=9222 \
        --user-data-dir=/tmp/flights-chrome >/dev/null 2>&1 &
    for _ in {1..40}; do
        curl -sf http://127.0.0.1:9222/json/version >/dev/null && exit 0
        sleep 0.25
    done
    echo "chrome never answered on 9222" >&2
    exit 1

# just shot http://localhost:3848/ 390 844 hero.png '#brief'
[group('view')]
shot url width height out *selector: chrome
    mkdir -p local/shots
    bun scripts/view.ts "{{url}}" {{width}} {{height}} shot "local/shots/{{out}}" {{selector}}

# just measure http://localhost:3848/ 390 844 probe.js  — probe.js is evaluated in the page
[group('view')]
measure url width height probe: chrome
    bun scripts/view.ts "{{url}}" {{width}} {{height}} measure "{{probe}}"

# The standard sweep: phone, big phone, tablet portrait/landscape, laptop, desktop.
[group('view')]
breakpoints url: chrome
    #!/usr/bin/env zsh
    mkdir -p local/shots
    for wh in 390x844 430x932 768x1024 1024x768 1280x800 1440x900 1920x1080; do
        bun scripts/view.ts "{{url}}" ${wh%x*} ${wh#*x} shot "local/shots/bp-${wh}.png"
    done
