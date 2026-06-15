import type { UserProfile } from "../context/ProfileContext";
import { getRecommendedSummary } from "../data/topics";
import type { SpineItem, SpineGroup } from "../../shared/types";

// Maps each "upcoming events" onboarding option (step 4) to a set of milestone items.
// Items are seeded into the DB on onboarding completion and displayed on the home timeline.
const UPCOMING_EVENT_ITEMS: Record<string, SpineItem[]> = {
  "Starting my first job soon": [
    {
      id: "first-job-pension",
      status: "pending",
      when: "In 3 months",
      title: "Pension auto-enrolment kicks in",
      tag: "First job · pension",
      lessonPath: "/topic/starting-work/subtopic/lesson-02",
      group: "this-week",
    },
    {
      id: "first-job-budget",
      status: "pending",
      when: "Before first payday",
      title: "Set up your 50/30/20 budget",
      tag: "First job · budgeting",
      lessonPath: "/topic/starting-work/subtopic/lesson-03",
      group: "coming-up",
    },
    {
      id: "first-job-isa",
      status: "pending",
      when: "5 Apr",
      title: "Use your ISA allowance before tax year ends",
      tag: "Tax calendar",
      group: "later",
    },
  ],
  "Starting a new job (not my first) soon": [
    {
      id: "new-job-consolidate-pension",
      status: "pending",
      when: "In 2 weeks",
      title: "Consolidate old pension pots",
      tag: "Career · pension",
      lessonPath: "/topic/career/subtopic/lesson-20",
      group: "this-week",
    },
    {
      id: "new-job-negotiate-salary",
      status: "pending",
      when: "Before start date",
      title: "Prepare for salary negotiation",
      tag: "Career · negotiation",
      lessonPath: "/topic/career/subtopic/lesson-18",
      group: "this-week",
    },
    {
      id: "new-job-lifestyle-creep",
      status: "pending",
      when: "After your raise",
      title: "Review monthly spend — avoid lifestyle creep",
      tag: "Career · budgeting",
      lessonPath: "/topic/career/subtopic/lesson-19",
      group: "coming-up",
    },
  ],
  "Moving out for the very first time": [
    {
      id: "move-deposit",
      status: "pending",
      when: "Before move-in",
      title: "Check tenancy deposit is in a protected scheme",
      tag: "Moving out · deposit",
      lessonPath: "/topic/renting/subtopic/lesson-05",
      group: "this-week",
    },
    {
      id: "move-insurance",
      status: "pending",
      when: "In 2 weeks",
      title: "Arrange renters' insurance",
      tag: "Moving out · insurance",
      lessonPath: "/topic/renting/subtopic/lesson-07",
      group: "coming-up",
    },
    {
      id: "move-bills",
      status: "pending",
      when: "Before you move in",
      title: "Build your first bills budget",
      tag: "Moving out · bills",
      lessonPath: "/topic/renting/subtopic/lesson-06",
      group: "coming-up",
    },
    {
      id: "move-lisa",
      status: "pending",
      when: "Before 5 Apr",
      title: "Open a LISA — 25% bonus on savings up to £4,000/yr",
      tag: "Home buying",
      lessonPath: "/topic/buying-a-home/subtopic/lesson-09",
      group: "later",
    },
  ],
  "Thinking about buying a place": [
    {
      id: "buy-mortgage-mip",
      status: "pending",
      when: "This week",
      title: "Get a mortgage in principle (MIP)",
      tag: "Home buying · mortgage",
      lessonPath: "/topic/buying-a-home/subtopic/lesson-08",
      group: "this-week",
    },
    {
      id: "buy-lisa",
      status: "pending",
      when: "Before 30 Jun",
      title: "Open a Lifetime ISA (LISA)",
      tag: "Home buying · LISA",
      lessonPath: "/topic/buying-a-home/subtopic/lesson-09",
      group: "coming-up",
    },
    {
      id: "buy-hidden-costs",
      status: "pending",
      when: "Before you offer",
      title: "Budget for stamp duty and solicitor fees",
      tag: "Home buying · costs",
      lessonPath: "/topic/buying-a-home/subtopic/lesson-10",
      group: "coming-up",
    },
    {
      id: "buy-approval-bootcamp",
      status: "pending",
      when: "In 3 months",
      title: "Mortgage Approval Bootcamp",
      tag: "Home buying · lesson",
      lessonPath: "/topic/buying-a-home/subtopic/lesson-11",
      group: "later",
    },
  ],
  "Moving in with a partner": [
    {
      id: "partner-money-talk",
      status: "pending",
      when: "This weekend",
      title: "Discuss how you'll split bills and expenses",
      tag: "Relationships · money talk",
      lessonPath: "/topic/relationships/subtopic/lesson-12",
      group: "this-week",
    },
    {
      id: "partner-joint-account",
      status: "pending",
      when: "Before you move",
      title: "Decide whether to open a joint account",
      tag: "Relationships · banking",
      lessonPath: "/topic/relationships/subtopic/lesson-13",
      group: "coming-up",
    },
    {
      id: "partner-marriage-allowance",
      status: "pending",
      when: "Next tax year",
      title: "Check marriage allowance — up to £252 free",
      tag: "Relationships · tax",
      lessonPath: "/topic/relationships/subtopic/lesson-14",
      group: "later",
    },
  ],
  "Having a baby (or just had one)": [
    {
      id: "baby-mat-pay",
      status: "pending",
      when: "This week",
      title: "Check maternity/paternity pay entitlement with HR",
      tag: "Family · parental pay",
      lessonPath: "/topic/family/subtopic/lesson-15",
      group: "this-week",
    },
    {
      id: "baby-child-benefit",
      status: "pending",
      when: "In 3 months",
      title: "Register for Child Benefit within 3 months of birth",
      tag: "Family · benefits",
      lessonPath: "/topic/family/subtopic/lesson-16",
      group: "coming-up",
    },
    {
      id: "baby-jisa",
      status: "pending",
      when: "Before 5 Apr",
      title: "Open a Junior ISA — £9,000/yr tax-free for your child",
      tag: "Family · savings",
      lessonPath: "/topic/family/subtopic/lesson-17",
      group: "later",
    },
  ],
  "Getting a pay rise or switching roles": [
    {
      id: "payrise-prep",
      status: "pending",
      when: "Before your review",
      title: "Prepare your salary negotiation talking points",
      tag: "Career · negotiation",
      lessonPath: "/topic/career/subtopic/lesson-18",
      group: "this-week",
    },
    {
      id: "payrise-creep",
      status: "pending",
      when: "After your raise",
      title: "Review monthly spend — avoid lifestyle creep",
      tag: "Career · budgeting",
      lessonPath: "/topic/career/subtopic/lesson-19",
      group: "coming-up",
    },
    {
      id: "payrise-pension",
      status: "pending",
      when: "This quarter",
      title: "Track down and consolidate old pension pots",
      tag: "Career · pension",
      lessonPath: "/topic/career/subtopic/lesson-20",
      group: "later",
    },
  ],
  "Buying a car": [
    {
      id: "car-finance",
      status: "pending",
      when: "Before you commit",
      title: "Compare PCP vs HP car finance options",
      tag: "Car buying · finance",
      lessonPath: "/topic/cars/subtopic/lesson-24",
      group: "this-week",
    },
    {
      id: "car-true-cost",
      status: "pending",
      when: "Before buying",
      title: "Calculate full cost including insurance and VED",
      tag: "Car buying · costs",
      lessonPath: "/topic/cars/subtopic/lesson-25",
      group: "coming-up",
    },
  ],
};

