import { openDB, type DBSchema } from 'idb'
import type { Entry, Goal, Habit, Settings } from './types'

interface Schema extends DBSchema {
  habits: { key: string; value: Habit }
  entries: { key: string; value: Entry }
  goals: { key: string; value: Goal }
  meta: { key: string; value: Settings }
}

export const dbPromise = openDB<Schema>('habitzen', 1, {
  upgrade(db) {
    db.createObjectStore('habits', { keyPath: 'id' })
    db.createObjectStore('entries', { keyPath: 'key' })
    db.createObjectStore('goals', { keyPath: 'id' })
    db.createObjectStore('meta')
  },
})

export const defaultSettings: Settings = { theme: 'light', reminderEnabled: false, reminderTime: '20:00' }

export async function loadAll() {
  const db = await dbPromise
  const [habits, entries, goals, settings] = await Promise.all([
    db.getAll('habits'),
    db.getAll('entries'),
    db.getAll('goals'),
    db.get('meta', 'settings'),
  ])
  return { habits, entries, goals, settings: { ...defaultSettings, ...settings } }
}

export async function replaceAll(data: { habits: Habit[]; entries: Entry[]; goals: Goal[]; settings: Settings }) {
  const db = await dbPromise
  const tx = db.transaction(['habits', 'entries', 'goals', 'meta'], 'readwrite')
  await Promise.all([
    tx.objectStore('habits').clear(),
    tx.objectStore('entries').clear(),
    tx.objectStore('goals').clear(),
  ])
  for (const h of data.habits) tx.objectStore('habits').put(h)
  for (const e of data.entries) tx.objectStore('entries').put(e)
  for (const g of data.goals) tx.objectStore('goals').put(g)
  tx.objectStore('meta').put(data.settings, 'settings')
  await tx.done
}
