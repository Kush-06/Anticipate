import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { ForumMessage, ForumThread } from '../backend/forumService'

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

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true
})

let uuidCounter = 0
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => {
      uuidCounter += 1
      return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, '0')}`
    }
  },
  writable: true
})

const db = vi.hoisted(() => ({
  threads: [] as ForumThread[],
  messages: [] as ForumMessage[],
}))

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn((table: string) => {
    const thenable = <T,>(response: T): PromiseLike<T> => ({
      then: (resolve) => Promise.resolve(resolve(response)),
    })

    if (table === 'forum_threads') {
      return {
        select: vi.fn(() => ({
          order: vi.fn(() => ({
            eq: vi.fn((column: string, value: string) => Promise.resolve({
              data: db.threads
                .filter((thread) => column === 'topic_id' && thread.topic_id === value)
                .sort((a, b) => b.created_at.localeCompare(a.created_at)),
              error: null,
            })),
            ...thenable({
              data: [...db.threads].sort((a, b) => b.created_at.localeCompare(a.created_at)),
              error: null,
            }),
          })),
        })),
        insert: vi.fn((row: ForumThread) => {
          db.threads.push(row)
          return {
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: row, error: null })),
            })),
          }
        }),
        delete: vi.fn(() => ({
          eq: vi.fn((column: string, value: string) => {
            if (column === 'id') {
              db.threads = db.threads.filter((thread) => thread.id !== value)
            }
            return Promise.resolve({ error: null })
          }),
        })),
      }
    }

    return {
      select: vi.fn((_: string, options?: { count?: 'exact'; head?: boolean }) => ({
        eq: vi.fn((column: string, value: string) => {
          const matches = db.messages.filter((message) => column === 'thread_id' && message.thread_id === value)
          if (options?.count === 'exact' && options.head) {
            return Promise.resolve({ count: matches.length, error: null })
          }
          return {
            order: vi.fn(() => Promise.resolve({ data: matches, error: null })),
          }
        }),
      })),
      insert: vi.fn((row: ForumMessage) => {
        db.messages.push(row)
        return {
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: row, error: null })),
          })),
          ...thenable({ error: null }),
        }
      }),
    }
  }),
}))

vi.mock('../backend/supabaseClient', () => ({
  supabase: supabaseMock,
}))

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
    uuidCounter = 0
    db.threads = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        topic_id: 'renting',
        title: 'Deposit question',
        created_at: '2026-06-09T10:00:00.000Z',
        author_nickname: 'Anonymous Reader 101',
        user_id: null,
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        topic_id: 'debt',
        title: 'Debt question',
        created_at: '2026-06-09T11:00:00.000Z',
        author_nickname: 'Anonymous Reader 102',
        user_id: null,
      },
    ]
    db.messages = [
      {
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        thread_id: '11111111-1111-4111-8111-111111111111',
        content: 'Can my landlord keep my deposit?',
        created_at: '2026-06-09T10:01:00.000Z',
        author_nickname: 'Anonymous Reader 101',
        user_id: null,
        is_sage_reply: false,
      },
    ]
  })

  test('Persistent anonymous nickname generation', () => {
    const name1 = getUserNickname()
    expect(name1).toMatch(/^Anonymous [A-Za-z]+ \d{3}$/)
    
    const name2 = getUserNickname()
    expect(name2).toBe(name1)
  })

  test('Fetch threads reads Supabase rows and filters by topic', async () => {
    const allThreads = await fetchThreads()
    expect(allThreads.map((thread) => thread.title)).toEqual(['Debt question', 'Deposit question'])

    const rentingThreads = await fetchThreads('renting')
    expect(rentingThreads).toHaveLength(1)
    expect(rentingThreads[0].topic_id).toBe('renting')
  })

  test('Create thread and fetch messages', async () => {
    const testTopic = 'renting'
    const testTitle = 'Moving out advice?'
    const testContent = 'What should I check before signing a tenancy contract?'
    
    const thread = await createThread(testTopic, testTitle, testContent, '00000000-0000-4000-8000-000000000999')
    expect(thread.title).toBe(testTitle)
    expect(thread.topic_id).toBe(testTopic)
    expect(thread.author_nickname).toBe(getUserNickname())

    const msgs = await fetchMessages(thread.id)
    expect(msgs).toHaveLength(1)
    expect(msgs[0].content).toBe(testContent)
    expect(msgs[0].author_nickname).toBe(getUserNickname())

    const count = await fetchReplyCount(thread.id)
    expect(count).toBe(1)
  })

  test('Post a message reply', async () => {
    const thread = await createThread('debt', 'Debt question', 'How to pay off debt?', '00000000-0000-4000-8000-000000000001')
    
    const replyContent = 'Use the avalanche method!'
    const reply = await createMessage(thread.id, replyContent, '00000000-0000-4000-8000-000000000002', false)
    expect(reply.content).toBe(replyContent)
    expect(reply.is_sage_reply).toBe(false)

    const msgs = await fetchMessages(thread.id)
    expect(msgs).toHaveLength(2)
    expect(msgs[1].content).toBe(replyContent)
  })

  test('Sage AI validation local fallbacks (keywords)', async () => {
    const offTopicRes = await validatePostWithSage('starting-work', 'Who won the football game last night?')
    expect(offTopicRes.relevance).toBe('off_topic')

    const redirectRes = await validatePostWithSage('starting-work', 'What are the rules for Lifetime ISA and buying a home?')
    expect(redirectRes.relevance).toBe('relevant')
    expect(redirectRes.bestTopicId).toBe('buying-a-home')

    const lessonRes = await validatePostWithSage('renting', 'How does the 50/30/20 rule work?')
    expect(lessonRes.relevance).toBe('relevant')
    expect(lessonRes.answeredInLesson).not.toBeNull()
    expect(lessonRes.answeredInLesson?.subTopicId).toBe('lesson-03')
  })
})
