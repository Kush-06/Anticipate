import { useEffect } from "react";
import { useTimeline } from "../context/TimelineContext";
import { useProgress } from "../context/ProgressContext";
import { scheduleTimelineReminders } from "../services/notificationScheduler";

// Renders nothing — keeps scheduled local-notification reminders for upcoming
// timeline items (and their linked lessons) in sync with timeline/progress state.
export function NotificationScheduler() {
  const { groups, isLoading: timelineLoading } = useTimeline();
  const { completedSubTopicIds, isLoading: progressLoading } = useProgress();

  useEffect(() => {
    if (timelineLoading || progressLoading) return;
    const items = groups.flatMap((group) => group.items);
    void scheduleTimelineReminders(items, completedSubTopicIds);
  }, [groups, completedSubTopicIds, timelineLoading, progressLoading]);

  return null;
}
