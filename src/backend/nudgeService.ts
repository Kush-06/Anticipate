import { supabase } from './supabaseClient'
import type { AiNudge, NudgeTriggerType, NudgeStatus } from '../shared/types'

// Stub: in production this will use Capacitor PushNotifications to deliver the nudge.
// For now it logs so the integration point is clearly visible during development.
export async function sendPushNudge(nudge: AiNudge): Promise<void> {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info('[nudge] would send push notification', nudge.id, nudge.questionText)
  }
  // TODO: integrate @capacitor/push-notifications here
}

export async function createNudge(
  userId: string,
  trigger: {
    type: NudgeTriggerType
    detail?: string
    courseId?: string
    context?: string
  },
  questionText: string
): Promise<AiNudge | null> {
  const { data, error } = await supabase
    .from('ai_nudges')
    .insert({
      user_id: userId,
      trigger_type: trigger.type,
      trigger_detail: trigger.detail ?? null,
      course_id: trigger.courseId ?? null,
      question_text: questionText,
      question_context: trigger.context ?? null,
      status: 'sent',
    })
    .select()
    .single()

  if (error || !data) return null
  return rowToNudge(data as Record<string, unknown>)
}

export async function recordNudgeResponse(nudgeId: string, response: string): Promise<void> {
  await supabase
    .from('ai_nudges')
    .update({
      status: 'answered' as NudgeStatus,
      user_response: response,
      responded_at: new Date().toISOString(),
    })
    .eq('id', nudgeId)
}

export async function updateNudgeOutcome(
  nudgeId: string,
  outcome: {
    factsUpdated?: string[]
    timelineUpdated?: string[]
    confidenceDelta?: Record<string, number>
  }
): Promise<void> {
  await supabase
    .from('ai_nudges')
    .update({
      facts_updated: outcome.factsUpdated ?? [],
      timeline_updated: outcome.timelineUpdated ?? [],
      confidence_delta: outcome.confidenceDelta ?? null,
    })
    .eq('id', nudgeId)
}

export async function fetchPendingNudges(userId: string): Promise<AiNudge[]> {
  const { data, error } = await supabase
    .from('ai_nudges')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['sent', 'delivered'])
    .gt('expires_at', new Date().toISOString())
    .order('sent_at', { ascending: false })

  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(rowToNudge)
}

function rowToNudge(row: Record<string, unknown>): AiNudge {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    triggerType: row.trigger_type as NudgeTriggerType,
    triggerDetail: row.trigger_detail as string | undefined,
    courseId: row.course_id as string | undefined,
    questionText: row.question_text as string,
    questionContext: row.question_context as string | undefined,
    status: row.status as NudgeStatus,
    userResponse: row.user_response as string | undefined,
    respondedAt: row.responded_at as string | undefined,
    factsUpdated: (row.facts_updated as string[]) ?? [],
    timelineUpdated: (row.timeline_updated as string[]) ?? [],
    confidenceDelta: row.confidence_delta as Record<string, number> | undefined,
    sentAt: row.sent_at as string,
    expiresAt: row.expires_at as string,
  }
}
