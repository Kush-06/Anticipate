import { describe, it, expect } from 'vitest'
import { getTopicById, getSubTopicById, topics } from './topics'

describe('topics data utilities', () => {
  describe('getTopicById', () => {
    it('should return the correct topic for a valid ID', () => {
      const topic = getTopicById('starting-work')
      expect(topic).toBeDefined()
      expect(topic?.id).toBe('starting-work')
      expect(topic?.title).toBe('Starting Work')
    })

    it('should return undefined for an invalid ID', () => {
      const topic = getTopicById('non-existent')
      expect(topic).toBeUndefined()
    })
  })

  describe('getSubTopicById', () => {
    it('should return the correct subtopic for valid topic and subtopic IDs', () => {
      const subTopic = getSubTopicById('starting-work', 'lesson-01')
      expect(subTopic).toBeDefined()
      expect(subTopic?.id).toBe('lesson-01')
      expect(subTopic?.title).toBe('Decoding Your Payslip')
    })

    it('should return undefined for an invalid topic ID', () => {
      const subTopic = getSubTopicById('non-existent', 'lesson-01')
      expect(subTopic).toBeUndefined()
    })

    it('should return undefined for an invalid subtopic ID', () => {
      const subTopic = getSubTopicById('starting-work', 'non-existent')
      expect(subTopic).toBeUndefined()
    })
  })

  describe('topics content', () => {
    it('should have at least one topic', () => {
      expect(topics.length).toBeGreaterThan(0)
    })

    it('each topic should have subtopics and a topic quiz array', () => {
      topics.forEach(topic => {
        expect(topic.subTopics.length).toBeGreaterThan(0)
        expect(Array.isArray(topic.topicQuiz)).toBe(true)
      })
    })
  })
})
