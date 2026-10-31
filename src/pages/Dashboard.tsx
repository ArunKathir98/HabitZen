import { useState } from 'react'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { useStore } from '../lib/store'
import { dayStats, isScheduled, streaks } from '../lib/progress'
import { addDays, fromKey, todayKey } from '../lib/dates'
import HabitRow from '../components/HabitRow'

export default function Dashboard() {
  const { habits, goals, entryMap } = useStore()
  const [date, setDate] = useState(todayKey())
  const today = todayKey()
  const list = habits.filter(h => isScheduled(h, date))
  const s = dayStats(habits, entryMap, date)
  const { current } = streaks(habits, entryMap)
  const activeGoals = goals.filter(g => !g.done).slice(0, 3)

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{date === today ? "Today's Overview" : 'Past day'}</p>
          <h1 className="text-xl font-semibold">
            {fromKey(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </h1>
        </div>
        <div className="flex gap-1">
          <button aria-label="Previous day" className="btn-ghost !px-2" onClick={() => setDate(addDays(date, -1))}>
            <ChevronLeft size={18} />
          </button>
          <button aria-label="Next day" className="btn-ghost !px-2" disabled={date >= today} onClick={() => setDate(addDays(date, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="card">
          <div className="text-2xl font-bold">{s.done}/{s.scheduled}</div>
          <div className="text-xs text-slate-500">Habits completed</div>
        </div>
        <div className="card">
          <div className="text-2xl font-bold">{s.pct ?? 0}%</div>
          <div className="text-xs text-slate-500">Daily progress</div>
        </div>
        <div className="card">
          <div className="flex items-center justify-center gap-1 text-2xl font-bold">
            <Flame className="text-orange-500" size={22} />{current}
          </div>
          <div className="text-xs text-slate-500">Day streak</div>
        </div>
      </section>

      <section className="space-y-2">
        {list.length === 0 && <p className="card text-center text-sm text-slate-500">No habits scheduled. Add some in the Habits tab.</p>}
        {list.map(h => <HabitRow key={h.id} habit={h} date={date} />)}
      </section>

      {activeGoals.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Goal progress</h2>
          {activeGoals.map(g => (
            <div key={g.id} className="card">
              <div className="flex justify-between text-sm"><span>{g.title}</span><span>{g.progress}%</span></div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-teal-500" style={{ width: `${g.progress}%` }} />
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
