import { Check, Minus, Plus } from 'lucide-react'
import type { Habit } from '../lib/types'
import { useStore } from '../lib/store'
import { entryKey, habitFraction, isDone } from '../lib/progress'

/** Step size for the +/- buttons, scaled to the habit's target. */
const stepFor = (target: number) => (target >= 1000 ? 500 : target >= 100 ? 10 : target >= 20 ? 5 : target >= 5 ? 1 : 0.5)

export default function HabitRow({ habit, date }: { habit: Habit; date: string }) {
  const { entryMap, setValue } = useStore()
  const value = entryMap.get(entryKey(habit.id, date)) ?? 0
  const done = isDone(habit, entryMap, date)
  const pct = habitFraction(habit, entryMap, date) * 100

  if (habit.type === 'boolean') {
    return (
      <button
        onClick={() => setValue(habit.id, date, done ? 0 : 1)}
        className="card flex w-full items-center gap-3 text-left"
      >
        <span className={`flex size-8 items-center justify-center rounded-full border-2 ${done ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}>
          {done && <Check size={18} />}
        </span>
        <span className="flex-1">
          <span className={`block font-medium ${done ? 'text-slate-400 line-through' : ''}`}>{habit.name}</span>
          <span className="text-xs text-slate-500">Daily target</span>
        </span>
      </button>
    )
  }

  const step = stepFor(habit.target)
  return (
    <div className="card">
      <div className="flex items-center gap-3">
        <button
          aria-label={`Mark ${habit.name} complete`}
          onClick={() => setValue(habit.id, date, done ? 0 : habit.target)}
          className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}
        >
          {done && <Check size={18} />}
        </button>
        <div className="flex-1">
          <div className={`font-medium ${done ? 'text-slate-400 line-through' : ''}`}>{habit.name}</div>
          <div className="text-xs text-slate-500">
            {value} / {habit.target.toLocaleString()} {habit.unit}
          </div>
        </div>
        <button aria-label="Decrease" className="btn-ghost !px-2" onClick={() => setValue(habit.id, date, value - step)}>
          <Minus size={16} />
        </button>
        <button aria-label="Increase" className="btn-ghost !px-2" onClick={() => setValue(habit.id, date, value + step)}>
          <Plus size={16} />
        </button>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-teal-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
