import { describe, expect, it } from 'vitest'
import { type Learning, learningScore, topLearnings } from './learnings'

function mk(id: string, up: number, down: number, created = '2026-01-01T00:00:00Z'): Learning {
  return { id, text: id, up, down, created }
}

describe('learningScore', () => {
  it('is upvotes minus downvotes', () => {
    expect(learningScore(mk('a', 5, 2))).toBe(3)
    expect(learningScore(mk('b', 0, 4))).toBe(-4)
  })
})

describe('topLearnings', () => {
  it('orders by score descending', () => {
    const ranked = topLearnings([mk('low', 1, 0), mk('high', 10, 0), mk('mid', 5, 0)], 10)
    expect(ranked.map((l) => l.id)).toEqual(['high', 'mid', 'low'])
  })

  it('breaks score ties by upvotes, then recency', () => {
    const a = mk('a', 5, 3, '2026-01-01T00:00:00Z') // score 2, 5 up
    const b = mk('b', 2, 0, '2026-01-01T00:00:00Z') // score 2, 2 up
    const c = mk('c', 5, 3, '2026-02-01T00:00:00Z') // score 2, 5 up, newer
    const ranked = topLearnings([a, b, c], 10)
    expect(ranked.map((l) => l.id)).toEqual(['c', 'a', 'b'])
  })

  it('caps at the requested limit', () => {
    const list = Array.from({ length: 20 }, (_, i) => mk(`l${i}`, i, 0))
    expect(topLearnings(list, 10)).toHaveLength(10)
  })

  it('does not mutate the input', () => {
    const list = [mk('a', 1, 0), mk('b', 2, 0)]
    topLearnings(list, 10)
    expect(list.map((l) => l.id)).toEqual(['a', 'b'])
  })
})
