export interface UserProgress {
  userId: string
  completedSubTopicIds: string[]
  updatedAt: string
}

export type StoryFactSource = 'onboarding' | 'ai_chat' | 'course_signal' | 'nudge_response' | 'user_edit'
export type StoryFactCategory =
  | 'life_stage' | 'housing' | 'career' | 'finances' | 'goals'
  | 'events' | 'confidence' | 'behaviour' | 'family' | 'preferences'

export interface UserStoryFact {
  id: string
  userId: string
  category: StoryFactCategory
  key: string
  value: string
  valueJson?: Record<string, unknown>
  source: StoryFactSource
  sourceDetail?: string
  setByAi: boolean
  confidence: number
  isActive: boolean
  supersededBy?: string
  createdAt: string
  updatedAt: string
}

export type SpineStatus = 'active' | 'pending' | 'done'
export type SpineGroup = 'this-week' | 'coming-up' | 'later'

export interface SpineItem {
  id: string
  status: SpineStatus
  when: string
  title: string
  tag: string
  lessonPath?: string
  group: SpineGroup
}

export interface TimelineItem {
  id: string
  userId: string
  itemKey: string
  status: SpineStatus
  spineGroup: SpineGroup
  title: string
  tag: string
  whenLabel: string
  dueDate?: string
  lessonPath?: string
  source: 'onboarding_seed' | 'ai_generated' | 'ai_modified' | 'user_added'
  sortOrder: number
  isDismissed: boolean
  createdAt: string
  updatedAt: string
}

export type NudgeStatus = 'sent' | 'delivered' | 'answered' | 'dismissed' | 'expired'
export type NudgeTriggerType =
  | 'course_start_off_profile'
  | 'profile_gap'
  | 'milestone_approaching'
  | 'ai_proactive'

export interface AiNudge {
  id: string
  userId: string
  triggerType: NudgeTriggerType
  triggerDetail?: string
  courseId?: string
  questionText: string
  questionContext?: string
  status: NudgeStatus
  userResponse?: string
  respondedAt?: string
  factsUpdated: string[]
  timelineUpdated: string[]
  confidenceDelta?: Record<string, number>
  sentAt: string
  expiresAt: string
}
