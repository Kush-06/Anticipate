import { supabase } from './supabaseClient'
import type { TimelineItem, SpineGroup, SpineStatus } from '../shared/types'

type SpineItemLike = {
  id: string
  status: SpineStatus
  when: string
  title: string
  tag: string
  lessonPath?: string
  group: SpineGroup
}

// Converts SpineItem[] (from generateTimeline) into DB rows and inserts them.
// Called once from ProfileContext.completeOnboarding.
export async function seedTimeline(userId: string, items: SpineItemLike[]): Promise<void> {
  const rows = items.map((item, index) => ({
    user_id: userId,
    item_key: item.id,
    status: item.status,
    spine_group: item.group,
    title: item.title,
    tag: item.tag,
    when_label: item.when,
    lesson_path: item.lessonPath ?? null,
    source: 'onboarding_seed',
    sort_order: index,
    is_dismissed: false,
  }))

  const { error } = await supabase
    .from('user_timeline_items')
    .upsert(rows, { onConflict: 'user_id,item_key' })
  if (error) throw new Error(`seedTimeline failed: ${error.message}`)
}

export async function fetchTimeline(userId: string): Promise<TimelineItem[]> {
  const { data, error } = await supabase
    .from('user_timeline_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .order('sort_order', { ascending: true })

  if (error || !data) return []

  return (data as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    userId: row.user_id as string,
    itemKey: row.item_key as string,
    status: row.status as SpineStatus,
    spineGroup: row.spine_group as SpineGroup,
    title: row.title as string,
    tag: row.tag as string,
    whenLabel: row.when_label as string,
    dueDate: row.due_date as string | undefined,
    lessonPath: row.lesson_path as string | undefined,
    source: row.source as TimelineItem['source'],
    sortOrder: row.sort_order as number,
    isDismissed: row.is_dismissed as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }))
}

export async function updateTimelineItem(
  id: string,
  updates: Partial<Pick<TimelineItem, 'status' | 'isDismissed' | 'whenLabel' | 'sortOrder'>>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.isDismissed !== undefined) dbUpdates.is_dismissed = updates.isDismissed
  if (updates.whenLabel !== undefined) dbUpdates.when_label = updates.whenLabel
  if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder

  await supabase.from('user_timeline_items').update(dbUpdates).eq('id', id)
}

export async function markTimelineItemDone(userId: string, itemKey: string): Promise<void> {
  await supabase
    .from('user_timeline_items')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('item_key', itemKey)
}
