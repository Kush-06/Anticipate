import { describe, expect, it } from 'vitest'
import type { SpineItem } from '@shared/types'
import { buildTimelineReminders, notificationIdForItem, parseLessonPath } from './notificationScheduler'

function spineItem(overrides: Partial<SpineItem>): SpineItem {
  return {
    id: 'item-id',
    status: 'active',
    when: 'SOON',
    title: 'Timeline item',
    tag: 'Tag',
    group: 'coming-up',
    ...overrides,
  }
}

describe('parseLessonPath', () => {
  it('extracts the topic and subtopic ids', () => {
    expect(parseLessonPath('/topic/starting-work/subtopic/lesson-02')).toEqual({
      topicId: 'starting-work',
      subTopicId: 'lesson-02',
    })
  })

  it('returns null for an unrecognized path', () => {
    expect(parseLessonPath('/learn')).toBeNull()
  })
})

describe('notificationIdForItem', () => {
  it('is deterministic and within the 32-bit signed int range', () => {
    const id = notificationIdForItem('11111111-1111-1111-1111-111111111111')
    expect(notificationIdForItem('11111111-1111-1111-1111-111111111111')).toBe(id)
    expect(id).toBeGreaterThanOrEqual(0)
    expect(id).toBeLessThanOrEqual(2147483647)
  })

  it('produces different ids for different items', () => {
    expect(notificationIdForItem('item-a')).not.toBe(notificationIdForItem('item-b'))
  })
})

describe('buildTimelineReminders', () => {
  const today = new Date(2026, 11, 12) // 12 Dec 2026

  it('includes an active item with an incomplete lesson and an open reminder window', () => {
    const items = [
      spineItem({
        id: 'pension',
        title: 'Pension auto-enrolment kicks in',
        lessonPath: '/topic/starting-work/subtopic/lesson-02',
        dueYear: 2026,
        dueMonth: 12,
        dueDay: 15,
        when: '15 DEC 2026',
      }),
    ]

    const reminders = buildTimelineReminders(items, [], today)

    expect(reminders).toHaveLength(1)
    expect(reminders[0]).toMatchObject({
      id: notificationIdForItem('pension'),
      title: 'Pension auto-enrolment kicks in',
      scheduleAt: new Date(2026, 11, 12),
    })
    expect(reminders[0].body).toContain('The Auto-Enrolment Pension')
  })

  it('skips items without a lessonPath', () => {
    const items = [spineItem({ dueYear: 2026, dueMonth: 12, dueDay: 15 })]
    expect(buildTimelineReminders(items, [], today)).toHaveLength(0)
  })

  it('skips items already marked done', () => {
    const items = [
      spineItem({
        status: 'done',
        lessonPath: '/topic/starting-work/subtopic/lesson-02',
        dueYear: 2026,
        dueMonth: 12,
        dueDay: 15,
      }),
    ]
    expect(buildTimelineReminders(items, [], today)).toHaveLength(0)
  })

  it('skips items whose linked lesson is already completed', () => {
    const items = [
      spineItem({
        lessonPath: '/topic/starting-work/subtopic/lesson-02',
        dueYear: 2026,
        dueMonth: 12,
        dueDay: 15,
      }),
    ]
    expect(buildTimelineReminders(items, ['lesson-02'], today)).toHaveLength(0)
  })

  it('skips items whose reminder window has passed', () => {
    const items = [
      spineItem({
        lessonPath: '/topic/starting-work/subtopic/lesson-02',
        dueYear: 2026,
        dueMonth: 12,
        dueDay: 1,
      }),
    ]
    expect(buildTimelineReminders(items, [], today)).toHaveLength(0)
  })

  it('skips items missing a due year/month', () => {
    const items = [spineItem({ lessonPath: '/topic/starting-work/subtopic/lesson-02' })]
    expect(buildTimelineReminders(items, [], today)).toHaveLength(0)
  })
})
