# Unavailable Features

Features not available from the Google Flights scraper backend.

## Not available

- Fare rules (refund/change/cancellation policies)
- Baggage allowance details
- Fare brands / booking classes
- Seat maps / seat attributes
- Price history / historical pricing
- Airline alliance filtering (server-side)
- Nearby airport expansion
- Visa/transit checks
- Corporate policy engine
- NDC/negotiated fares
- Real-time seat availability counts
- CO2 emissions data
- Aircraft type filtering
- Codeshare details
- Loyalty program earning
- Ancillaries (meals, wifi, power)

## Partially available (client-side approximation)

- **Time-of-day filtering** — post-fetch filter (`--dep-after`, `--dep-before`, `--arr-after`, `--arr-before`)
- **Duration filtering** — post-fetch filter (`--max-dur`)
- **Carrier filtering** — post-fetch filter on airline name (`--carrier`)
- **Flexible date search** — multi-search expansion, max 21 combinations (`flt matrix`)
- **Price monitoring** — polling only, no push notifications
