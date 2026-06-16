import { describe, expect, it } from 'vitest'
import { generateTimeline } from './timelineGenerator'

describe('generateTimeline', () => {
  it('does not add hardcoded fallback timeline items for an unknown profile', () => {
    const groups = generateTimeline(null)
    const items = groups.flatMap((group) => group.items)

    expect(groups.map((group) => group.key)).toEqual(['this-week', 'coming-up', 'later'])
    expect(items).toEqual([])
  })
})
