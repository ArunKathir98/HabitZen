import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../lib/store'
import { dayStats, isDone, isScheduled, streaks } from '../lib/progress'
import { addDays, fromKey, lastNDays, toKey, todayKey } from '../lib/dates'

export default function Analytics() {
  const { habits, entryMap } = useStore()
  const [range, setRange] = useState(7)
  const days = lastNDays(range)
  const { current, longest } = streaks(habits, entryMap)

  const chart = days.map(d => ({ d: fromKey(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), pct: dayStats(habits, entryMap, d).pct ?? 0 }))

  const perHabit = habits.filter(h => h.active).map(h => {
    const sched = days.filter(d => isScheduled(h, d))
    const done = sched.filter(d => isDone(h, entryMap, d)).length
    return { h, sched: sched.length, done, pct: sched.length ? Math.round((done / sched.length) * 100) : null }
  }).filter(x => x.pct !== null).sort((a, b) => b.pct! - a.pct!)

  const missed = perHabit.map(x => ({ ...x, missed: x.sched - x.done })).filter(x => x.missed > 0).sort((a, b) => b.missed - a.missed)
  const scheduledTotal = perHabit.reduce((n, x) => n + x.sched, 0)
  const overall = scheduledTotal ? Math.round((perHabit.reduce((n, x) => n + x.done, 0) / scheduledTotal) * 100) : 0

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="flex gap-1">
          {[7, 30].map(r => (
            <button key={r} onClick={() => setRange(r)} className={range === r ? 'btn !py-1.5' : 'btn-ghost !py-1.5'}>{r === 7 ? 'Week' : 'Month'}</button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-3 gap-3 text-center">
        <Stat v={`${overall}%`} l="Completion" />
        <Stat v={current} l="Current streak" />
        <Stat v={longest} l="Longest streak" />
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold">Daily completion</h2>
        <div className="h-48">
          <ResponsiveContainer>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="d" tick={{ fontSize: 11 }} interval={range === 7 ? 0 : 4} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
              <Tooltip formatter={v => `${v}%`} />
              <Bar dataKey="pct" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Habit completion</h2>
        {perHabit.length === 0 && <p className="text-sm text-slate-500">No data yet.</p>}
        {perHabit.map(({ h, pct, done, sched }) => (
          <div key={h.id}>
            <div className="flex justify-between text-sm"><span>{h.name}</span><span className="text-slate-500">{done}/{sched} · {pct}%</span></div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full bg-teal-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
        {perHabit.length > 1 && (
          <p className="text-xs text-slate-500">Best: <b>{perHabit[0].h.name}</b>{missed[0] && <> · Most missed: <b>{missed[0].h.name}</b> ({missed[0].missed}×)</>}</p>
        )}
      </section>

      <Calendar />
    </div>
  )
}

const Stat = ({ v, l }: { v: string | number; l: string }) => (
  <div className="card"><div className="text-2xl font-bold">{v}</div><div className="text-xs text-slate-500">{l}</div></div>
)

/** Month heat-map: darker = more of the day's habits completed. */
function Calendar() {
  const { habits, entryMap } = useStore()
  const [offset, setOffset] = useState(0)
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, i) => toKey(new Date(first.getFullYear(), first.getMonth(), i + 1)))]
  const today = todayKey()

  return (
    <section className="card">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold">{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <div className="flex gap-1">
          <button className="btn-ghost !py-1" onClick={() => setOffset(o => o - 1)}>‹</button>
          <button className="btn-ghost !py-1" disabled={offset >= 0} onClick={() => setOffset(o => o + 1)}>›</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />
          const p = d > today ? null : dayStats(habits, entryMap, d).pct
          const shade = p == null ? 'bg-slate-100 dark:bg-slate-800/50'
            : p === 0 ? 'bg-slate-200 dark:bg-slate-800'
            : p < 50 ? 'bg-teal-200 text-slate-800' : p < 100 ? 'bg-teal-400 text-slate-900' : 'bg-teal-600 text-white'
          return (
            <div key={i} title={p == null ? d : `${d}: ${p}%`} className={`flex aspect-square items-center justify-center rounded-md text-xs ${shade} ${d === today ? 'ring-2 ring-teal-700' : ''}`}>
              {Number(d.slice(8))}
            </div>
          )
        })}
      </div>
    </section>
  )
}
