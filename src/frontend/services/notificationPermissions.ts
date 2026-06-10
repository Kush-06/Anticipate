import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

export type NotificationPermissionStatus = 'granted' | 'denied' | 'unsupported'

/**
 * Checks the current local-notification permission status without prompting.
 * Returns 'unsupported' on platforms where local notifications aren't available (web).
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (!Capacitor.isPluginAvailable('LocalNotifications')) return 'unsupported'

  const { display } = await LocalNotifications.checkPermissions()
  return display === 'granted' ? 'granted' : 'denied'
}

/**
 * Requests local-notification permission from the user.
 * Returns 'unsupported' on platforms where local notifications aren't available (web)
 * instead of prompting.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!Capacitor.isPluginAvailable('LocalNotifications')) return 'unsupported'

  const { display } = await LocalNotifications.requestPermissions()
  return display === 'granted' ? 'granted' : 'denied'
}
