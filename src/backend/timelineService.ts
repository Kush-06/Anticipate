import { supabase } from './supabaseClient'
import type { TimelineItem, SpineGroup, SpineStatus } from '../shared/types'
import {
  deriveSpineGroup,
  duePartsFromIsoDate,
  duePartsFromWhenLabel,
  duePartsSortValue,
  formatTimelineWhen,
  type TimelineDueParts,
} from '../shared/timelineDates'

type SpineItemLike = {
  id: string
  status: SpineStatus
  when: string
  title: string
  tag: string
  lessonPath?: string
  group: SpineGroup
  dueYear?: number
  dueMonth?: number
  dueDay?: number
}

function duePartsFromItem(item: {
  whenLabel: string
  dueYear?: number
  dueMonth?: number
  dueDay?: number
  dueDate?: string
}): TimelineDueParts {
  if (item.dueYear && item.dueMonth) {
    return { dueYear: item.dueYear, dueMonth: item.dueMonth, ...(item.dueDay ? { dueDay: item.dueDay } : {}) }
  }

  if (item.dueDate) {
    const dueParts = duePartsFromIsoDate(item.dueDate)
    if (dueParts) return dueParts
  }

  return duePartsFromWhenLabel(item.whenLabel)
}

export function normalizeTimelineTitle(title: string): string {
  return title.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function sortTimelineItems(items: TimelineItem[]): TimelineItem[] {
  return [...items].sort((a, b) => {
    const duePartsDiff = duePartsSortValue(a) - duePartsSortValue(b)
    if (duePartsDiff !== 0) return duePartsDiff

    const sortOrderDiff = a.sortOrder - b.sortOrder
    if (sortOrderDiff !== 0) return sortOrderDiff

    return Date.parse(a.createdAt) - Date.parse(b.createdAt)
  })
}

function uniqueItemsByTitle(items: SpineItemLike[]): SpineItemLike[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const titleKey = normalizeTimelineTitle(item.title)
    if (seen.has(titleKey)) return false
    seen.add(titleKey)
    return true
  })
}

