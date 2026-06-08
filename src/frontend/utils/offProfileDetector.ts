import type { UserStoryFact } from "../../shared/types";

// Maps topic IDs to the story fact keys that would indicate the user belongs there
const TOPIC_SIGNALS: Record<string, { keys: string[]; values?: string[] }> = {
  "investing-101": { keys: ["confidence_investing", "primary_concern"], values: ["invest"] },
  "buying-a-home": { keys: ["living_situation", "upcoming_events", "primary_concern"], values: ["buy", "home", "mortgage", "deposit"] },
  "debt": { keys: ["has_debt", "primary_concern"], values: ["debt"] },
  "renting": { keys: ["living_situation", "upcoming_events"], values: ["rent", "moving", "tenancy"] },
  "taxes-wealth": { keys: ["confidence_tax", "primary_concern"], values: ["tax"] },
  "family": { keys: ["upcoming_events"], values: ["baby", "family", "child"] },
  "career": { keys: ["upcoming_events", "primary_concern"], values: ["pay rise", "salary", "job", "career"] },
};

// Returns true if the topic seems inconsistent with what we know about the user
export function isTopicOffProfile(topicId: string, facts: UserStoryFact[]): boolean {
  const activeFacts = facts.filter((f) => f.isActive);

  // Low confidence + no relevant goal signal → off-profile for high-expertise topics
  if (topicId === "investing-101") {
    const confFact = activeFacts.find((f) => f.key === "confidence_investing");
    if (confFact && Number(confFact.value) <= 1) {
      const goalFact = activeFacts.find((f) => f.key === "primary_concern");
      const wantsToInvest = goalFact?.value?.toLowerCase().includes("invest");
      if (!wantsToInvest) return true;
    }
  }

  const signals = TOPIC_SIGNALS[topicId];
  if (!signals) return false;

  // Check if any active fact signals belonging to this topic
  const hasSignal = activeFacts.some((f) => {
    if (!signals.keys.includes(f.key)) return false;
    if (!signals.values) return true;
    return signals.values.some((v) => f.value.toLowerCase().includes(v));
  });

  // Also check upcoming_events multi-value fact
  const eventsFact = activeFacts.find((f) => f.key === "upcoming_events");
  const eventsHaveSignal = signals.values
    ? signals.values.some((v) => eventsFact?.value?.toLowerCase().includes(v))
    : false;

  return !hasSignal && !eventsHaveSignal;
}

export function buildNudgeQuestion(topicId: string): string {
  const questions: Record<string, string> = {
    "investing-101": "Hey — I noticed you're jumping into investing, which is a bit different from your current focus. What's drawing you there? Any specific goal in mind?",
    "buying-a-home": "You're exploring buying a home — that's a big one! Is this something you're actively planning, or more curiosity for now?",
    "debt": "I see you're looking at the debt module. Is this something you're dealing with at the moment? I can adjust your plan to focus on it.",
    "renting": "You're checking out the renting module — are you thinking about moving out soon?",
    "taxes-wealth": "Diving into taxes and wealth — what's prompting this? A pay rise, self-employment, or just wanting to understand it better?",
    "family": "You're looking at family finances — is there something coming up, like a new arrival?",
    "career": "Exploring career and pay — are you thinking about a new role or negotiating a raise?",
  };
  return questions[topicId] ?? `I noticed you're starting a new module. What's drawing you to it right now?`;
}
