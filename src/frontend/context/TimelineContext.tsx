import React, { createContext, useContext, useState } from "react";

export interface TimelineStep {
  title: string;
  status: "completed" | "active" | "pending";
  dateLabel: string;
  lessonPath?: string;
}

export interface TimelineTrack {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: "purple" | "green" | "amber" | "navy" | "coral";
  currentStep: number;
  totalSteps: number;
  startDate: string;
  steps: TimelineStep[];
  alwaysExpanded?: boolean;
}

export interface TimelineNotification {
  id: string;
  sender: string;
  time: string;
  icon: string;
  color: "purple" | "green" | "amber" | "navy" | "coral";
  message: string;
  buttons?: {
    label: string;
    style: "filled" | "outlined";
    action: "do-now" | "remind";
  }[];
  read?: boolean;
}

interface TimelineContextType {
  tracks: TimelineTrack[];
  notifications: TimelineNotification[];
  addTrack: (track: TimelineTrack) => void;
  advanceActiveStep: (trackId: string, customFeedback?: string) => void;
  sageMessage: string;
  setSageMessage: (msg: string) => void;
  markNotificationsAsRead: () => void;
  unreadCount: number;
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider");
  }
  return context;
}

export const TimelineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: "first-job",
      title: "First job. Deloitte.",
      subtitle: "Step 4 of 6",
      icon: "💼",
      color: "purple",
      currentStep: 4,
      totalSteps: 6,
      startDate: "2 June",
      steps: [
        {
          title: "Understand your offer letter",
          status: "completed",
          dateLabel: "Completed 14 May"
        },
        {
          title: "Decode your contract",
          status: "completed",
          dateLabel: "Completed 18 May",
          lessonPath: "/decoder/view/employment-contract"
        },
        {
          title: "What to do before day one",
          status: "completed",
          dateLabel: "Completed 22 May"
        },
        {
          title: "Reading your first payslip",
          status: "active",
          dateLabel: "Scheduled 5 June",
          lessonPath: "/decoder/view/first-payslip"
        },
        {
          title: "Pension auto enrolment",
          status: "pending",
          dateLabel: "Unlocks after step 4",
          lessonPath: "/topic/pension/subtopic/auto-enrolment"
        },
        {
          title: "Your first tax code explained",
          status: "pending",
          dateLabel: "Unlocks after step 5",
          lessonPath: "/topic/taxes/subtopic/tax-codes"
        }
      ]
    },
    {
      id: "moving-out",
      title: "Moving out. August.",
      subtitle: "Step 1 of 5",
      icon: "🏠",
      color: "green",
      currentStep: 1,
      totalSteps: 5,
      startDate: "1 August",
      steps: [
        {
          title: "Understanding your tenancy agreement",
          status: "active",
          dateLabel: "Not started",
          lessonPath: "/decoder/view/tenancy-agreement"
        },
        {
          title: "What bills you are responsible for",
          status: "pending",
          dateLabel: "Not started"
        },
        {
          title: "Splitting costs with housemates",
          status: "pending",
          dateLabel: "Not started"
        },
        {
          title: "Your deposit and how to protect it",
          status: "pending",
          dateLabel: "Not started"
        },
        {
          title: "What happens when you move out",
          status: "pending",
          dateLabel: "Not started"
        }
      ]
    },
    {
      id: "tax-calendar",
      title: "Tax Calendar",
      subtitle: "Next: ISA deadline. 5 April.",
      icon: "📅",
      color: "amber",
      currentStep: 1,
      totalSteps: 1,
      startDate: "5 April",
      steps: [],
      alwaysExpanded: true
    }
  ]);

  const [notifications, setNotifications] = useState<TimelineNotification[]>([
    {
      id: "notif-1",
      sender: "Sage",
      time: "Now",
      icon: "✨",
      color: "purple",
      message: "Your first payslip from Deloitte lands in 3 days. Most people open it and have no idea what half of it means. Let me walk you through it now so you are not caught off guard. Takes 4 minutes.",
      buttons: [
        {
          label: "Do it now",
          style: "filled",
          action: "do-now"
        },
        {
          label: "Remind me tomorrow",
          style: "outlined",
          action: "remind"
        }
      ],
      read: false
    },
    {
      id: "notif-2",
      sender: "Sage",
      time: "2 days ago",
      icon: "🏠",
      color: "green",
      message: "Your moving out track starts in 6 weeks. I would suggest getting ahead on tenancy agreements. There is one clause most people miss.",
      read: false
    },
    {
      id: "notif-3",
      sender: "Tax calendar",
      time: "5 days ago",
      icon: "📅",
      color: "amber",
      message: "ISA deadline is April 5. You have got time but not loads of it.",
      read: false
    }
  ]);

  const [sageMessage, setSageMessage] = useState(
    "Your first payslip lands in 6 days. I have lined up the payslip lesson for Thursday. It takes 4 minutes."
  );

  const addTrack = (newTrack: TimelineTrack) => {
    setTracks((prev) => {
      // Put it before the Tax Calendar
      const listWithoutTax = prev.filter((t) => t.id !== "tax-calendar");
      const taxTrack = prev.find((t) => t.id === "tax-calendar")!;
      return [...listWithoutTax, newTrack, taxTrack];
    });
  };

  const advanceActiveStep = (trackId: string, customFeedback?: string) => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id !== trackId) return track;

        // Current active step index
        const activeIdx = track.steps.findIndex((s) => s.status === "active");
        if (activeIdx === -1) return track;

        const updatedSteps = track.steps.map((step, idx) => {
          if (idx === activeIdx) {
            return {
              ...step,
              status: "completed" as const,
              dateLabel: "Completed today"
            };
          }
          if (idx === activeIdx + 1) {
            return {
              ...step,
              status: "active" as const,
              dateLabel: "Scheduled today"
            };
          }
          return step;
        });

        const nextStepNum = activeIdx + 2;
        return {
          ...track,
          currentStep: Math.min(nextStepNum, track.totalSteps),
          subtitle: `Step ${Math.min(nextStepNum, track.totalSteps)} of ${track.totalSteps}`,
          steps: updatedSteps
        };
      })
    );

    if (customFeedback) {
      setSageMessage(customFeedback);
    } else {
      setSageMessage("Great job checking in! Your timeline has been updated with your next milestone.");
    }
  };

  const markNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <TimelineContext.Provider
      value={{
        tracks,
        notifications,
        addTrack,
        advanceActiveStep,
        sageMessage,
        setSageMessage,
        markNotificationsAsRead,
        unreadCount
      }}
    >
      {children}
    </TimelineContext.Provider>
  );
};
