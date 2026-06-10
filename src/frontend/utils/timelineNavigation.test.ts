import { describe, expect, it } from 'vitest'
import type { SpineItem } from '@shared/types'
import { topics } from '../data/topics'
import { getTimelineItemDestination } from './timelineNavigation'

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

describe('getTimelineItemDestination', () => {
  it('uses a lesson path when the item has one', () => {
    expect(
      getTimelineItemDestination(
        item({ lessonPath: '/topic/starting-work/subtopic/lesson-02' }),
        topics,
      ),
    ).toBe('/topic/starting-work/subtopic/lesson-02')
  })

  it('routes topic-like lesson paths to the topic page', () => {
    expect(
      getTimelineItemDestination(item({ lessonPath: '/topic/starting-work' }), topics),
    ).toBe('/topic/starting-work')
  })

  it('infers a topic page for timeline items without a lesson path', () => {
    expect(getTimelineItemDestination(item({ title: 'Buy new house', tag: 'Housing' }), topics)).toBe('/topic/buying-a-home')
    expect(getTimelineItemDestination(item({ title: 'Start new job at hedge fund', tag: 'Career' }), topics)).toBe('/topic/career')
    expect(getTimelineItemDestination(item({ title: 'Check first payslip', tag: 'Career' }), topics)).toBe('/topic/starting-work')
  })

  it('returns null when no related app page is clear', () => {
    expect(getTimelineItemDestination(item({ title: 'Book dinner', tag: 'Personal' }), topics)).toBeNull()
  })
})
