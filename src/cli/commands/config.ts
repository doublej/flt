import { defineCommand } from 'citty'
import { type FltConfig, isValidKey, loadConfig, saveConfig } from '../config'

export const configCommand = defineCommand({
  meta: { name: 'config', description: 'Get/set CLI defaults (currency, fmt, seat, pax, limit)' },
  args: {
    key: { type: 'positional', description: 'Config key (or omit to list all)', required: false },
    value: { type: 'positional', description: 'Value to set (omit to read)', required: false },
    unset: { type: 'boolean', description: 'Remove a key', default: false },
  },
  async run({ args }) {
    const config = await loadConfig()

    if (!args.key) {
      const entries = Object.entries(config).filter(([, v]) => v != null)
      if (entries.length === 0) {
        console.log('No config set. Use `flt config <key> <value>` to set defaults.')
        return
      }
      for (const [k, v] of entries) console.log(`${k} = ${v}`)
      return
    }

    if (!isValidKey(args.key)) {
      console.log(`Unknown key '${args.key}'. Valid: currency, fmt, seat, pax, limit`)
      return
    }

    if (args.unset) {
      delete config[args.key as keyof FltConfig]
      await saveConfig(config)
      console.log(`Unset '${args.key}'`)
      return
    }

    if (!args.value) {
      console.log(config[args.key as keyof FltConfig] ?? '(not set)')
      return
    }

    config[args.key as keyof FltConfig] = args.value
    await saveConfig(config)
    console.log(`${args.key} = ${args.value}`)
  },
})
