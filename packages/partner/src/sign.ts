import { createHash } from 'node:crypto'

/** Recursively flatten + ksort params, then MD5(token:v1:v2:...) */
export function buildSignature(token: string, params: Record<string, unknown>): string {
  const flat = flattenForSign(params)
  const sorted = Object.keys(flat).sort()
  const parts = [token, ...sorted.map((k) => flat[k])]
  return createHash('md5').update(parts.join(':')).digest('hex')
}

function flattenForSign(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value != null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenForSign(value as Record<string, unknown>, fullKey))
    } else if (Array.isArray(value)) {
      for (const [i, item] of value.entries()) {
        if (typeof item === 'object' && item != null) {
          Object.assign(result, flattenForSign(item as Record<string, unknown>, `${fullKey}.${i}`))
        } else {
          result[`${fullKey}.${i}`] = String(item)
        }
      }
    } else {
      result[fullKey] = String(value)
    }
  }
  return result
}
