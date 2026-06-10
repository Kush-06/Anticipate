import type { SpineGroup } from './types'

export interface TimelineDueParts {
  dueYear: number
  dueMonth: number
  dueDay?: number
}

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
}

export function startOfToday(today = new Date()): Date {
  const date = new Date(today)
  date.setHours(0, 0, 0, 0)
  return date
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function partsFromDate(date: Date, includeDay = true): TimelineDueParts {
  return {
    dueYear: date.getFullYear(),
    dueMonth: date.getMonth() + 1,
    ...(includeDay ? { dueDay: date.getDate() } : {}),
  }
}

export function dateFromDueParts(parts: TimelineDueParts): Date {
  return new Date(parts.dueYear, parts.dueMonth - 1, parts.dueDay ?? 1)
}

export function duePartsSortValue(parts: TimelineDueParts): number {
  return parts.dueYear * 10000 + parts.dueMonth * 100 + (parts.dueDay ?? 1)
}

export function deriveSpineGroup(parts: TimelineDueParts, today = new Date()): SpineGroup {
  const start = startOfToday(today)
  const itemDate = dateFromDueParts(parts)
  const diffDays = Math.ceil((itemDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays >= 0 && diffDays <= 7) return 'this-week'
  if (diffDays <= 90) return 'coming-up'
  return 'later'
}

export function formatTimelineWhen(parts: TimelineDueParts): string {
  const date = dateFromDueParts(parts)
  if (parts.dueDay) {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
  }

  return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase()
}

export function duePartsFromIsoDate(value: string): TimelineDueParts | null {
  const match = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)
  if (!match) return null

  const dueYear = Number(match[1])
  const dueMonth = Number(match[2])
  const dueDay = match[3] ? Number(match[3]) : undefined

  if (!Number.isInteger(dueYear) || !Number.isInteger(dueMonth) || dueMonth < 1 || dueMonth > 12) return null
  if (dueDay !== undefined && (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31)) return null

  return { dueYear, dueMonth, ...(dueDay ? { dueDay } : {}) }
}

export function duePartsFromWhenLabel(label: string, today = new Date()): TimelineDueParts {
  const start = startOfToday(today)
  const normalized = label.trim().toLowerCase()

  if (normalized === 'today' || normalized === 'this week') return partsFromDate(start)
  if (normalized === 'tomorrow') return partsFromDate(addDays(start, 1))
  if (normalized.includes('weekend')) return partsFromDate(addDays(start, 6))
  if (normalized.includes('first payday')) return partsFromDate(addMonths(start, 1), false)
  if (normalized.includes('tax year')) return { dueYear: start.getMonth() + 1 > 4 ? start.getFullYear() + 1 : start.getFullYear(), dueMonth: 4, dueDay: 5 }
  if (normalized.includes('quarter')) return partsFromDate(addMonths(start, 3), false)

  const monthOffset = normalized.match(/in\s+(\d+)\s+months?/)
  if (monthOffset) return partsFromDate(addMonths(start, Number(monthOffset[1])), false)

  const dayOffset = normalized.match(/in\s+(\d+)\s+(?:days?|weeks?)/)
  if (dayOffset) {
    const amount = Number(dayOffset[1])
    const days = normalized.includes('week') ? amount * 7 : amount
    return partsFromDate(addDays(start, days))
  }

  const dayMonth = normalized.match(/(?:before\s+)?(?:mon|tue|wed|thu|fri|sat|sun)?\s*(\d{1,2})\s+([a-z]+)/)
  if (dayMonth) {
    const dueDay = Number(dayMonth[1])
    const dueMonth = MONTH_INDEX[dayMonth[2]]
    if (dueMonth) {
      const currentMonth = start.getMonth() + 1
      const dueYear = dueMonth < currentMonth || (dueMonth === currentMonth && dueDay < start.getDate())
        ? start.getFullYear() + 1
        : start.getFullYear()
      return { dueYear, dueMonth, dueDay }
    }
  }

  const monthOnly = normalized.match(/\b([a-z]+)\b/)
  if (monthOnly) {
    const dueMonth = MONTH_INDEX[monthOnly[1]]
    if (dueMonth) {
      const dueYear = dueMonth < start.getMonth() + 1 ? start.getFullYear() + 1 : start.getFullYear()
      return { dueYear, dueMonth }
    }
  }

  if (normalized.includes('move') || normalized.includes('offer') || normalized.includes('buy')) {
    return partsFromDate(addMonths(start, 3), false)
  }

  return partsFromDate(addMonths(start, 1), false)
}
