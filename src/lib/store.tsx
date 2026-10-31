import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { dbPromise, defaultSettings, loadAll, replaceAll } from './db'
import { buildEntryMap, entryKey, type EntryMap } from './progress'
import { todayKey } from './dates'
import type { Backup, Entry, Goal, Habit, Settings } from './types'

interface Store {
  ready: boolean
  habits: Habit[]
  goals: Goal[]
  settings: Settings
  entries: Entry[]
  entryMap: EntryMap
  saveHabit: (h: Habit) => void
  deleteHabit: (id: string) => void
  setValue: (habitId: string, date: string, value: number) => void
  saveGoal: (g: Goal) => void
  deleteGoal: (id: string) => void
  updateSettings: (s: Partial<Settings>) => void
  exportData: () => Backup
  importData: (b: Backup) => Promise<void>
}

const Ctx = createContext<Store>(null!)
export const useStore = () => useContext(Ctx)

export const uid = () => crypto.randomUUID()
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

const seedHabits = (): Habit[] => {
  const createdAt = todayKey()
  const mk = (name: string, type: Habit['type'], unit: string, target: number): Habit => ({
    id: uid(), name, type, unit, target, days: ALL_DAYS, active: true, createdAt,
  })
  return [
    mk('Drink water', 'quantity', 'litres', 3),
    mk('No junk food', 'boolean', '', 1),
    mk('Exercise', 'quantity', 'min', 30),
    mk('Walking', 'quantity', 'steps', 8000),
    mk('Sleep', 'quantity', 'hours', 8),
    mk('Read', 'quantity', 'min', 20),
  ]
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [habits, setHabits] = useState<Habit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    loadAll().then(async d => {
      let hs = d.habits
      if (!hs.length && !localStorage.getItem('habitzen-seeded')) {
        hs = seedHabits()
        const db = await dbPromise
        await Promise.all(hs.map(h => db.put('habits', h)))
      }
      localStorage.setItem('habitzen-seeded', '1')
      setHabits(hs)
      setGoals(d.goals)
      setEntries(d.entries)
      setSettings(d.settings)
      setReady(true)
    })
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
  }, [settings.theme])

  const entryMap = useMemo(() => buildEntryMap(entries), [entries])

  const saveHabit = useCallback((h: Habit) => {
    setHabits(p => (p.some(x => x.id === h.id) ? p.map(x => (x.id === h.id ? h : x)) : [...p, h]))
    dbPromise.then(db => db.put('habits', h))
  }, [])

  const deleteHabit = useCallback((id: string) => {
    setHabits(p => p.filter(h => h.id !== id))
    setEntries(p => p.filter(e => e.habitId !== id))
    dbPromise.then(async db => {
      await db.delete('habits', id)
      const tx = db.transaction('entries', 'readwrite')
      for (const k of await tx.store.getAllKeys()) if (k.startsWith(id + '|')) tx.store.delete(k)
      await tx.done
    })
  }, [])

  const setValue = useCallback((habitId: string, date: string, value: number) => {
    const key = entryKey(habitId, date)
    const v = Math.max(0, value)
    setEntries(p => {
      const rest = p.filter(e => e.key !== key)
      return v > 0 ? [...rest, { key, habitId, date, value: v }] : rest
    })
    dbPromise.then(async db => {
      if (v > 0) await db.put('entries', { key, habitId, date, value: v })
      else await db.delete('entries', key)
    })
  }, [])

  const saveGoal = useCallback((g: Goal) => {
    setGoals(p => (p.some(x => x.id === g.id) ? p.map(x => (x.id === g.id ? g : x)) : [...p, g]))
    dbPromise.then(db => db.put('goals', g))
  }, [])

  const deleteGoal = useCallback((id: string) => {
    setGoals(p => p.filter(g => g.id !== id))
    dbPromise.then(db => db.delete('goals', id))
  }, [])

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings(p => {
      const next = { ...p, ...s }
      dbPromise.then(db => db.put('meta', next, 'settings'))
      return next
    })
  }, [])

  const exportData = useCallback((): Backup => ({ version: 1, habits, entries, goals, settings }), [habits, entries, goals, settings])

  const importData = useCallback(async (b: Backup) => {
    if (b?.version !== 1 || !Array.isArray(b.habits) || !Array.isArray(b.entries) || !Array.isArray(b.goals))
      throw new Error('Not a valid HabitZen backup')
    const s = { ...defaultSettings, ...b.settings }
    await replaceAll({ habits: b.habits, entries: b.entries, goals: b.goals, settings: s })
    setHabits(b.habits)
    setEntries(b.entries)
    setGoals(b.goals)
    setSettings(s)
  }, [])

  const value: Store = {
    ready, habits, goals, settings, entries, entryMap,
    saveHabit, deleteHabit, setValue, saveGoal, deleteGoal, updateSettings, exportData, importData,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
