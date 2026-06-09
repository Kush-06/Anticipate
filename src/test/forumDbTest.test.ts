import { expect, test, describe, beforeEach } from 'vitest'

// Mock LocalStorage in node if JSDOM mock is incomplete
const localStore: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => localStore[key] || null,
  setItem: (key: string, value: string) => { localStore[key] = value },
  removeItem: (key: string) => { delete localStore[key] },
  clear: () => {
    for (const key of Object.keys(localStore)) {
      delete localStore[key]
    }
  }
}

if (typeof window === 'undefined') {
  global.window = {} as unknown as Window & typeof globalThis
}

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

// Mock crypto.randomUUID
if (typeof crypto === 'undefined' || !crypto.randomUUID) {
  global.crypto = {
    randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substring(2, 9)
  } as unknown as Crypto
}

import {
  getUserNickname,
  fetchThreads,
  createThread,
  fetchMessages,
  createMessage,
  fetchReplyCount,
  validatePostWithSage
} from '../backend/forumService'

describe('Forum Service Tests', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('Persistent anonymous nickname generation', () => {
    const name1 = getUserNickname()
    expect(name1).toMatch(/^Anonymous [A-Za-z]+ \d{3}$/)
    
    // Call again and verify it is persistent on the device
    const name2 = getUserNickname()
    expect(name2).toBe(name1)
  })

  test('Fetch threads falls back to mock threads when table does not exist', async () => {
    const threads = await fetchThreads()
    expect(threads.length).toBeGreaterThan(0)
    expect(threads[0].topic_id).toBeDefined()
    expect(threads[0].title).toBeDefined()
  })

  test('Create thread and fetch messages', async () => {
    const testTopic = 'renting'
    const testTitle = 'Moving out advice?'
    const testContent = 'What should I check before signing a tenancy contract?'
    
    const thread = await createThread(testTopic, testTitle, testContent, 'test-user-id')
    expect(thread.title).toBe(testTitle)
    expect(thread.topic_id).toBe(testTopic)
    expect(thread.author_nickname).toBe(getUserNickname())

    // Fetch messages for this thread
    const msgs = await fetchMessages(thread.id)
    expect(msgs.length).toBe(1)
    expect(msgs[0].content).toBe(testContent)
    expect(msgs[0].author_nickname).toBe(getUserNickname())

    // Verify reply count
    const count = await fetchReplyCount(thread.id)
    expect(count).toBe(1)
  })

  test('Post a message reply', async () => {
    const thread = await createThread('debt', 'Debt question', 'How to pay off debt?', 'user-1')
    
    const replyContent = 'Use the avalanche method!'
    const reply = await createMessage(thread.id, replyContent, 'user-2', false)
    expect(reply.content).toBe(replyContent)
    expect(reply.is_sage_reply).toBe(false)

    const msgs = await fetchMessages(thread.id)
    expect(msgs.length).toBe(2)
    expect(msgs[1].content).toBe(replyContent)
  })

  test('Sage AI validation local fallbacks (keywords)', async () => {
    // 1. Off-topic test
    const offTopicRes = await validatePostWithSage('starting-work', 'Who won the football game last night?')
    expect(offTopicRes.relevance).toBe('off_topic')

    // 2. Wrong topic redirect test
    const redirectRes = await validatePostWithSage('starting-work', 'What are the rules for Lifetime ISA and buying a home?')
    expect(redirectRes.relevance).toBe('relevant')
    expect(redirectRes.bestTopicId).toBe('buying-a-home')

    // 3. Lesson redirect test (e.g. 50/30/20 rule)
    const lessonRes = await validatePostWithSage('renting', 'How does the 50/30/20 rule work?')
    expect(lessonRes.relevance).toBe('relevant')
    expect(lessonRes.answeredInLesson).not.toBeNull()
    expect(lessonRes.answeredInLesson?.subTopicId).toBe('lesson-03')
  })
})
