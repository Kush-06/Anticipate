import { describe, expect, it } from 'vitest'
import type { SpineItem } from '@shared/types'
import { getFallbackAccessibleTimelineItemId, isTimelineItemAccessible } from './timelineAccessibility'

function item(overrides: Partial<SpineItem>): SpineItem {
  return {
    id: 'item-id',
    status: 'pending',
    when: 'JUN 2026',
    title: 'Timeline item',
    tag: 'Tag',
    group: 'coming-up',
    ...overrides,
  }
}

describe('timeline accessibility', () => {
  it('uses the first non-done item as the fallback accessible item', () => {
    const items = [
      item({ id: 'done', status: 'done' }),
      item({ id: 'first-pending', status: 'pending' }),
      item({ id: 'second-pending', status: 'pending' }),
    ]

    expect(getFallbackAccessibleTimelineItemId(items)).toBe('first-pending')
  })

  it('keeps explicitly active items accessible even when they are not first', () => {
    const fallbackId = 'first-pending'

    expect(isTimelineItemAccessible(item({ id: 'first-pending', status: 'pending' }), fallbackId)).toBe(true)
    expect(isTimelineItemAccessible(item({ id: 'later-active', status: 'active' }), fallbackId)).toBe(true)
    expect(isTimelineItemAccessible(item({ id: 'later-pending', status: 'pending' }), fallbackId)).toBe(false)
  })
})
