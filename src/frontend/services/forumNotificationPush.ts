import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { ForumNotification, ForumNotificationType } from '../../backend/forumService'
import { getNotificationPermissionStatus, requestNotificationPermission } from './notificationPermissions'

const FORUM_NOTIFICATION_TITLE: Record<ForumNotificationType, string> = {
  thread_reply: 'New reply to your post',
  message_reply: 'New reply to your message',
  message_like: 'Someone liked your message',
}

const FORUM_NOTIFICATION_BODY: Record<ForumNotificationType, string> = {
  thread_reply: 'replied to your post',
  message_reply: 'replied to your message',
  message_like: 'liked your message',
}

export interface ForumLocalNotification {
  id: number
  title: string
  body: string
  threadId: string
}

export function notificationIdForForumNotification(notificationId: string): number {
  let hash = 0
  const key = `forum:${notificationId}`
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  return Math.abs(hash % 2147483647)
}

export function buildForumLocalNotification(notification: ForumNotification): ForumLocalNotification {
  return {
    id: notificationIdForForumNotification(notification.id),
    title: FORUM_NOTIFICATION_TITLE[notification.type],
    body: notification.preview
      ? `${notification.actor_nickname} ${FORUM_NOTIFICATION_BODY[notification.type]}: "${notification.preview}"`
      : `${notification.actor_nickname} ${FORUM_NOTIFICATION_BODY[notification.type]}`,
    threadId: notification.thread_id,
  }
}

export async function showForumLocalNotification(notification: ForumNotification): Promise<void> {
  if (!Capacitor.isPluginAvailable('LocalNotifications')) return

  let permission = await getNotificationPermissionStatus()
  if (permission === 'unsupported') return
  if (permission === 'denied') {
    permission = await requestNotificationPermission()
  }
  if (permission !== 'granted') return

  const localNotification = buildForumLocalNotification(notification)
  await LocalNotifications.schedule({
    notifications: [{
      id: localNotification.id,
      title: localNotification.title,
      body: localNotification.body,
      extra: {
        kind: 'forum_notification',
        threadId: localNotification.threadId,
      },
    }],
  })
}
