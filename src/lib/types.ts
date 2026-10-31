export type HabitType = 'boolean' | 'quantity'

export interface Habit {
  id: string
  name: string
  type: HabitType
  unit: string
  target: number
  /** Weekdays (0=Sun..6=Sat) the habit is scheduled on. All 7 = daily. */
  days: number[]
  active: boolean
  createdAt: string
}

export interface Entry {
  key: string // `${habitId}|${date}`
  habitId: string
  date: string // YYYY-MM-DD (local)
  value: number
}

export type GoalPeriod = 'weekly' | 'monthly' | 'long-term'

export interface Goal {
  id: string
  title: string
  period: GoalPeriod
  targetDate: string
  progress: number // 0-100
  done: boolean
}

export interface Settings {
  theme: 'light' | 'dark'
  reminderEnabled: boolean
  reminderTime: string // HH:mm
}

export interface Backup {
  version: 1
  habits: Habit[]
  entries: Entry[]
  goals: Goal[]
  settings: Settings
}
