import { describe, expect, it } from 'vitest'
import type { ForumNotification } from '../../backend/forumService'
import { buildForumLocalNotification, notificationIdForForumNotification } from './forumNotificationPush'

function forumNotification(overrides: Partial<ForumNotification> = {}): ForumNotification {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    recipient_id: '22222222-2222-4222-8222-222222222222',
    type: 'message_reply',
    thread_id: '33333333-3333-4333-8333-333333333333',
    message_id: '44444444-4444-4444-8444-444444444444',
    actor_nickname: 'Anonymous Reader 101',
    preview: 'This is helpful context.',
    created_at: '2026-06-10T12:00:00.000Z',
    read_at: null,
    ...overrides,
  }
}

describe('notificationIdForForumNotification', () => {
  it('is deterministic and within the 32-bit signed int range', () => {
    const id = notificationIdForForumNotification('11111111-1111-4111-8111-111111111111')

    expect(notificationIdForForumNotification('11111111-1111-4111-8111-111111111111')).toBe(id)
    expect(id).toBeGreaterThanOrEqual(0)
    expect(id).toBeLessThanOrEqual(2147483647)
  })

  it('produces different ids for different notifications', () => {
    expect(notificationIdForForumNotification('notification-a')).not.toBe(
      notificationIdForForumNotification('notification-b')
    )
  })
})

describe('buildForumLocalNotification', () => {
  it('builds a local notification for a message reply', () => {
    expect(buildForumLocalNotification(forumNotification())).toEqual({
      id: notificationIdForForumNotification('11111111-1111-4111-8111-111111111111'),
      title: 'New reply to your message',
      body: 'Anonymous Reader 101 replied to your message: "This is helpful context."',
      threadId: '33333333-3333-4333-8333-333333333333',
    })
  })

  it('builds a local notification without a preview', () => {
    expect(buildForumLocalNotification(forumNotification({ preview: null }))).toMatchObject({
      title: 'New reply to your message',
      body: 'Anonymous Reader 101 replied to your message',
    })
  })
})
