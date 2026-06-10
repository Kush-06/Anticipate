import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { supabase } from '@backend/supabaseClient'
import { useProfile } from '../context/ProfileContext'
import { showForumLocalNotification } from '../services/forumNotificationPush'
import type { ForumNotification } from '../../backend/forumService'

export function ForumNotificationListener() {
  const { userId } = useProfile()
  const navigate = useNavigate()

  useEffect(() => {
    if (!userId) return

    let active = true
    const channel = supabase
      .channel(`forum_os_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          if (!active) return
          void showForumLocalNotification(payload.new as ForumNotification).catch((err) => {
            console.error('Failed to show forum local notification:', err)
          })
        }
      )
      .subscribe((status, err) => {
        if (err) console.error(`Supabase Realtime OS notification subscription status: ${status}`, err)
      })

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    if (!Capacitor.isPluginAvailable('LocalNotifications')) return

    let active = true
    let cleanup: (() => void) | undefined

    void LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      if (!active) return
      const extra = action.notification.extra as { kind?: string; threadId?: string } | undefined
      if (extra?.kind === 'forum_notification' && extra.threadId) {
        navigate(`/community?thread=${extra.threadId}`)
      }
    }).then((handle) => {
      cleanup = () => {
        void handle.remove()
      }
      if (!active) cleanup()
    })

    return () => {
      active = false
      cleanup?.()
    }
  }, [navigate])

  return null
}
