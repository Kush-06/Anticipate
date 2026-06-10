import type { SpineItem } from '@shared/types'

export function getFallbackAccessibleTimelineItemId(items: SpineItem[]): string | null {
  return items.find((item) => item.status !== 'done')?.id ?? null
}

export function isTimelineItemAccessible(item: SpineItem, fallbackAccessibleItemId: string | null): boolean {
  return item.status === 'active' || item.id === fallbackAccessibleItemId
}
