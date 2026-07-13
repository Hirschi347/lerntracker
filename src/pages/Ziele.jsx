import { useState, useEffect } from 'react'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import { usePomodoroStore } from '../hooks/usePomodoroStore'

export default function Ziele() {
  const [goals, setGoals] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ title: '', target_value: 30, unit: 'Minuten', period: 'täglich', subject_id: '' })
  const [showForm, setShowForm] = useState(false)
  const [addProgress, setAddProgress] = useState({})
  const { sessionCount } = usePomodoroStore() || {}

  const load = async () => {
    const [g, s] = await Promise.all([window.api?.getGoals(), window.api?.getSubjects()])
    setGoals(g || [])
    setSubjects(s || [])
  }

  useEffect(() => { load() }, [sessionCount])

  const create = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    await window.api?.createGoal({ ...form, subject_id: form.subject_id || null })
    setForm({ title: '', target_value: 30, unit: 'Minuten', period: 'täglich', subject_id: '' })
    setShowForm(false)
    load()
  }

  const updateProgress = async (id) => {
    const val = parseInt(addProgress[id]) || 0
    if (!val) return
    await window.api?.updateGoalProgress({ id, value: val })
    setAddProgress((p) => ({ ...p, [id]: '' }))
    load()
  }

  const deleteGoal = async (id) => {
    await window.api?.deleteGoal(id)
    load()
  }

  const active = goals.filter((g) => !g.completed)
  const completed = goals.filter((g) => g.completed)

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>🎯 Ziele</h1>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Neues Ziel
        </button>
      </div>

      <div className="card p-3 flex items-center gap-2 text-sm" style={{ borderColor: 'rgba(94,234,212,0.2)', background: 'rgba(94,234,212,0.04)' }}>
        <span>⚡</span>
        <span style={{ color: '#5eead4' }}>Ziele mit Einheit <strong>Minuten</strong> oder <strong>Pomodoros</strong> werden automatisch vom Timer befüllt — passend zum gewählten Fach.</span>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3" style={{ borderColor: 'rgba(94,234,212,0.4)', animation: 'slideIn 0.2s ease-out' }}>
          <form onSubmit={create} className="space-y-3">
            <input className="input-galaxy" placeholder="Ziel beschreibung..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5eead4' }}>Zielwert</label>
                <input type="number" min={1} className="input-galaxy text-sm" value={form.target_value} onChange={(e) => setForm({ ...form, target_value: parseInt(e.target.value) || 1 })} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5eead4' }}>Einheit</label>
                <select className="input-galaxy text-sm" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  <option>Minuten</option>
                  <option>Aufgaben</option>
                  <option>Seiten</option>
                  <option>Karten</option>
                  <option>Pomodoros</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#5eead4' }}>Zeitraum</label>
                <select className="input-galaxy text-sm" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>
                  <option>täglich</option>
                  <option>wöchentlich</option>
                  <option>monatlich</option>
                  <option>gesamt</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: '#5eead4' }}>Fach (optional)</label>
              <select className="input-galaxy text-sm" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                <option value="">Kein Fach</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-secondary text-sm" onClick={() => setShowForm(false)}>Abbrechen</button>
              <button type="submit" className="btn-primary text-sm">Ziel setzen 🎯</button>
            </div>
          </form>
        </div>
      )}

      {/* Active goals */}
      {active.length === 0 && !showForm && (
        <div className="card p-10 text-center opacity-40">
          <div className="text-4xl mb-2">🎯</div>
          <div className="font-bold" style={{ color: '#c084fc' }}>Noch keine Ziele gesetzt</div>
        </div>
      )}

      {active.map((goal) => {
        const progress = Math.min((goal.current_value / goal.target_value) * 100, 100)
        return (
          <div key={goal.id} className="card p-4 space-y-3 group">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold" style={{ color: '#f0e6ff' }}>{goal.title}</div>
                <div className="text-xs mt-0.5 opacity-60" style={{ color: '#5eead4' }}>
                  {goal.period} · {goal.subject_name || 'Allgemein'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="font-black text-lg" style={{ color: '#5eead4' }}>{goal.current_value}</div>
                  <div className="text-xs opacity-60" style={{ color: '#5eead4' }}>/ {goal.target_value} {goal.unit}</div>
                </div>
                <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                  <Trash2 size={15} style={{ color: '#fca5a5' }} />
                </button>
              </div>
            </div>

            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(94,234,212,0.15)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #0d9488, #5eead4)', boxShadow: '0 0 8px rgba(94,234,212,0.5)' }}
              />
            </div>
            <div className="text-xs opacity-50 text-right" style={{ color: '#5eead4' }}>{Math.round(progress)}%</div>

            {/* Add progress */}
            <div className="flex gap-2">
              <input
                type="number" min={1}
                className="input-galaxy text-sm flex-1"
                placeholder={`Fortschritt hinzufügen (${goal.unit})`}
                value={addProgress[goal.id] || ''}
                onChange={(e) => setAddProgress((p) => ({ ...p, [goal.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && updateProgress(goal.id)}
              />
              <button onClick={() => updateProgress(goal.id)} className="btn-primary text-sm flex items-center gap-1">
                <TrendingUp size={14} /> +
              </button>
            </div>
          </div>
        )
      })}

      {/* Completed goals */}
      {completed.length > 0 && (
        <div>
          <div className="font-bold text-sm mb-2 opacity-60 flex items-center gap-2" style={{ color: '#fde68a' }}>
            <span>✅</span> Erreicht ({completed.length})
          </div>
          <div className="space-y-2">
            {completed.map((goal) => (
              <div key={goal.id} className="card p-3 flex items-center gap-3 opacity-60 group">
                <div className="text-xl">🏆</div>
                <div className="flex-1">
                  <div className="font-semibold text-sm line-through" style={{ color: '#f0e6ff' }}>{goal.title}</div>
                  <div className="text-xs" style={{ color: '#fde68a' }}>{goal.target_value} {goal.unit} {goal.period} erreicht!</div>
                </div>
                <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} style={{ color: '#fca5a5' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