function mapDbTimelineItem(row: Record<string, unknown>): TimelineItem {
  const dueParts = duePartsFromItem({
    whenLabel: row.when_label as string,
    dueDate: (row.due_date as string | null) ?? undefined,
    dueYear: row.due_year as number | undefined,
    dueMonth: row.due_month as number | undefined,
    dueDay: row.due_day as number | undefined,
  })

  return {
    id: row.id as string,
    userId: row.user_id as string,
    itemKey: row.item_key as string,
    status: row.status as SpineStatus,
    spineGroup: deriveSpineGroup(dueParts),
    title: row.title as string,
    tag: row.tag as string,
    whenLabel: formatTimelineWhen(dueParts),
    ...dueParts,
    lessonPath: (row.lesson_path as string | null) ?? undefined,
    source: row.source as TimelineItem['source'],
    sortOrder: row.sort_order as number,
    isDismissed: row.is_dismissed as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

async function filterNewTimelineItemsByTitle(userId: string, items: SpineItemLike[]): Promise<SpineItemLike[]> {
  const uniqueItems = uniqueItemsByTitle(items)
  if (uniqueItems.length === 0) return []

  const { data, error } = await supabase
    .from('user_timeline_items')
    .select('title')
    .eq('user_id', userId)
    .eq('is_dismissed', false)

  if (error) throw new Error(`fetch timeline titles failed: ${error.message}`)

  const existingTitles = new Set(
    ((data ?? []) as { title: string }[]).map((row) => normalizeTimelineTitle(row.title)),
  )

  return uniqueItems.filter((item) => !existingTitles.has(normalizeTimelineTitle(item.title)))
}

// Converts SpineItem[] (from generateTimeline) into DB rows and inserts them.
// Called once from ProfileContext.completeOnboarding.
export async function seedTimeline(userId: string, items: SpineItemLike[]): Promise<void> {
  const newItems = await filterNewTimelineItemsByTitle(userId, items)
  if (newItems.length === 0) return

  const rows = newItems.map((item, index) => {
    const dueParts = duePartsFromItem({
      whenLabel: item.when,
      dueYear: item.dueYear,
      dueMonth: item.dueMonth,
      dueDay: item.dueDay,
    })

    return {
      user_id: userId,
      item_key: item.id,
      status: item.status,
      spine_group: deriveSpineGroup(dueParts),
      title: item.title,
      tag: item.tag,
      when_label: formatTimelineWhen(dueParts),
      due_year: dueParts.dueYear,
      due_month: dueParts.dueMonth,
      due_day: dueParts.dueDay ?? null,
      lesson_path: item.lessonPath ?? null,
      source: 'onboarding_seed',
      sort_order: index,
      is_dismissed: false,
    }
  })

  const { error } = await supabase
    .from('user_timeline_items')
    .upsert(rows, { onConflict: 'user_id,item_key,source', ignoreDuplicates: true })
  if (error) throw new Error(`seedTimeline failed: ${error.message}`)
}

export async function addTimelineItems(userId: string, items: SpineItemLike[]): Promise<void> {
  const newItems = await filterNewTimelineItemsByTitle(userId, items)
  if (newItems.length === 0) return

  const rows = newItems.map((item, index) => {
    const dueParts = duePartsFromItem({
      whenLabel: item.when,
      dueYear: item.dueYear,
      dueMonth: item.dueMonth,
      dueDay: item.dueDay,
    })

    return {
      user_id: userId,
      item_key: item.id,
      status: item.status,
      spine_group: deriveSpineGroup(dueParts),
      title: item.title,
      tag: item.tag,
      when_label: formatTimelineWhen(dueParts),
      due_year: dueParts.dueYear,
      due_month: dueParts.dueMonth,
      due_day: dueParts.dueDay ?? null,
      lesson_path: item.lessonPath ?? null,
      source: 'user_added',
      sort_order: 100 + index,
      is_dismissed: false,
    }
  })

  const { error } = await supabase
    .from('user_timeline_items')
    .insert(rows)
  if (error) throw new Error(`addTimelineItems failed: ${error.message}`)
}

export async function fetchTimeline(userId: string): Promise<TimelineItem[]> {
  const { data, error } = await supabase
    .from('user_timeline_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_dismissed', false)
    .order('sort_order', { ascending: true })

  if (error || !data) return []

  const items = (data as Record<string, unknown>[]).map(mapDbTimelineItem)

  return sortTimelineItems(items)
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

export async function addTimelineItem(
  userId: string,
  item: {
    itemKey: string
    title: string
    tag: string
    spineGroup: SpineGroup
    status: SpineStatus
    whenLabel: string
    dueYear?: number
    dueMonth?: number
    dueDay?: number
    dueDate?: string
    lessonPath?: string
  },
): Promise<TimelineItem> {
  const { data: existingRows, error: existingError } = await supabase
    .from('user_timeline_items')
    .select('*')
    .eq('user_id', userId)
    .eq('is_dismissed', false)

  if (existingError) throw new Error(`fetch timeline titles failed: ${existingError.message}`)

  const existingItem = ((existingRows ?? []) as Record<string, unknown>[])
    .map(mapDbTimelineItem)
    .find((row) => normalizeTimelineTitle(row.title) === normalizeTimelineTitle(item.title))

  if (existingItem) return existingItem

  const { data: maxRows } = await supabase
    .from('user_timeline_items')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sortOrder = ((maxRows?.[0] as { sort_order: number } | undefined)?.sort_order ?? -1) + 1
  const dueParts = duePartsFromItem(item)

  const now = new Date().toISOString()
  const row = {
    user_id: userId,
    item_key: item.itemKey,
    status: item.status,
    spine_group: deriveSpineGroup(dueParts),
    title: item.title,
    tag: item.tag,
    when_label: formatTimelineWhen(dueParts),
    due_year: dueParts.dueYear,
    due_month: dueParts.dueMonth,
    due_day: dueParts.dueDay ?? null,
    lesson_path: item.lessonPath ?? null,
    source: 'ai_generated',
    sort_order: sortOrder,
    is_dismissed: false,
  }

  const { error } = await supabase
    .from('user_timeline_items')
    .insert(row)

  if (error) throw new Error(`addTimelineItem failed: ${error.message}`)

  return {
    id: item.itemKey,
    userId,
    itemKey: item.itemKey,
    status: item.status,
    spineGroup: deriveSpineGroup(dueParts),
    title: item.title,
    tag: item.tag,
    whenLabel: formatTimelineWhen(dueParts),
    ...dueParts,
    lessonPath: item.lessonPath,
    source: 'ai_generated',
    sortOrder,
    isDismissed: false,
    createdAt: now,
    updatedAt: now,
  }
}

export async function markTimelineItemDone(userId: string, itemId: string): Promise<void> {
  await supabase
    .from('user_timeline_items')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', itemId)
}

export async function markTimelineItemsDone(userId: string, itemIds: string[]): Promise<void> {
  if (itemIds.length === 0) return

  await supabase
    .from('user_timeline_items')
    .update({ status: 'done', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .in('id', itemIds)
}
