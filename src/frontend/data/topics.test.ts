import { describe, it, expect } from 'vitest'
import { getTopicById, getSubTopicById, topics } from './topics'

describe('topics data utilities', () => {
  describe('getTopicById', () => {
    it('should return the correct topic for a valid ID', () => {
      const topic = getTopicById('pension')
      expect(topic).toBeDefined()
      expect(topic?.id).toBe('pension')
      expect(topic?.title).toBe('Pension & Retirement')
    })

    it('should return undefined for an invalid ID', () => {
      const topic = getTopicById('non-existent')
      expect(topic).toBeUndefined()
    })
  })

  describe('getSubTopicById', () => {
    it('should return the correct subtopic for valid topic and subtopic IDs', () => {
      const subTopic = getSubTopicById('pension', 'auto-enrolment')
      expect(subTopic).toBeDefined()
      expect(subTopic?.id).toBe('auto-enrolment')
      expect(subTopic?.title).toBe('Auto-Enrolment Basics')
    })

    it('should return undefined for an invalid topic ID', () => {
      const subTopic = getSubTopicById('non-existent', 'auto-enrolment')
      expect(subTopic).toBeUndefined()
    })

    it('should return undefined for an invalid subtopic ID', () => {
      const subTopic = getSubTopicById('pension', 'non-existent')
      expect(subTopic).toBeUndefined()
    })
  })

  describe('topics content', () => {
    it('should have at least one topic', () => {
      expect(topics.length).toBeGreaterThan(0)
    })

    it('each topic should have subtopics and a topic quiz', () => {
      topics.forEach(topic => {
        expect(topic.subTopics.length).toBeGreaterThan(0)
        expect(topic.topicQuiz.length).toBeGreaterThan(0)
      })
    })
  })
})
