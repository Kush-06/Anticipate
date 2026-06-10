import { describe, expect, it } from 'vitest'
import { getNextReminderDate, getReminderSchedule } from './notificationSchedule'

describe('getReminderSchedule', () => {
  it('returns daily reminders for an exact-date item, ending on the due date', () => {
    const schedule = getReminderSchedule({ dueYear: 2026, dueMonth: 12, dueDay: 15 })

    expect(schedule).toEqual([
      new Date(2026, 11, 12),
      new Date(2026, 11, 13),
      new Date(2026, 11, 14),
      new Date(2026, 11, 15),
    ])
  })

  it('returns every-2-day reminders for a month-only item, ending on the 1st of the due month', () => {
    const schedule = getReminderSchedule({ dueYear: 2027, dueMonth: 2 })

    expect(schedule).toEqual([
      new Date(2027, 0, 25),
      new Date(2027, 0, 27),
      new Date(2027, 0, 29),
      new Date(2027, 0, 31),
      new Date(2027, 1, 1),
    ])
  })

  it('crosses a year boundary for a month-only item due in January', () => {
    const schedule = getReminderSchedule({ dueYear: 2027, dueMonth: 1 })

    expect(schedule).toEqual([
      new Date(2026, 11, 25),
      new Date(2026, 11, 27),
      new Date(2026, 11, 29),
      new Date(2026, 11, 31),
      new Date(2027, 0, 1),
    ])
  })
})

describe('getNextReminderDate', () => {
  const examDate = { dueYear: 2026, dueMonth: 12, dueDay: 15 }
  const examMonth = { dueYear: 2027, dueMonth: 2 }

  it('returns the first reminder when today is before it', () => {
    const next = getNextReminderDate(examDate, new Date(2026, 11, 1))
    expect(next).toEqual(new Date(2026, 11, 12))
  })

  it('returns today when today lands exactly on a reminder date', () => {
    const next = getNextReminderDate(examDate, new Date(2026, 11, 13))
    expect(next).toEqual(new Date(2026, 11, 13))
  })

  it('returns the next reminder when today falls between two cadence steps', () => {
    const next = getNextReminderDate(examMonth, new Date(2027, 0, 26))
    expect(next).toEqual(new Date(2027, 0, 27))
  })

  it('returns the due date when today is the due date itself', () => {
    const next = getNextReminderDate(examDate, new Date(2026, 11, 15))
    expect(next).toEqual(new Date(2026, 11, 15))
  })

  it('returns null once the due date has passed', () => {
    const next = getNextReminderDate(examDate, new Date(2026, 11, 16))
    expect(next).toBeNull()
  })
})
