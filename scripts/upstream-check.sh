#!/usr/bin/env bash
# fast-flights commits to its library code (fast_flights/) newer than the one
# packages/core/upstream.txt pins: upstream changes our TS port has not been checked against.
#   scripts/upstream-check.sh          print them (nothing when up to date)
#   scripts/upstream-check.sh --hook   same, as SessionStart hook JSON
#   scripts/upstream-check.sh --ack    pin the newest commit once it is ported or dismissed
set -euo pipefail
cd "$(dirname "$0")/.."

pin_file=packages/core/upstream.txt
pin=$(<"$pin_file")
repo=${pin%@*}
reviewed=${pin#*@}

fetch() {
  # Newest first, default branch; docs and CI churn are left out by the path filter.
  gh api "repos/$repo/commits?path=fast_flights&per_page=30" \
    --jq '.[] | "\(.sha) \(.commit.author.date[:10]) \(.commit.message | split("\n")[0])"'
}

if [[ ${1:-} == --hook ]]; then
  commits=$(fetch 2>/dev/null) || exit 0 # offline or gh logged out: never block a session start
else
  commits=$(fetch)
fi

if [[ ${1:-} == --ack ]]; then
  latest=${commits%%$'\n'*}
  echo "$repo@${latest%% *}" >"$pin_file"
  echo "pinned $repo@${latest:0:7}"
  exit 0
fi

new=$(awk -v r="$reviewed" '$1 == r { exit } { $1 = substr($1, 1, 7); print }' <<<"$commits")
[[ -z $new ]] && exit 0

if [[ ${1:-} != --hook ]]; then
  echo "$new"
  exit 0
fi

count=$(wc -l <<<"$new" | tr -d ' ')
jq -n --arg repo "$repo" --arg new "$new" --arg count "$count" '{
  systemMessage: "fast-flights (\($repo)) has \($count) upstream change(s) our port has not been checked against:\n\($new)",
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: "Upstream fast-flights (\($repo)) has \($count) commit(s) to fast_flights/ newer than the pin in packages/core/upstream.txt. Our scraper in packages/core/src (scrape.ts, decode.ts, proto.ts) is a port of it, so these may need porting:\n\($new)\nMention this to the user. Review one with `gh api repos/\($repo)/commits/<sha>`; after porting or dismissing them run `just upstream --ack`."
  }
}'
