import { describe, it, expect } from 'vitest'
import { getRecommendedSummary, getTopicById, getSubTopicById, topics } from './topics'
import type { UserProfile } from '../context/ProfileContext'

describe('topics data utilities', () => {
  describe('getTopicById', () => {
    it('should return the correct topic for a valid ID', () => {
      if (topics.length > 0) {
        const firstTopic = topics[0]
        const topic = getTopicById(firstTopic.id)
        expect(topic).toBeDefined()
        expect(topic?.id).toBe(firstTopic.id)
        expect(topic?.title).toBe(firstTopic.title)
      }
    })

    it('should return undefined for an invalid ID', () => {
      const topic = getTopicById('non-existent-topic-123')
      expect(topic).toBeUndefined()
    })
  })

  describe('getSubTopicById', () => {
    it('should return the correct subtopic for valid topic and subtopic IDs', () => {
      if (topics.length > 0 && topics[0].subTopics.length > 0) {
        const firstTopic = topics[0]
        const firstSubTopic = firstTopic.subTopics[0]
        const subTopic = getSubTopicById(firstTopic.id, firstSubTopic.id)
        expect(subTopic).toBeDefined()
        expect(subTopic?.id).toBe(firstSubTopic.id)
        expect(subTopic?.title).toBe(firstSubTopic.title)
      }
    })

    it('should return undefined for an invalid topic ID', () => {
      if (topics.length > 0 && topics[0].subTopics.length > 0) {
        const firstSubTopic = topics[0].subTopics[0]
        const subTopic = getSubTopicById('non-existent-topic-123', firstSubTopic.id)
        expect(subTopic).toBeUndefined()
      }
    })

    it('should return undefined for an invalid subtopic ID', () => {
      if (topics.length > 0) {
        const firstTopic = topics[0]
        const subTopic = getSubTopicById(firstTopic.id, 'non-existent-subtopic-123')
        expect(subTopic).toBeUndefined()
      }
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
        topic.subTopics.forEach(subTopic => {
          expect(Array.isArray(subTopic.quiz)).toBe(true)
          expect(typeof subTopic.content).toBe('string')
        })
      })
    })
  })

  describe('getRecommendedSummary', () => {
    it('shows Career & Pay and Renting for a pay-rise renter profile without generic foundations filler', () => {
      const profile: UserProfile = {
        firstName: 'Demo',
        email: 'demo@example.com',
        companyName: 'Demo Co',
        lifeStage: "I've been working for a year or two",
        employmentType: 'Full-time',
        sixMonthGoal: 'Personal finance confidence',
        upcomingEvents: ['Getting a pay rise or changing jobs'],
        confidenceScores: {
          tax: 3,
          pensions: 3,
          budgeting: 3,
          investing: 3,
          contracts: 1,
        },
        livingSituation: 'Renting — just moved in or about to',
        studentLoan: 'No',
        hasDebt: 'No',
      }

      expect(getRecommendedSummary(profile).map((card) => card.topicId)).toEqual(['career', 'renting'])
    })
  })
})
