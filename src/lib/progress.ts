import type { Entry, Habit } from './types'
import { addDays, fromKey, todayKey } from './dates'

export type EntryMap = Map<string, number>

export const buildEntryMap = (entries: Entry[]): EntryMap => new Map(entries.map(e => [e.key, e.value]))
export const entryKey = (habitId: string, date: string) => `${habitId}|${date}`

export const isScheduled = (h: Habit, date: string) =>
  h.active && h.createdAt <= date && h.days.includes(fromKey(date).getDay())

const goalOf = (h: Habit) => (h.type === 'boolean' ? 1 : h.target)

export const isDone = (h: Habit, map: EntryMap, date: string) =>
  (map.get(entryKey(h.id, date)) ?? 0) >= goalOf(h)

/** Fraction (0-1) of a habit's target reached, capped at 1. */
export const habitFraction = (h: Habit, map: EntryMap, date: string) =>
  Math.min(1, (map.get(entryKey(h.id, date)) ?? 0) / goalOf(h))

export function dayStats(habits: Habit[], map: EntryMap, date: string) {
  const scheduled = habits.filter(h => isScheduled(h, date))
  const done = scheduled.filter(h => isDone(h, map, date)).length
  return { scheduled: scheduled.length, done, pct: scheduled.length ? Math.round((done / scheduled.length) * 100) : null }
}

/** Streak = consecutive days where every scheduled habit was completed. Rest days are neutral. */
export function streaks(habits: Habit[], map: EntryMap) {
  const today = todayKey()
  const start = habits.reduce((m, h) => (h.createdAt < m ? h.createdAt : m), today)
  const perfect = (d: string) => {
    const s = dayStats(habits, map, d)
    return s.scheduled === 0 ? null : s.done === s.scheduled
  }

  let longest = 0
  let run = 0
  for (let k = start; k <= today; k = addDays(k, 1)) {
    const p = perfect(k)
    if (p === true) longest = Math.max(longest, ++run)
    else if (p === false && k !== today) run = 0 // today may still be in progress
  }
  // `run` now holds the current streak (today's unfinished state doesn't break it)
  return { current: run, longest }
}
