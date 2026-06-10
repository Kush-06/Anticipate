import { useNavigate } from "react-router";
import { useTimeline } from "../context/TimelineContext";
import { useProgress } from "../context/ProgressContext";
import { buildTimelineReminders } from "../services/notificationScheduler";
import { AppIcon } from "./AppIcon";

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

export function NotificationsScreen() {
  const navigate = useNavigate();
  const { groups, isLoading: timelineLoading } = useTimeline();
  const { completedSubTopicIds, isLoading: progressLoading } = useProgress();

  const isLoading = timelineLoading || progressLoading;
  const reminders = isLoading
    ? []
    : buildTimelineReminders(groups.flatMap((group) => group.items), completedSubTopicIds)
        .sort((a, b) => a.scheduleAt.getTime() - b.scheduleAt.getTime());

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

      {reminders.length === 0 ? (
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
