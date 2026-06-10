import { useState } from "react";
import { useNavigate } from "react-router";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getNextReminderDate } from "@shared/notificationSchedule";
import type { SpineItem } from "@shared/types";
import { useTimeline } from "../context/TimelineContext";
import { useProgress } from "../context/ProgressContext";
import { buildTimelineReminders, parseLessonPath, type TimelineReminder } from "../services/notificationScheduler";
import { requestNotificationPermission } from "../services/notificationPermissions";
import { AppIcon } from "./AppIcon";

// TEMP DEBUG — remove after testing on device
const DEBUG_NOTIFICATION_ID = 999999;

// TEMP DEBUG — remove after testing on device
// Explains why each timeline item was/wasn't turned into a reminder.
function describeItemEligibility(item: SpineItem, completedSubTopicIds: string[]): string {
  const due = item.dueYear && item.dueMonth
    ? `${item.dueYear}-${String(item.dueMonth).padStart(2, "0")}${item.dueDay ? `-${String(item.dueDay).padStart(2, "0")}` : ""}`
    : "no due date";

  if (!item.lessonPath) return `${item.title} — excluded: no lessonPath (due ${due})`;
  if (item.status === "done") return `${item.title} — excluded: status is done (due ${due})`;

  const lessonRef = parseLessonPath(item.lessonPath);
  if (lessonRef && completedSubTopicIds.includes(lessonRef.subTopicId)) {
    return `${item.title} — excluded: lesson "${lessonRef.subTopicId}" already completed (due ${due})`;
  }

  if (item.dueYear === undefined || item.dueMonth === undefined) {
    return `${item.title} — excluded: missing due year/month`;
  }

  const next = getNextReminderDate({ dueYear: item.dueYear, dueMonth: item.dueMonth, dueDay: item.dueDay });
  if (!next) return `${item.title} — excluded: due date already passed (due ${due})`;

  return `${item.title} — included: next reminder ${next.toLocaleDateString()} (due ${due})`;
}

// TEMP DEBUG — remove after testing on device
function DebugNotificationTools({
  items,
  completedSubTopicIds,
  reminders,
}: {
  items: SpineItem[];
  completedSubTopicIds: string[];
  reminders: TimelineReminder[];
}) {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState<{ id: number; title: string; body: string; at: string }[] | null>(null);
  const [eligibility, setEligibility] = useState<string[] | null>(null);

  async function handleSendTest() {
    setStatus("Requesting permission…");
    const permission = await requestNotificationPermission();
    if (permission !== "granted") {
      setStatus(`Permission status: ${permission}. Enable notifications in system settings and try again.`);
      return;
    }
    const sample = reminders[0];
    await LocalNotifications.schedule({
      notifications: [{
        id: DEBUG_NOTIFICATION_ID,
        title: sample ? sample.title : "Test notification",
        body: sample ? sample.body : "If you see this, local notifications are working!",
        schedule: { at: new Date(Date.now() + 10000), allowWhileIdle: true },
      }],
    });
    setStatus(sample
      ? `Scheduled a preview of "${sample.title}" for ~10s from now — background or lock the app to see it.`
      : "Scheduled a generic test notification for ~10s from now — background or lock the app to see it.");
  }

  async function handleShowPending() {
    const result = await LocalNotifications.getPending();
    setPending(result.notifications.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      at: n.schedule?.at ? new Date(n.schedule.at).toLocaleString() : "unknown",
    })));
  }

  function handleShowAllItems() {
    setEligibility(items.map((item) => describeItemEligibility(item, completedSubTopicIds)));
  }

  return (
    <div style={{ padding: "calc(12px * var(--d)) calc(20px * var(--d)) 0" }}>
      <div
        className="av-card"
        style={{
          display: "flex", flexDirection: "column", gap: "calc(8px * var(--d))",
          padding: "calc(14px * var(--d)) calc(16px * var(--d))",
          border: "1.5px dashed var(--p-coral)",
        }}
      >
        <div className="av-spine-when">Debug — remove after testing</div>
        <div style={{ display: "flex", gap: "calc(8px * var(--d))", flexWrap: "wrap" }}>
          <button className="av-spine-go" onClick={() => void handleSendTest()}>
            Send test notification (10s)
          </button>
          <button className="av-spine-go" onClick={() => void handleShowPending()}>
            Show pending reminders
          </button>
          <button className="av-spine-go" onClick={handleShowAllItems}>
            Show all timeline items
          </button>
        </div>
        {status && (
          <div style={{ fontSize: "calc(12px * var(--d))", color: "var(--p-ink-2)" }}>{status}</div>
        )}
        {pending && (
          <div style={{ fontSize: "calc(11px * var(--d))", color: "var(--p-ink-2)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 600 }}>Pending ({pending.length}):</div>
            {pending.length === 0
              ? <div>No pending reminders scheduled.</div>
              : pending.map((p) => <div key={p.id}>{p.title} — {p.at} — {p.body}</div>)}
          </div>
        )}
        {eligibility && (
          <div style={{ fontSize: "calc(11px * var(--d))", color: "var(--p-ink-2)", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 600 }}>All items ({eligibility.length}):</div>
            {eligibility.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const items = groups.flatMap((group) => group.items);
  const reminders = isLoading
    ? []
    : buildTimelineReminders(items, completedSubTopicIds)
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

      {/* TEMP DEBUG — remove after testing on device */}
      <DebugNotificationTools items={items} completedSubTopicIds={completedSubTopicIds} reminders={reminders} />

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
