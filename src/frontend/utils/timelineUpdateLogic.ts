import type { SpineItem, SpineGroup } from "@shared/types";
import { topics } from "../data/topics";

export interface RelativeSpineItem {
  id: string;
  title: string;
  tag: string;
  lessonPath?: string;
  offsetDays: number;
}

export interface LifeEventConfig {
  id: string;
  label: string;
  trackName: string;
  items: RelativeSpineItem[];
}

export const LIFE_EVENT_CONFIGS: LifeEventConfig[] = [
  {
    id: 'new-job',
    label: 'New job / promotion',
    trackName: 'Starting Work',
    items: [
      {
        id: "new-job-pension",
        title: "Pension auto-enrolment kicks in",
        tag: "New job · pension",
        lessonPath: "/topic/starting-work/subtopic/lesson-02",
        offsetDays: 90,
      },
      {
        id: "new-job-budget",
        title: "Set up your 50/30/20 budget",
        tag: "New job · budgeting",
        lessonPath: "/topic/starting-work/subtopic/lesson-03",
        offsetDays: -7,
      },
      {
        id: "career-negotiation",
        title: "Master your next salary negotiation",
        tag: "Career · growth",
        lessonPath: "/topic/career/subtopic/lesson-18",
        offsetDays: 180,
      }
    ]
  },
  {
    id: 'moving-out',
    label: 'Moving out',
    trackName: 'Renting',
    items: [
      {
        id: "move-deposit",
        title: "Check tenancy deposit protection",
        tag: "Moving out · deposit",
        lessonPath: "/topic/renting/subtopic/lesson-05",
        offsetDays: -7,
      },
      {
        id: "move-insurance",
        title: "Arrange renters' insurance",
        tag: "Moving out · insurance",
        lessonPath: "/topic/renting/subtopic/lesson-07",
        offsetDays: 14,
      },
      {
        id: "move-bills",
        title: "Build your first bills budget",
        tag: "Moving out · bills",
        lessonPath: "/topic/renting/subtopic/lesson-06",
        offsetDays: -14,
      }
    ]
  },
  {
    id: 'freelance',
    label: 'Going freelance',
    trackName: 'Taxes & Wealth',
    items: [
      {
        id: "freelance-tax",
        title: "Register for Self Assessment",
        tag: "Freelance · tax",
        lessonPath: "/topic/taxes-wealth/subtopic/lesson-48",
        offsetDays: 30,
      },
      {
        id: "freelance-pension",
        title: "Set up a private pension (SIPP)",
        tag: "Freelance · pension",
        lessonPath: "/topic/starting-work/subtopic/lesson-02",
        offsetDays: 60,
      }
    ]
  },
  {
    id: 'life-change',
    label: 'Big life change',
    trackName: 'Foundations',
    items: [
      {
        id: "foundations-emergency",
        title: "Review your emergency fund",
        tag: "Foundations · safety",
        lessonPath: "/topic/foundations/subtopic/lesson-37",
        offsetDays: 14,
      },
      {
        id: "foundations-budget",
        title: "Re-calculate your monthly budget",
        tag: "Foundations · spend",
        lessonPath: "/topic/starting-work/subtopic/lesson-03",
        offsetDays: 7,
      }
    ]
  },
  {
    id: 'saving',
    label: 'Saving for something',
    trackName: 'Investing 101',
    items: [
      {
        id: "save-isa",
        title: "Open a Stocks & Shares ISA",
        tag: "Investing · ISA",
        lessonPath: "/topic/investing-101/subtopic/lesson-43",
        offsetDays: 7,
      },
      {
        id: "save-compounding",
        title: "Understand the power of compounding",
        tag: "Investing · growth",
        lessonPath: "/topic/foundations/subtopic/lesson-36",
        offsetDays: 14,
      }
    ]
  }
];

export function searchLessons(query: string): { topicId: string, subTopicId: string, title: string }[] {
  const results: { topicId: string, subTopicId: string, title: string }[] = [];
  const q = query.toLowerCase();
  
  topics.forEach(topic => {
    topic.subTopics.forEach(sub => {
      if (sub.title.toLowerCase().includes(q) || topic.title.toLowerCase().includes(q)) {
        results.push({ topicId: topic.id, subTopicId: sub.id, title: sub.title });
      }
    });
  });
  
  return results;
}

function formatDateLabel(date: Date): string {
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 0 && diffDays < 7) return `This ${date.toLocaleDateString('en-GB', { weekday: 'long' })}`;
  
  if (diffDays > 0 && diffDays < 31) return `In ${diffDays} days`;
  
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function calculateTimelineItems(
  eventId: string,
  targetDateStr: string,
  details: string,
  today: Date = new Date()
): SpineItem[] {
  // Reset today to midnight for consistent day-diff calculation
  today.setHours(0, 0, 0, 0);
  
  const targetDate = targetDateStr ? new Date(targetDateStr) : new Date(today);
  targetDate.setHours(0, 0, 0, 0);

  const config = LIFE_EVENT_CONFIGS.find(c => c.id === eventId);
  
  if (!config) {
    if (eventId === 'other' && details) {
       const searchResults = searchLessons(details);
       if (searchResults.length > 0) {
         // Create a few items based on search results
         return searchResults.slice(0, 2).map((res, idx) => {
            const itemDate = new Date(targetDate);
            itemDate.setDate(itemDate.getDate() + (idx * 7));
            
            const diffDays = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            let group: SpineGroup = 'later';
            if (diffDays <= 7) group = 'this-week';
            else if (diffDays <= 30) group = 'coming-up';

            return {
              id: `custom-${res.subTopicId}-${Date.now()}-${idx}`,
              status: 'pending',
              when: formatDateLabel(itemDate),
              title: res.title,
              tag: "Custom track",
              lessonPath: `/topic/${res.topicId}/subtopic/${res.subTopicId}`,
              group
            };
         });
       }
    }
    // Fallback if no config and no search results
    return [{
        id: `generic-${Date.now()}`,
        status: 'pending',
        when: formatDateLabel(targetDate),
        title: details || "Life event update",
        tag: "Personal finance",
        group: 'this-week'
    }];
  }

  return config.items.map(relItem => {
    const itemDate = new Date(targetDate);
    itemDate.setDate(itemDate.getDate() + relItem.offsetDays);
    
    const diffDays = Math.ceil((itemDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    let group: SpineGroup = 'later';
    if (diffDays <= 7) group = 'this-week';
    else if (diffDays <= 30) group = 'coming-up';

    return {
      id: `${relItem.id}-${Date.now()}`,
      status: 'pending',
      when: formatDateLabel(itemDate),
      title: relItem.title,
      tag: relItem.tag,
      lessonPath: relItem.lessonPath,
      group
    };
  });
}
