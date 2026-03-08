import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { SearchQuery } from '$lib/server/flights/search'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Offer } from './types'

const originalTmpDir = process.env.TMPDIR
const tempDirs: string[] = []

function sampleQuery(overrides: Partial<SearchQuery> = {}): SearchQuery {
  return {
    from_airport: 'MNL',
    to_airport: 'AMS',
    date: '2026-03-16',
    adults: 1,
    children: 0,
    infants_in_seat: 0,
    infants_on_lap: 0,
    seat: 'economy',
    currency: 'EUR',
    ...overrides,
  }
}

function sampleOffer(overrides: Partial<Omit<Offer, 'id'>> = {}): Omit<Offer, 'id'> {
  return {
    is_best: true,
    name: 'Sample Air',
    departure: '08:00',
    arrival: '12:30',
    arrival_time_ahead: '',
    duration: '4h 30m',
    stops: 0,
    delay: null,
    price: 'EUR120',
    departure_date: '2026-03-16',
    return_date: null,
    countries: [],
    legs: [
      {
        airline: 'SA',
        airline_name: 'Sample Air',
        flight_number: '123',
        aircraft: 'A320',
        departure_airport: 'MNL',
        arrival_airport: 'AMS',
        departure_time: '08:00',
        arrival_time: '12:30',
        duration: 270,
      },
    ],
    layovers: [],
    url: 'https://example.com/flight',
    ...overrides,
  }
}

async function loadState(tmpRoot?: string) {
  if (tmpRoot) process.env.TMPDIR = tmpRoot
  vi.resetModules()
  return import('./state')
}

async function createTempRoot(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'flt-state-test-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  process.env.TMPDIR = originalTmpDir
  vi.resetModules()
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })))
})

describe('cli cache state', () => {
  it('uses the full query shape for cache keys and refs', async () => {
    const state = await loadState()
    const outbound = state.buildCacheQuery(sampleQuery(), '2026-03-16', null)
    const roundTrip = state.buildCacheQuery(
      sampleQuery({ return_date: '2026-03-24' }),
      '2026-03-16',
      '2026-03-24',
    )
    const business = state.buildCacheQuery(sampleQuery({ seat: 'business' }), '2026-03-16', null)
    const usd = state.buildCacheQuery(sampleQuery({ currency: 'USD' }), '2026-03-16', null)

    expect(state.buildCacheKey(outbound)).not.toBe(state.buildCacheKey(roundTrip))
    expect(state.buildCacheKey(outbound)).not.toBe(state.buildCacheKey(business))
    expect(state.buildCacheKey(outbound)).not.toBe(state.buildCacheKey(usd))
    expect(state.buildSearchRef(outbound)).not.toBe(state.buildSearchRef(roundTrip))
  })

  it('keeps same-day round-trip entries distinct in the session index', async () => {
    const tmpRoot = await createTempRoot()
    const state = await loadState(tmpRoot)
    const session = state.createEmptySession()
    const query = sampleQuery()

    const first = await state.saveCachedSearch(query, '2026-03-16', '2026-03-20', [
      sampleOffer({ return_date: '2026-03-20' }),
    ])
    const second = await state.saveCachedSearch(query, '2026-03-16', '2026-03-22', [
      sampleOffer({ return_date: '2026-03-22' }),
    ])

    state.rememberSearch(session, first)
    state.rememberSearch(session, second)

    expect(first.ref).not.toBe(second.ref)
    expect(state.listAvailableRefs(session)).toEqual([`${first.ref}:O1`, `${second.ref}:O1`])
  })

  it('does not reuse stale cache entries', async () => {
    const tmpRoot = await createTempRoot()
    const state = await loadState(tmpRoot)
    const query = sampleQuery()
    const depDate = '2026-03-16'
    const entry = await state.saveCachedSearch(query, depDate, null, [sampleOffer()])
    const cachePath = join(tmpRoot, 'flt', 'cache', `${entry.cacheKey}.json`)
    const raw = JSON.parse(await readFile(cachePath, 'utf-8')) as typeof entry & { version: number }

    raw.expiresAt = Date.now() - 1000
    await writeFile(cachePath, JSON.stringify(raw, null, 2), 'utf-8')

    await expect(state.loadCachedSearch(query, depDate, null)).resolves.toBeNull()
    await expect(
      state.loadCachedSearch(query, depDate, null, { allowStale: true }),
    ).resolves.toMatchObject({
      ref: entry.ref,
    })
  })

  it('migrates legacy sessions and still resolves old refs', async () => {
    const tmpRoot = await createTempRoot()
    const sessionDir = join(tmpRoot, 'flt')
    await mkdir(sessionDir, { recursive: true })

    const legacyOffer: Offer = { ...sampleOffer(), id: 'O1' }
    await writeFile(
      join(sessionDir, 'session.json'),
      JSON.stringify({
        offers: [legacyOffer],
        query: 'MNL AMS 2026-03-16',
        timestamp: 100,
        searches: {
          'MNL-AMS@0316': {
            offers: [legacyOffer],
            query: 'MNL AMS 2026-03-16',
            timestamp: 90,
          },
        },
      }),
      'utf-8',
    )

    const state = await loadState(tmpRoot)
    const session = await state.loadSession()

    expect(session?.version).toBe(2)
    expect(session?.latest?.query).toBe('MNL AMS 2026-03-16')
    expect(session?.searches['MNL-AMS@0316']?.offerCount).toBe(1)
    if (!session) throw new Error('Expected migrated session')
    await expect(state.resolveOffer(session, 'MNL-AMS@0316:O1')).resolves.toMatchObject({
      id: 'O1',
    })
  })

  it('only resolves plain offer ids from the latest search snapshot', async () => {
    const tmpRoot = await createTempRoot()
    const state = await loadState(tmpRoot)
    const session = state.createEmptySession()
    const query = sampleQuery()
    const entry = await state.saveCachedSearch(query, '2026-03-16', null, [sampleOffer()])

    state.rememberSearch(session, entry)
    state.clearLatestSearch(session)

    await expect(state.resolveOffer(session, 'O1')).resolves.toBeNull()
    await expect(state.resolveOffer(session, `${entry.ref}:O1`)).resolves.toMatchObject({
      id: 'O1',
    })
  })
})
