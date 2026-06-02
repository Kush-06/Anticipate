/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from "react";
import { useProfile } from "./ProfileContext";
import type { UserProfile } from "./ProfileContext";
import { getRecommendedSummary } from "../data/topics";

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

export function generateTimeline(profile: UserProfile | null): { key: SpineGroup; label: string; items: SpineItem[] }[] {
  // If no profile, fallback to the typical "first job" user timeline as a default
  if (!profile) {
    return [
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
  }

  // 1. Get the 3 customized priority lessons based on their onboarding questions
  const recSummary = getRecommendedSummary(profile);
  const card1 = recSummary[0];
  const card2 = recSummary[1];
  const card3 = recSummary[2];

  const thisWeekItems: SpineItem[] = [];
  const comingUpItems: SpineItem[] = [];
  const laterItems: SpineItem[] = [];

  // Card 1 is active today
  if (card1) {
    thisWeekItems.push({
      id: "rec-lesson-1",
      status: "active",
      when: "Today",
      title: card1.title,
      tag: `${card1.title.toLowerCase().includes("payslip") || card1.topicId === "starting-work" ? "First job" : "Foundations"} · lesson`,
      lessonPath: `/topic/${card1.topicId}/subtopic/${card1.subTopicId}`,
      group: "this-week",
    });
  }

  // Card 2 is coming up
  if (card2) {
    comingUpItems.push({
      id: "rec-lesson-2",
      status: "pending",
      when: "Before 12 Jun",
      title: card2.title,
      tag: `${card2.topicId === "starting-work" ? "First job" : card2.topicId === "investing-101" ? "Investing" : "Foundations"} · lesson`,
      lessonPath: `/topic/${card2.topicId}/subtopic/${card2.subTopicId}`,
      group: "coming-up",
    });
  }

  // Card 3 is later
  if (card3) {
    laterItems.push({
      id: "rec-lesson-3",
      status: "pending",
      when: "August",
      title: card3.title,
      tag: `${card3.topicId === "renting" ? "Renting" : card3.topicId === "buying-a-home" ? "Buying a home" : card3.topicId === "relationships" ? "Relationships" : "Personal finance"} · lesson`,
      lessonPath: `/topic/${card3.topicId}/subtopic/${card3.subTopicId}`,
      group: "later",
    });
  }

  // 2. Add personalized life events/milestones
  const evts = profile.upcomingEvents || [];
  const lifeStage = profile.lifeStage || "";
  const livingSituation = profile.livingSituation || "";
  const studentLoan = profile.studentLoan || "";

  // This Week events:
  if (lifeStage.includes("first proper job") || evts.includes("Starting a new job soon")) {
    thisWeekItems.push({
      id: "pension-enrolment",
      status: "pending",
      when: "Thu 5 Jun",
      title: "Pension auto-enrolment kicks in",
      tag: "First job",
      group: "this-week",
    });
  }
  if (evts.includes("Moving out for the very first time") || evts.includes("Moving out for the first time")) {
    thisWeekItems.push({
      id: "tenancy-signing",
      status: "pending",
      when: "In 4 days",
      title: "Tenancy agreement signing window",
      tag: "Moving out",
      group: "this-week",
    });
  }
  if (evts.includes("Moving in with a partner")) {
    thisWeekItems.push({
      id: "partner-split-chat",
      status: "pending",
      when: "This weekend",
      title: "Joint expense chat with partner",
      tag: "Relationships",
      group: "this-week",
    });
  }
  if (profile.hasDebt === "Yes" || profile.sixMonthGoal?.includes("debt")) {
    thisWeekItems.push({
      id: "debt-dd-setup",
      status: "pending",
      when: "Tomorrow",
      title: "Direct Debit setup for debt paydown",
      tag: "Debt paydown",
      group: "this-week",
    });
  }

  // Fallback if this-week is somehow empty (should not happen with Card 1)
  if (thisWeekItems.length === 1) {
    thisWeekItems.push({
      id: "weekly-budget-check",
      status: "pending",
      when: "Sun 8 Jun",
      title: "Weekly budgeting pulse check",
      tag: "Daily finances",
      group: "this-week",
    });
  }

  // Coming Up events:
  if (studentLoan.includes("actively coming off") || studentLoan.includes("Yes")) {
    comingUpItems.push({
      id: "student-loan-start",
      status: "pending",
      when: "1 Jul",
      title: "Student loan repayment starts",
      tag: "Student Loan",
      group: "coming-up",
    });
  }
  if (evts.includes("Thinking about buying a place") || livingSituation.includes("Renting (been") || livingSituation.includes("Renting — been")) {
    comingUpItems.push({
      id: "lisa-open",
      status: "pending",
      when: "Before 25 Jun",
      title: "Open a Lifetime ISA (LISA) for home deposit bonus",
      tag: "Buying a home",
      group: "coming-up",
    });
  }
  if (evts.includes("Getting a pay rise or switching roles") || evts.includes("Getting a pay rise or changing jobs")) {
    comingUpItems.push({
      id: "salary-negotiation-review",
      status: "pending",
      when: "Before review date",
      title: "Salary negotiation review",
      tag: "Career",
      group: "coming-up",
    });
  }
  if (evts.includes("Buying a car")) {
    comingUpItems.push({
      id: "car-finance-check",
      status: "pending",
      when: "Next week",
      title: "Check PCP vs. HP car loan calculator",
      tag: "Car buying",
      group: "coming-up",
    });
  }

  // Fallback event for coming up
  if (comingUpItems.length === 1) {
    comingUpItems.push({
      id: "emergency-fund-target",
      status: "pending",
      when: "Before 30 Jun",
      title: "Set emergency fund targets",
      tag: "Foundations",
      group: "coming-up",
    });
  }

  // Later events:
  if (profile.sixMonthGoal?.includes("investing") || profile.sixMonthGoal?.includes("saving") || profile.sixMonthGoal?.includes("tax")) {
    laterItems.push({
      id: "isa-deadline",
      status: "pending",
      when: "5 Apr",
      title: "ISA tax-free deadline",
      tag: "Tax calendar",
      group: "later",
    });
  }
  if (evts.includes("Having a baby (or just had one)") || evts.includes("Having a baby or just had one")) {
    laterItems.push({
      id: "child-benefit",
      status: "pending",
      when: "In 2 months",
      title: "Child Benefit claim window opens",
      tag: "Family",
      group: "later",
    });
  }
  if (lifeStage.includes("freelance") || lifeStage.includes("self-employed")) {
    laterItems.push({
      id: "self-assessment-deadline",
      status: "pending",
      when: "5 Oct",
      title: "Submit Self Assessment register form",
      tag: "Tax calendar",
      group: "later",
    });
  }

  // Fallback event for later
  if (laterItems.length === 1) {
    laterItems.push({
      id: "tax-year-end",
      status: "pending",
      when: "5 Apr",
      title: "ISA tax-free deadline",
      tag: "Tax calendar",
      group: "later",
    });
  }

  return [
    { key: "this-week", label: "This week", items: thisWeekItems },
    { key: "coming-up", label: "Coming up", items: comingUpItems },
    { key: "later", label: "Later", items: laterItems },
  ];
}

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  
  const groups = useMemo(() => {
    return generateTimeline(profile);
  }, [profile]);

  return (
    <TimelineContext.Provider value={{ groups }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline must be inside TimelineProvider");
  return ctx;
}
