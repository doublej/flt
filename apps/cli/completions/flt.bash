# Bash completion for flt — flight search CLI
# Source: source apps/cli/completions/flt.bash

_flt() {
  local cur prev words cword
  _init_completion || return

  local commands="search inspect matrix airports itinerary takeout session config prime"
  local seat_values="economy premium-economy business first"
  local fmt_values="table tsv jsonl brief"
  local sort_values="price dur stops dep"
  local view_values="min std full"
  local session_cmds="start close list rename"
  local config_keys="currency fmt seat pax limit"

  # Find the subcommand
  local subcmd=""
  local i
  for ((i = 1; i < cword; i++)); do
    case ${words[i]} in
      search|inspect|matrix|airports|itinerary|takeout|session|config|prime)
        subcmd=${words[i]}
        break
        ;;
    esac
  done

  if [[ -z $subcmd ]]; then
    COMPREPLY=($(compgen -W "$commands" -- "$cur"))
    return
  fi

  # Handle --flag=value or --flag value
  case $prev in
    --seat)       COMPREPLY=($(compgen -W "$seat_values" -- "$cur")); return ;;
    --fmt)        COMPREPLY=($(compgen -W "$fmt_values" -- "$cur")); return ;;
    --sort)       COMPREPLY=($(compgen -W "$sort_values" -- "$cur")); return ;;
    --view)       COMPREPLY=($(compgen -W "$view_values" -- "$cur")); return ;;
    --max-stops)  COMPREPLY=($(compgen -W "0 1 2" -- "$cur")); return ;;
    --currency)   COMPREPLY=($(compgen -W "EUR USD GBP JPY AUD CAD CHF" -- "$cur")); return ;;
    -o|--output)  _filedir; return ;;
  esac

  case $subcmd in
    search)
      COMPREPLY=($(compgen -W "--seat --pax --max-stops --currency --fmt --fields --view --sort --limit --dep-after --dep-before --arr-after --arr-before --max-dur --direct --carrier --refresh --date-end --return-date-end" -- "$cur"))
      ;;
    inspect)
      COMPREPLY=($(compgen -W "--fmt" -- "$cur"))
      ;;
    matrix)
      COMPREPLY=($(compgen -W "--seat --pax --max-stops --max-dur --currency --fmt" -- "$cur"))
      ;;
    airports)
      COMPREPLY=($(compgen -W "--limit" -- "$cur"))
      ;;
    itinerary)
      COMPREPLY=($(compgen -W "--title --note" -- "$cur"))
      ;;
    takeout)
      COMPREPLY=($(compgen -W "-o --output --title --keep-session" -- "$cur"))
      ;;
    session)
      # Find session subcommand
      local sess_sub=""
      for ((i = i + 1; i < cword; i++)); do
        case ${words[i]} in
          start|close|list|rename) sess_sub=${words[i]}; break ;;
        esac
      done
      if [[ -z $sess_sub ]]; then
        COMPREPLY=($(compgen -W "$session_cmds" -- "$cur"))
      elif [[ $sess_sub == rename ]]; then
        COMPREPLY=($(compgen -W "--id" -- "$cur"))
      fi
      ;;
    config)
      # Complete config keys for first positional
      local key_given=false
      for ((i = i + 1; i < cword; i++)); do
        [[ ${words[i]} != -* ]] && key_given=true && break
      done
      if ! $key_given; then
        COMPREPLY=($(compgen -W "$config_keys --unset" -- "$cur"))
      else
        COMPREPLY=($(compgen -W "--unset" -- "$cur"))
      fi
      ;;
  esac
}

complete -F _flt flt
