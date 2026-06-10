import { describe, expect, it } from 'vitest'
import { isLessonPathCompleted, parseLessonPath } from './lessonPath'

describe('parseLessonPath', () => {
  it('extracts topic and lesson ids from a lesson route', () => {
    expect(parseLessonPath('/topic/starting-work/subtopic/lesson-02')).toEqual({
      topicId: 'starting-work',
      subTopicId: 'lesson-02',
    })
  })

  it('returns null for a route that is not a lesson', () => {
    expect(parseLessonPath('/learn')).toBeNull()
  })
})

describe('isLessonPathCompleted', () => {
  it('treats a timeline item as complete when its linked lesson quiz is complete', () => {
    expect(
      isLessonPathCompleted('/topic/starting-work/subtopic/lesson-02', ['lesson-02']),
    ).toBe(true)
  })

  it('does not complete unlinked or unmatched lesson paths', () => {
    expect(isLessonPathCompleted(undefined, ['lesson-02'])).toBe(false)
    expect(
      isLessonPathCompleted('/topic/starting-work/subtopic/lesson-03', ['lesson-02']),
    ).toBe(false)
  })
})
