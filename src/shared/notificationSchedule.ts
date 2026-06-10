import { addDays, dateFromDueParts, startOfToday, type TimelineDueParts } from './timelineDates'

/**
 * Full list of reminder dates for a timeline item, earliest first, always
 * ending on the due date itself (the 1st of the month for month-only events).
 *
 * - Exact date (`dueDay` set): first reminder 3 days before, then daily.
 * - Month-only (`dueDay` unset): first reminder 7 days before, then every 2 days.
 */
export function getReminderSchedule(parts: TimelineDueParts): Date[] {
  const dueDate = dateFromDueParts(parts)
  const hasExactDate = parts.dueDay !== undefined
  const leadDays = hasExactDate ? 3 : 7
  const cadenceDays = hasExactDate ? 1 : 2

  const dates: Date[] = []
  let current = addDays(dueDate, -leadDays)
  while (current < dueDate) {
    dates.push(current)
    current = addDays(current, cadenceDays)
  }
  dates.push(dueDate)
  return dates
}

/**
 * The next reminder date on/after `today`, or null once the due date has passed.
 */
export function getNextReminderDate(parts: TimelineDueParts, today = new Date()): Date | null {
  const start = startOfToday(today)
  return getReminderSchedule(parts).find((date) => date >= start) ?? null
}
