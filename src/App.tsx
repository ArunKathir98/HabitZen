import { useEffect, useState } from 'react'
import { BarChart3, Home, ListChecks, Settings as Cog, Target } from 'lucide-react'
import { useStore } from './lib/store'
import Dashboard from './pages/Dashboard'
import Habits from './pages/Habits'
import Goals from './pages/Goals'
import Analytics from './pages/Analytics'
import SettingsPage from './pages/Settings'
import { dayStats } from './lib/progress'
import { todayKey } from './lib/dates'

const tabs = [
  { id: 'dashboard', label: 'Today', icon: Home, el: Dashboard },
  { id: 'habits', label: 'Habits', icon: ListChecks, el: Habits },
  { id: 'goals', label: 'Goals', icon: Target, el: Goals },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, el: Analytics },
  { id: 'settings', label: 'Settings', icon: Cog, el: SettingsPage },
]

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const { ready, settings, habits, entryMap } = useStore()

  // Gentle reminder: fires once per day at the chosen time while the app is open and the day isn't complete.
  useEffect(() => {
    if (!settings.reminderEnabled || !('Notification' in window)) return
    const id = setInterval(() => {
      const now = new Date()
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const sentKey = 'habitzen-reminded'
      if (hhmm !== settings.reminderTime || localStorage.getItem(sentKey) === todayKey()) return
      const s = dayStats(habits, entryMap, todayKey())
      if (Notification.permission === 'granted' && s.scheduled > s.done) {
        new Notification('HabitZen', { body: `${s.scheduled - s.done} habit(s) left today. You've got this!` })
        localStorage.setItem(sentKey, todayKey())
      }
    }, 20000)
    return () => clearInterval(id)
  }, [settings.reminderEnabled, settings.reminderTime, habits, entryMap])

  if (!ready) return <div className="p-8 text-center text-slate-500">Loading…</div>
  const Page = tabs.find(t => t.id === tab)!.el

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <main className="flex-1 p-4 pb-24">
        <Page />
      </main>
      <nav className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <ul className="mx-auto flex max-w-2xl">
          {tabs.map(({ id, label, icon: Icon }) => (
            <li key={id} className="flex-1">
              <button
                onClick={() => setTab(id)}
                className={`flex w-full flex-col items-center gap-0.5 py-2 text-xs ${tab === id ? 'text-teal-600' : 'text-slate-500'}`}
              >
                <Icon size={22} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
