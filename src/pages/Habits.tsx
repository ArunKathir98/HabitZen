import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { uid, useStore } from '../lib/store'
import { todayKey } from '../lib/dates'
import type { Habit } from '../lib/types'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

const blank = (): Habit => ({
  id: uid(), name: '', type: 'boolean', unit: '', target: 1, days: ALL_DAYS, active: true, createdAt: todayKey(),
})

const describe = (h: Habit) => {
  const what = h.type === 'boolean' ? 'Yes / No' : `${h.target.toLocaleString()} ${h.unit}`
  const when = h.days.length === 7 ? 'daily' : h.days.map(d => DAY_LABELS[d]).join(' ')
  return `${what} · ${when}`
}

export default function Habits() {
  const { habits, saveHabit, deleteHabit } = useStore()
  const [editing, setEditing] = useState<Habit | null>(null)

  if (editing) return <Editor habit={editing} onCancel={() => setEditing(null)} onSave={h => { saveHabit(h); setEditing(null) }} />

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Habits</h1>
        <button className="btn" onClick={() => setEditing(blank())}><Plus size={16} /> Add</button>
      </header>
      {habits.length === 0 && <p className="card text-center text-sm text-slate-500">No habits yet. Add your first one.</p>}
      {habits.map(h => (
        <div key={h.id} className={`card flex items-center gap-3 ${h.active ? '' : 'opacity-50'}`}>
          <div className="flex-1">
            <div className="font-medium">{h.name}</div>
            <div className="text-xs text-slate-500">{describe(h)}</div>
          </div>
          <label className="flex items-center gap-1 text-xs text-slate-500">
            <input type="checkbox" checked={h.active} onChange={e => saveHabit({ ...h, active: e.target.checked })} /> On
          </label>
          <button aria-label="Edit" className="btn-ghost !px-2" onClick={() => setEditing(h)}><Pencil size={16} /></button>
          <button
            aria-label="Delete"
            className="btn-ghost !px-2 text-red-600"
            onClick={() => confirm(`Delete "${h.name}" and its history?`) && deleteHabit(h.id)}
          ><Trash2 size={16} /></button>
        </div>
      ))}
    </div>
  )
}

function Editor({ habit, onSave, onCancel }: { habit: Habit; onSave: (h: Habit) => void; onCancel: () => void }) {
  const [h, setH] = useState(habit)
  const set = (p: Partial<Habit>) => setH(prev => ({ ...prev, ...p }))
  const toggleDay = (d: number) =>
    set({ days: h.days.includes(d) ? h.days.filter(x => x !== d) : [...h.days, d].sort() })
  const valid = h.name.trim() && h.days.length > 0 && (h.type === 'boolean' || h.target > 0)

  return (
    <form
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault()
        onSave({ ...h, name: h.name.trim(), target: h.type === 'boolean' ? 1 : h.target })
      }}
    >
      <h1 className="text-xl font-semibold">{habit.name ? 'Edit habit' : 'New habit'}</h1>
      <label className="block space-y-1 text-sm">Name
        <input className="input" autoFocus value={h.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. Drink water" />
      </label>
      <div className="space-y-1 text-sm">Tracking
        <div className="flex gap-2">
          {(['boolean', 'quantity'] as const).map(t => (
            <button type="button" key={t} onClick={() => set({ type: t })}
              className={h.type === t ? 'btn flex-1' : 'btn-ghost flex-1'}>
              {t === 'boolean' ? 'Yes / No' : 'Quantity'}
            </button>
          ))}
        </div>
      </div>
      {h.type === 'quantity' && (
        <div className="flex gap-3">
          <label className="block flex-1 space-y-1 text-sm">Daily target
            <input className="input" type="number" min="0" step="any" value={h.target} onChange={e => set({ target: Number(e.target.value) })} />
          </label>
          <label className="block flex-1 space-y-1 text-sm">Unit
            <input className="input" value={h.unit} onChange={e => set({ unit: e.target.value })} placeholder="litres, min, steps…" />
          </label>
        </div>
      )}
      <div className="space-y-1 text-sm">Repeat on
        <div className="flex gap-1.5">
          {DAY_LABELS.map((l, d) => (
            <button type="button" key={d} onClick={() => toggleDay(d)}
              className={`size-10 rounded-full text-sm ${h.days.includes(d) ? 'bg-teal-600 text-white' : 'border border-slate-300 dark:border-slate-700'}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="btn" disabled={!valid}>Save</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
