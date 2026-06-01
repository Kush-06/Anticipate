import React, { createContext, useContext } from "react";

export type SpineStatus = "active" | "pending" | "done";
export type SpineGroup = "this-week" | "coming-up" | "later";

export interface SpineItem {
  id: string;
  status: SpineStatus;
  when: string;
  title: string;
  tag: string;
  lessonPath?: string;
  group: SpineGroup;
}

interface TimelineContextType {
  groups: { key: SpineGroup; label: string; items: SpineItem[] }[];
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

// Static initial timeline — represents a typical "first job" user.
// In a fuller app these would be generated from profile events + lesson schedule.
const INITIAL_GROUPS: TimelineContextType["groups"] = [
  {
    key: "this-week",
    label: "This week",
    items: [
      {
        id: "payslip-lesson",
        status: "active",
        when: "Today",
        title: "Reading your first payslip",
        tag: "First job · lesson",
        lessonPath: "/topic/starting-work/subtopic/lesson-01",
        group: "this-week",
      },
      {
        id: "pension-enrolment",
        status: "pending",
        when: "Thu 5 Jun",
        title: "Pension auto-enrolment kicks in",
        tag: "First job",
        group: "this-week",
      },
    ],
  },
  {
    key: "coming-up",
    label: "Coming up",
    items: [
      {
        id: "pension-lesson",
        status: "pending",
        when: "Before 12 Jun",
        title: "Finish Starting Work track",
        tag: "3 lessons left",
        lessonPath: "/topic/starting-work",
        group: "coming-up",
      },
      {
        id: "student-loan",
        status: "pending",
        when: "1 Jul",
        title: "Student loan repayment starts",
        tag: "Starting work",
        group: "coming-up",
      },
    ],
  },
  {
    key: "later",
    label: "Later",
    items: [
      {
        id: "moving-out",
        status: "pending",
        when: "August",
        title: "Moving out — your tenancy agreement",
        tag: "Moving out",
        lessonPath: "/topic/renting",
        group: "later",
      },
      {
        id: "isa-deadline",
        status: "pending",
        when: "5 Apr",
        title: "ISA deadline",
        tag: "Tax calendar",
        group: "later",
      },
    ],
  },
];

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  return (
    <TimelineContext.Provider value={{ groups: INITIAL_GROUPS }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline must be inside TimelineProvider");
  return ctx;
}
