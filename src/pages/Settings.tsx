import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useStore } from '../lib/store'
import { todayKey } from '../lib/dates'

export default function Settings() {
  const { settings, updateSettings, exportData, importData } = useStore()
  const file = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const toggleReminder = async (on: boolean) => {
    if (on && 'Notification' in window && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission()
      if (p !== 'granted') return setMsg('Notification permission was denied in the browser.')
    }
    if (on && !('Notification' in window)) return setMsg('Notifications are not supported on this browser.')
    setMsg('')
    updateSettings({ reminderEnabled: on })
  }

  const doExport = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportData(), null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `habitzen-backup-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doImport = async (f: File) => {
    if (!confirm('Importing replaces all current data. Continue?')) return
    try {
      await importData(JSON.parse(await f.text()))
      setMsg('Backup restored.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Import failed.')
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="card flex items-center justify-between">
        <span>Dark mode</span>
        <input type="checkbox" className="size-5" checked={settings.theme === 'dark'} onChange={e => updateSettings({ theme: e.target.checked ? 'dark' : 'light' })} />
      </section>

      <section className="card space-y-3">
        <label className="flex items-center justify-between">
          <span>Daily reminder</span>
          <input type="checkbox" className="size-5" checked={settings.reminderEnabled} onChange={e => toggleReminder(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Remind me at</span>
          <input type="time" className="input !w-auto" value={settings.reminderTime} onChange={e => updateSettings({ reminderTime: e.target.value })} />
        </label>
        <p className="text-xs text-slate-500">Reminders fire while HabitZen is open or installed and running in the background.</p>
      </section>

      <section className="card space-y-3">
        <h2 className="font-semibold">Backup</h2>
        <div className="flex gap-2">
          <button className="btn" onClick={doExport}><Download size={16} /> Export</button>
          <button className="btn-ghost" onClick={() => file.current?.click()}><Upload size={16} /> Import</button>
          <input ref={file} type="file" accept="application/json" hidden
            onChange={e => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = '' }} />
        </div>
        <p className="text-xs text-slate-500">All data is stored on this device only.</p>
      </section>

      {msg && <p className="text-sm text-teal-700 dark:text-teal-400">{msg}</p>}
    </div>
  )
}