export type { SpineItem, SpineGroup };
export type { SpineStatus } from "../../shared/types";

export function generateTimeline(
  profile: UserProfile | null
): { key: SpineGroup; label: string; items: SpineItem[] }[] {
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

  const recSummary = getRecommendedSummary(profile);
  const card1 = recSummary[0];
  const card2 = recSummary[1];
  const card3 = recSummary[2];

  const thisWeekItems: SpineItem[] = [];
  const comingUpItems: SpineItem[] = [];
  const laterItems: SpineItem[] = [];

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

  const evts = profile.upcomingEvents || [];
  const lifeStage = profile.lifeStage || "";
  const livingSituation = profile.livingSituation || "";
  const studentLoan = profile.studentLoan || "";

  // Seed items for each selected upcoming event (step 4 of onboarding)
  for (const evt of evts) {
    const items = UPCOMING_EVENT_ITEMS[evt];
    if (!items) continue;
    for (const item of items) {
      if (item.group === "this-week") thisWeekItems.push(item);
      else if (item.group === "coming-up") comingUpItems.push(item);
      else laterItems.push(item);
    }
  }

  // Life stage: already in first job (not captured by upcoming events)
  const hasUpcomingJob = evts.includes("Starting my first job soon") || evts.includes("Starting a new job (not my first) soon");
  if (lifeStage.includes("first proper job") && !hasUpcomingJob) {
    thisWeekItems.push({
      id: "pension-enrolment",
      status: "pending",
      when: "In 3 months",
      title: "Pension auto-enrolment kicks in",
      tag: "Starting work · pension",
      lessonPath: "/topic/starting-work/subtopic/lesson-02",
      group: "this-week",
    });
  }

  // Debt paydown
  if (profile.hasDebt === "Yes" || profile.sixMonthGoal?.includes("debt")) {
    thisWeekItems.push({
      id: "debt-dd-setup",
      status: "pending",
      when: "Tomorrow",
      title: "Set up a Direct Debit for debt paydown",
      tag: "Debt paydown",
      lessonPath: "/topic/debt/subtopic/lesson-30",
      group: "this-week",
    });
  }

  // Student loan repayment
  if (studentLoan.includes("actively coming off") || studentLoan.includes("Yes")) {
    comingUpItems.push({
      id: "student-loan-start",
      status: "pending",
      when: "1 Jul",
      title: "Student loan repayment starts",
      tag: "Student loan",
      lessonPath: "/topic/starting-work/subtopic/lesson-04",
      group: "coming-up",
    });
  }

  // Long-term renter considering buying (not already captured by "Thinking about buying a place")
  if (
    !evts.includes("Thinking about buying a place") &&
    (livingSituation.includes("Renting (been") || livingSituation.includes("Renting — been"))
  ) {
    comingUpItems.push({
      id: "lisa-open",
      status: "pending",
      when: "Before 5 Apr",
      title: "Open a Lifetime ISA (LISA) for your home deposit",
      tag: "Home buying",
      lessonPath: "/topic/buying-a-home/subtopic/lesson-09",
      group: "coming-up",
    });
  }

  // ISA deadline for savers/investors
  if (
    profile.sixMonthGoal?.includes("investing") ||
    profile.sixMonthGoal?.includes("saving") ||
    profile.sixMonthGoal?.includes("tax")
  ) {
    laterItems.push({
      id: "isa-deadline",
      status: "pending",
      when: "5 Apr",
      title: "ISA tax-year deadline — use your allowance",
      tag: "Tax calendar",
      group: "later",
    });
  }

  // Freelance / self-employed self-assessment
  if (lifeStage.includes("freelance") || lifeStage.includes("self-employed")) {
    laterItems.push({
      id: "self-assessment-deadline",
      status: "pending",
      when: "5 Oct",
      title: "Register for Self Assessment with HMRC",
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
