set shell := ["zsh", "-eu", "-o", "pipefail", "-c"]

default:
    @just --list
    @echo ''
    @echo "branch: $(git branch --show-current 2>/dev/null || echo 'n/a')"

[group('setup')]
install:
    bun install

[group('setup')]
install-api:
    cd api && uv sync

# Session name for tmux
_session := "flights-app"

[group('develop')]
dev:
    cd api && uv run uvicorn main:app --reload --port 7291 & \
    sleep 1 && bun run dev & \
    trap 'kill 0' EXIT; wait

# CF Workers local dev (requires build first): simulates production environment
[group('develop')]
wrangler-dev: build
    bunx wrangler pages dev --binding PASSWORD=test --binding SESSION_SECRET=$(openssl rand -hex 32)

[group('develop')]
dev-api:
    cd api && uv run uvicorn main:app --reload --port 7291

# Launch app in tmux with API (left) and UI (right) panes, opens iTerm
[group('develop')]
tmux-dev:
    @if tmux has-session -t {{_session}} 2>/dev/null; then \
        echo "Session '{{_session}}' already running. Opening iTerm..."; \
        osascript -e 'tell application "iTerm" to create window with default profile command "/opt/homebrew/bin/tmux attach -t {{_session}}"'; \
    else \
        tmux new-session -d -s {{_session}} -c {{justfile_directory()}}; \
        tmux send-keys -t {{_session}} 'cd api && uv run uvicorn main:app --reload --port 7291' Enter; \
        tmux split-window -h -t {{_session}} -c {{justfile_directory()}}; \
        tmux send-keys -t {{_session}} 'bun run dev' Enter; \
        tmux select-pane -t {{_session}}:0.0; \
        echo "Started tmux session '{{_session}}' with API (left) and UI (right)"; \
        sleep 0.5; \
        osascript -e 'tell application "iTerm" to create window with default profile command "/opt/homebrew/bin/tmux attach -t {{_session}}"'; \
    fi

# Attach to the running tmux session
[group('develop')]
tmux-attach:
    @if tmux has-session -t {{_session}} 2>/dev/null; then \
        tmux attach -t {{_session}}; \
    else \
        echo "No session '{{_session}}' found. Use 'just tmux-dev' to start."; \
    fi

# Kill the tmux session
[group('develop')]
tmux-kill:
    @if tmux has-session -t {{_session}} 2>/dev/null; then \
        tmux kill-session -t {{_session}}; \
        echo "Killed session '{{_session}}'"; \
    else \
        echo "No session '{{_session}}' to kill."; \
    fi

# Restart: kill and relaunch
[group('develop')]
tmux-restart: tmux-kill tmux-dev

# Show recent output from API pane (left)
[group('develop')]
tmux-logs-api:
    @if tmux has-session -t {{_session}} 2>/dev/null; then \
        tmux capture-pane -t {{_session}}:0.0 -p -S -50; \
    else \
        echo "No session '{{_session}}' found."; \
    fi

# Show recent output from UI pane (right)
[group('develop')]
tmux-logs-ui:
    @if tmux has-session -t {{_session}} 2>/dev/null; then \
        tmux capture-pane -t {{_session}}:0.1 -p -S -50; \
    else \
        echo "No session '{{_session}}' found."; \
    fi

# Show status of tmux session
[group('develop')]
tmux-status:
    @if tmux has-session -t {{_session}} 2>/dev/null; then \
        echo "Session '{{_session}}' is running"; \
        tmux list-panes -t {{_session}} -F "Pane #{pane_index}: #{pane_current_command}"; \
    else \
        echo "No session '{{_session}}' found."; \
    fi

[group('develop')]
preview:
    bun run preview

[group('develop')]
sync:
    bunx svelte-kit sync

[group('quality')]
lint:
    bun run lint

[group('quality')]
lint-fix:
    bun run lint:fix

[group('quality')]
typecheck:
    bun run check

[group('quality')]
test:
    bun run test

[group('quality')]
loc-check:
    #!/usr/bin/env zsh
    setopt null_glob
    err=0
    for f in src/**/*.ts src/**/*.svelte; do
        lines=$(wc -l < "$f")
        if (( lines > 400 )); then echo "error: $f ($lines lines, max 400)"; err=1
        elif (( lines > 300 )); then echo "warn: $f ($lines lines, target ≤300)"; fi
    done
    exit $err

[group('quality')]
check:
    @echo '→ Checking file lengths...'
    just loc-check
    @echo '→ Running lint...'
    just lint
    @echo '→ Running typecheck...'
    just typecheck
    @echo '→ Running tests...'
    just test

[group('build')]
build:
    bun run build

[group('cleanup')]
clean:
    rm -rf .svelte-kit/ build/ node_modules/.cache/
