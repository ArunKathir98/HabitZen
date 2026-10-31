import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { uid, useStore } from '../lib/store'
import { todayKey } from '../lib/dates'
import type { Goal, GoalPeriod } from '../lib/types'

const PERIODS: GoalPeriod[] = ['weekly', 'monthly', 'long-term']

export default function Goals() {
  const { goals, saveGoal, deleteGoal } = useStore()
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [period, setPeriod] = useState<GoalPeriod>('weekly')
  const [targetDate, setTargetDate] = useState('')

  const add = () => {
    if (!title.trim()) return
    saveGoal({ id: uid(), title: title.trim(), period, targetDate, progress: 0, done: false })
    setTitle(''); setTargetDate(''); setAdding(false)
  }

  const section = (done: boolean) => goals.filter(g => g.done === done)
  const row = (g: Goal) => {
    const overdue = !g.done && g.targetDate && g.targetDate < todayKey()
    return (
      <div key={g.id} className="card space-y-2">
        <div className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 size-5" checked={g.done} aria-label="Completed"
            onChange={e => saveGoal({ ...g, done: e.target.checked, progress: e.target.checked ? 100 : g.progress })} />
          <div className="flex-1">
            <div className={`font-medium ${g.done ? 'text-slate-400 line-through' : ''}`}>{g.title}</div>
            <div className="text-xs text-slate-500">
              {g.period}{g.targetDate && ` · by ${g.targetDate}`}{overdue && <span className="text-red-600"> · overdue</span>}
            </div>
          </div>
          <button aria-label="Delete" className="btn-ghost !px-2 text-red-600" onClick={() => deleteGoal(g.id)}><Trash2 size={16} /></button>
        </div>
        <div className="flex items-center gap-3">
          <input type="range" min="0" max="100" step="5" className="flex-1 accent-teal-600" value={g.progress} disabled={g.done}
            aria-label="Progress" onChange={e => saveGoal({ ...g, progress: Number(e.target.value) })} />
          <span className="w-10 text-right text-sm">{g.progress}%</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Goals</h1>
        <button className="btn" onClick={() => setAdding(a => !a)}><Plus size={16} /> Add</button>
      </header>

      {adding && (
        <form className="card space-y-3" onSubmit={e => { e.preventDefault(); add() }}>
          <input className="input" autoFocus placeholder="Goal, e.g. Run a 5K" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <select className="input" value={period} onChange={e => setPeriod(e.target.value as GoalPeriod)}>
              {PERIODS.map(p => <option key={p}>{p}</option>)}
            </select>
            <input className="input" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} aria-label="Target date" />
          </div>
          <button className="btn" disabled={!title.trim()}>Save goal</button>
        </form>
      )}

      {PERIODS.map(p => {
        const items = section(false).filter(g => g.period === p)
        return items.length > 0 && (
          <section key={p} className="space-y-2">
            <h2 className="text-sm font-semibold capitalize text-slate-500">{p}</h2>
            {items.map(row)}
          </section>
        )
      })}
      {goals.length === 0 && !adding && <p className="card text-center text-sm text-slate-500">No goals yet. Set one to aim for.</p>}
      {section(true).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-500">Completed</h2>
          {section(true).map(row)}
        </section>
      )}
    </div>
  )
}
