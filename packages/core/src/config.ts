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
}

const VALID_KEYS = new Set<keyof FltConfig>(['currency', 'fmt', 'seat', 'pax', 'limit', 'marker', 'trs', 'tp_token'])

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

/** Merge config defaults with CLI args (CLI args win when explicitly provided) */
export function withDefaults<T extends Record<string, unknown>>(
  args: T,
  config: FltConfig,
  keys: Array<keyof FltConfig>,
): T {
  const merged = { ...args }
  for (const key of keys) {
    const val = config[key]
    if (val != null && (merged[key] == null || merged[key] === getArgDefault(key))) {
      ;(merged as Record<string, unknown>)[key] = val
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
