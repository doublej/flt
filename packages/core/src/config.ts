import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const CONFIG_DIR = join(homedir(), '.config', 'flt')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

export interface FltConfig {
  currency?: string
  fmt?: string
  seat?: string
  pax?: string
  limit?: string
  marker?: string
  trs?: string
  tp_token?: string
  exclude_hub?: string
  exclude_region?: string
}

const VALID_KEYS = new Set<keyof FltConfig>([
  'currency', 'fmt', 'seat', 'pax', 'limit', 'marker', 'trs', 'tp_token',
  'exclude_hub', 'exclude_region',
])

export async function loadConfig(): Promise<FltConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, 'utf-8')
    return JSON.parse(raw) as FltConfig
  } catch {
    return {}
  }
}

export async function saveConfig(config: FltConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })
  await writeFile(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`)
}

export function isValidKey(key: string): key is keyof FltConfig {
  return VALID_KEYS.has(key as keyof FltConfig)
}

/** Config key → CLI arg key mapping (underscores → hyphens where they differ) */
const CONFIG_TO_ARG: Partial<Record<keyof FltConfig, string>> = {
  exclude_hub: 'exclude-hub',
  exclude_region: 'exclude-region',
}

/** Merge config defaults with CLI args (CLI args win when explicitly provided) */
export function withDefaults<T extends Record<string, unknown>>(
  args: T,
  config: FltConfig,
  keys: Array<keyof FltConfig>,
): T {
  const merged = { ...args }
  for (const key of keys) {
    const val = config[key]
    const argKey = CONFIG_TO_ARG[key] ?? key
    if (val != null && (merged[argKey] == null || merged[argKey] === getArgDefault(key))) {
      ;(merged as Record<string, unknown>)[argKey] = val
    }
  }
  return merged
}

/** Default values from citty arg definitions — used to detect if user overrode them */
function getArgDefault(key: keyof FltConfig): unknown {
  const defaults: Record<string, unknown> = {
    currency: 'EUR',
    fmt: 'table',
    seat: 'economy',
    pax: '1ad',
    limit: '100',
  }
  return defaults[key]
}
