# flights

Flight search engine with CLI, TUI, and web interfaces. Scrapes Google Flights, compares results, and generates booking links with affiliate revenue.

## Structure

```
packages/core/     @flights/core — flight search engine (pure TS, zero deps)
apps/web/          SvelteKit UI (Cloudflare Pages)
apps/cli/          flt CLI (citty, bun-only)
apps/tui/          Sabre-style TUI (raw terminal)
docs/              docs site
```

## Quick start

```bash
bun install
just dev        # web dev server
just flt search AMS NRT 2026-04-10   # CLI
just tui        # Sabre-style terminal
```

## Affiliate revenue (Travelpayouts)

This project integrates with [Travelpayouts](https://app.travelpayouts.com/dashboard/505891) to earn commissions on flight bookings made through generated links.

### How it works

1. **Search** — users find flights via the CLI, TUI, or web UI
2. **Booking links** — results include affiliate deep links to partner booking sites (currently [Aviasales](https://www.aviasales.com))
3. **Revenue** — when a user clicks an affiliate link and completes a booking, a commission is earned through the Travelpayouts network

### Setup

Configure your Travelpayouts credentials:

```bash
flt config marker 709151      # your Travelpayouts marker ID
flt config trs 505891         # your project/tracking ID
```

These are stored in `~/.config/flt/config.json` and used automatically when generating booking links.

