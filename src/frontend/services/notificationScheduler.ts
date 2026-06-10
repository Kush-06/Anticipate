import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { getNextReminderDate } from '@shared/notificationSchedule'
import type { SpineItem } from '@shared/types'
import { getSubTopicById } from '../data/topics'
import { getNotificationPermissionStatus, requestNotificationPermission } from './notificationPermissions'

export interface TimelineReminder {
  id: number
  title: string
  body: string
  scheduleAt: Date
}

interface LessonRef {
  topicId: string
  subTopicId: string
}

export function parseLessonPath(lessonPath: string): LessonRef | null {
  const match = lessonPath.match(/^\/topic\/([^/]+)\/subtopic\/([^/]+)/)
  if (!match) return null
  return { topicId: match[1], subTopicId: match[2] }
}

// Local notification ids must be 32-bit ints, so derive a stable one from the item's UUID.
export function notificationIdForItem(itemId: string): number {
  let hash = 0
  for (let i = 0; i < itemId.length; i++) {
    hash = (hash * 31 + itemId.charCodeAt(i)) | 0
  }
  return Math.abs(hash % 2147483647)
}

/**
 * Builds the set of "next reminder" notifications for timeline items that still
 * need attention: they link to a lesson, aren't done/dismissed, the lesson hasn't
 * been completed yet, and their reminder window hasn't passed.
 */
export function buildTimelineReminders(
  items: SpineItem[],
  completedSubTopicIds: string[],
  today = new Date()
): TimelineReminder[] {
  const reminders: TimelineReminder[] = []

  for (const item of items) {
    if (!item.lessonPath || item.status === 'done') continue
    if (item.dueYear === undefined || item.dueMonth === undefined) continue

    const lessonRef = parseLessonPath(item.lessonPath)
    if (lessonRef && completedSubTopicIds.includes(lessonRef.subTopicId)) continue

    const nextReminder = getNextReminderDate(
      { dueYear: item.dueYear, dueMonth: item.dueMonth, dueDay: item.dueDay },
      today
    )
    if (!nextReminder) continue

    const lessonTitle = lessonRef ? getSubTopicById(lessonRef.topicId, lessonRef.subTopicId)?.title : undefined

    reminders.push({
      id: notificationIdForItem(item.id),
      title: item.title,
      body: lessonTitle
        ? `Due ${item.when} — finish "${lessonTitle}" before then`
        : `Coming up ${item.when} — don't forget to prepare`,
      scheduleAt: nextReminder,
    })
  }

  return reminders
}

/**
 * Recomputes and (re)schedules local notification reminders for the given timeline
 * items. Cancels any previously scheduled reminders first so the schedule always
 * reflects the current timeline/progress state. No-ops on web or if permission
 * isn't granted.
 */
export async function scheduleTimelineReminders(
  items: SpineItem[],
  completedSubTopicIds: string[]
): Promise<void> {
  if (!Capacitor.isPluginAvailable('LocalNotifications')) return

  const reminders = buildTimelineReminders(items, completedSubTopicIds)

  let permission = await getNotificationPermissionStatus()
  if (permission === 'unsupported') return
  if (permission === 'denied' && reminders.length > 0) {
    permission = await requestNotificationPermission()
  }

  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length > 0) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) })
  }

  if (permission !== 'granted' || reminders.length === 0) return

  await LocalNotifications.schedule({
    notifications: reminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      schedule: { at: reminder.scheduleAt, allowWhileIdle: true },
    })),
  })
}
