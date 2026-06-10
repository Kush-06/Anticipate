import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTimeline } from "../context/TimelineContext";
import { useProgress } from "../context/ProgressContext";
import { buildTimelineReminders } from "../services/notificationScheduler";
import { useProfile } from "../context/ProfileContext";
import { supabase } from "@backend/supabaseClient";
import {
  fetchForumNotifications,
  markForumNotificationsRead,
  type ForumNotification,
  type ForumNotificationType,
} from "../../backend/forumService";
import { AppIcon, type IconName } from "./AppIcon";

const FORUM_NOTIFICATION_COPY: Record<ForumNotificationType, { icon: IconName; verb: string }> = {
  thread_reply: { icon: "reply", verb: "replied to your post" },
  message_reply: { icon: "reply", verb: "replied to your message" },
  message_like: { icon: "heart", verb: "liked your message" },
};

function formatReminderDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return target.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
}

function formatNotificationTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }).toUpperCase();
}

export function NotificationsScreen() {
  const navigate = useNavigate();
  const { groups, isLoading: timelineLoading } = useTimeline();
  const { completedSubTopicIds, isLoading: progressLoading } = useProgress();
  const { userId } = useProfile();
  const [forumNotifications, setForumNotifications] = useState<ForumNotification[]>([]);

  const isLoading = timelineLoading || progressLoading;
  const reminders = isLoading
    ? []
    : buildTimelineReminders(groups.flatMap((group) => group.items), completedSubTopicIds)
        .sort((a, b) => a.scheduleAt.getTime() - b.scheduleAt.getTime());

  useEffect(() => {
    if (!userId) return;

    let active = true;

    fetchForumNotifications(userId)
      .then((notifications) => {
        if (active) setForumNotifications(notifications);
      })
      .catch((err) => console.error("Failed to load forum notifications:", err));

    const channel = supabase
      .channel(`forum_notifications_${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          const notification = payload.new as ForumNotification;
          if (!active) return;
          setForumNotifications((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });
        }
      )
      .subscribe((status, err) => {
        if (err) console.error(`Supabase Realtime notification subscription status: ${status}`, err);
      });

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleOpenForumNotification = (notification: ForumNotification) => {
    if (!notification.read_at) {
      setForumNotifications((prev) => prev.map((n) =>
        n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
      ));
      markForumNotificationsRead([notification.id]).catch((err) =>
        console.error("Failed to mark forum notification as read:", err)
      );
    }
    navigate(`/community?thread=${notification.thread_id}`);
  };

  return (
    <div className="anp-app" style={{ background: "var(--p-bg)" }}>
      <div style={{ height: "max(calc(16px * var(--d)), env(safe-area-inset-top))", flexShrink: 0 }} />

      <div className="anp-top">
        <button className="anp-icon-btn" onClick={() => navigate(-1)} aria-label="Back">
          <AppIcon name="chevronLeft" size={19} />
        </button>
        <div className="av-logo">notifications</div>
        <div style={{ width: 36 }} />
      </div>

      {reminders.length === 0 && forumNotifications.length === 0 ? (
        <div className="anp-scroll" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <div style={{ textAlign: "center", padding: "calc(40px * var(--d))" }}>
            <AppIcon
              name="bell"
              size={48}
              style={{ color: "var(--p-ink-4)", margin: "0 auto calc(16px * var(--d))" }}
            />
            <div style={{
              fontFamily: "var(--p-display)", fontWeight: 600,
              fontSize: "calc(18px * var(--d))", color: "var(--p-ink)",
              marginBottom: "calc(8px * var(--d))",
            }}>
              No notifications
            </div>
            <div style={{ fontSize: "calc(13px * var(--d))", color: "var(--p-ink-3)" }}>
              You're all caught up
            </div>
          </div>
        </div>
      ) : (
        <div className="anp-scroll">
          <div style={{ padding: "0 calc(20px * var(--d)) calc(8px * var(--d))", display: "flex", flexDirection: "column", gap: "calc(12px * var(--d))" }}>
            {forumNotifications.map((notification) => {
              const copy = FORUM_NOTIFICATION_COPY[notification.type];
              const isUnread = !notification.read_at;
              const accent = notification.type === "message_like" ? "var(--p-gold)" : "var(--p-plum)";
              const accentTint = notification.type === "message_like" ? "var(--p-gold-tint)" : "var(--p-plum-tint)";

              return (
                <div
                  key={notification.id}
                  className="av-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => handleOpenForumNotification(notification)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleOpenForumNotification(notification); }}
                  style={{ display: "flex", flexDirection: "column", gap: "calc(8px * var(--d))", padding: "calc(14px * var(--d)) calc(16px * var(--d))", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "calc(8px * var(--d))" }}>
                    <div style={{
                      width: "calc(28px * var(--d))", height: "calc(28px * var(--d))", borderRadius: "50%",
                      background: accentTint, color: accent,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <AppIcon name={copy.icon} size={13} />
                    </div>
                    <div className="av-spine-when">Forum · {formatNotificationTime(notification.created_at)}</div>
                    {isUnread && (
                      <div style={{
                        width: "calc(8px * var(--d))", height: "calc(8px * var(--d))", borderRadius: "50%",
                        background: "var(--p-coral)", marginLeft: "auto", flexShrink: 0,
                      }} />
                    )}
                  </div>
                  <div className="av-spine-ttl">{notification.actor_nickname} {copy.verb}</div>
                  {notification.preview && (
                    <div style={{ fontSize: "calc(12px * var(--d))", color: "var(--p-ink-2)", lineHeight: 1.4 }}>
                      "{notification.preview}"
                    </div>
                  )}
                </div>
              );
            })}
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="av-card"
                style={{ display: "flex", flexDirection: "column", gap: "calc(8px * var(--d))", padding: "calc(14px * var(--d)) calc(16px * var(--d))" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "calc(8px * var(--d))" }}>
                  <div style={{
                    width: "calc(28px * var(--d))", height: "calc(28px * var(--d))", borderRadius: "50%",
                    background: "var(--p-coral-tint)", color: "var(--p-coral)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <AppIcon name="bell" size={13} />
                  </div>
                  <div className="av-spine-when">Reminder · {formatReminderDate(reminder.scheduleAt)}</div>
                </div>
                <div className="av-spine-ttl">{reminder.title}</div>
                <div style={{ fontSize: "calc(12px * var(--d))", color: "var(--p-ink-2)", lineHeight: 1.4 }}>
                  {reminder.body}
                </div>
                {reminder.lessonPath && (
                  <div>
                    <button className="av-spine-go" onClick={() => navigate(reminder.lessonPath!)}>
                      Open lesson <AppIcon name="arrowRight" size={12} stroke={2} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
