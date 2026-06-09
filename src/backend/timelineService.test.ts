import { describe, expect, it } from 'vitest'
import type { TimelineItem } from '../shared/types'
import { sortTimelineItems } from './timelineService'
import { duePartsFromWhenLabel, formatTimelineWhen } from '../shared/timelineDates'

function timelineItem(overrides: Partial<TimelineItem>): TimelineItem {
  return {
    id: 'id',
    userId: 'user-id',
    itemKey: 'item-key',
    status: 'pending',
    spineGroup: 'coming-up',
    title: 'Timeline item',
    tag: 'Tag',
    whenLabel: 'Soon',
    dueYear: 2026,
    dueMonth: 1,
    source: 'ai_generated',
    sortOrder: 0,
    isDismissed: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('sortTimelineItems', () => {
  it('orders timeline items by required due month/year and optional day', () => {
    const items = [
      timelineItem({ id: 'added-first', sortOrder: 1, dueYear: 2026, dueMonth: 9, dueDay: 10 }),
      timelineItem({ id: 'month-only', sortOrder: 2, dueYear: 2026, dueMonth: 7 }),
      timelineItem({ id: 'next-year', sortOrder: 0, dueYear: 2027, dueMonth: 2, dueDay: 22 }),
      timelineItem({ id: 'same-month-earlier-order', sortOrder: 0, dueYear: 2026, dueMonth: 7 }),
    ]

    expect(sortTimelineItems(items).map((item) => item.id)).toEqual([
      'same-month-earlier-order',
      'month-only',
      'added-first',
      'next-year',
    ])
  })
})

describe('timeline date labels', () => {
  it('formats exact and month-only events with years', () => {
    expect(formatTimelineWhen({ dueYear: 2026, dueMonth: 12, dueDay: 15 })).toBe('15 DEC 2026')
    expect(formatTimelineWhen({ dueYear: 2027, dueMonth: 2 })).toBe('FEB 2027')
  })

  it('keeps day/month labels forward-looking when the date has already passed this year', () => {
    expect(duePartsFromWhenLabel('5 Jun', new Date('2026-06-09T12:00:00.000Z'))).toEqual({
      dueYear: 2027,
      dueMonth: 6,
      dueDay: 5,
    })
  })
})
