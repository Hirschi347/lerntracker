import { useState, useEffect } from 'react'
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react'

const PRIORITY_CONFIG = {
  3: { label: 'Hoch', color: '#fca5a5', dot: '🔴' },
  2: { label: 'Mittel', color: '#fde68a', dot: '🟡' },
  1: { label: 'Niedrig', color: '#5eead4', dot: '🟢' },
}

export default function Aufgaben() {
  const [tasks, setTasks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filter, setFilter] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('')
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', due_date: '', priority: 1, xp_reward: 10 })
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    const filters = {}
    if (subjectFilter) filters.subject_id = subjectFilter
    if (filter === 'open') filters.completed = false
    if (filter === 'done') filters.completed = true
    const [t, s] = await Promise.all([window.api?.getTasks(filters), window.api?.getSubjects()])
    setTasks(t || [])
    setSubjects(s || [])
  }

  useEffect(() => { load() }, [filter, subjectFilter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    await window.api?.createTask({ ...form, subject_id: form.subject_id || null })
    setForm({ title: '', description: '', subject_id: '', due_date: '', priority: 1, xp_reward: 10 })
    setShowForm(false)
    load()
  }

  const complete = async (id) => {
    await window.api?.completeTask(id)
    load()
  }

  const deleteTask = async (id) => {
    await window.api?.deleteTask(id)
    load()
  }

  const grouped = tasks.reduce((acc, t) => {
    const key = t.subject_name || 'Ohne Fach'
    if (!acc[key]) acc[key] = { color: t.subject_color, emoji: t.subject_emoji, tasks: [] }
    acc[key].tasks.push(t)
    return acc
  }, {})

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>✅ Aufgaben</h1>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Neue Aufgabe
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-4 space-y-3" style={{ borderColor: 'rgba(192,132,252,0.4)', animation: 'slideIn 0.2s ease-out' }}>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input className="input-galaxy" placeholder="Aufgabe..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
            <textarea className="input-galaxy resize-none" rows={2} placeholder="Beschreibung (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#c084fc' }}>Fach</label>
                <select className="input-galaxy text-sm" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">Kein Fach</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#c084fc' }}>Fällig am</label>
                <input type="date" className="input-galaxy text-sm" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#c084fc' }}>Priorität</label>
                <select className="input-galaxy text-sm" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}>
                  <option value={3}>🔴 Hoch</option>
                  <option value={2}>🟡 Mittel</option>
                  <option value={1}>🟢 Niedrig</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#c084fc' }}>XP-Belohnung</label>
                <select className="input-galaxy text-sm" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) })}>
                  <option value={5}>5 XP</option>
                  <option value={10}>10 XP</option>
                  <option value={20}>20 XP</option>
                  <option value={30}>30 XP</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-secondary text-sm" onClick={() => setShowForm(false)}>Abbrechen</button>
              <button type="submit" className="btn-primary text-sm">Hinzufügen ✨</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[['all', 'Alle'], ['open', 'Offen'], ['done', 'Erledigt']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${filter === v ? 'glow' : 'opacity-60 hover:opacity-80'}`}
            style={filter === v ? { background: 'rgba(192,132,252,0.2)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.4)' } : { background: 'rgba(255,255,255,0.05)', color: '#f0e6ff', border: '1px solid rgba(255,255,255,0.1)' }}
          >{l}</button>
        ))}
        <select className="input-galaxy text-sm" style={{ width: 'auto' }} value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
          <option value="">Alle Fächer</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
        </select>
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="card p-8 text-center opacity-50" style={{ color: '#c084fc' }}>
          <div className="text-4xl mb-2">🌙</div>
          <div className="font-semibold">Keine Aufgaben gefunden</div>
        </div>
      ) : (
        Object.entries(grouped).map(([group, { color, emoji, tasks: gtasks }]) => (
          <div key={group}>
            <div className="flex items-center gap-2 mb-2 px-1">
              <span>{emoji || '📚'}</span>
              <span className="font-bold text-sm" style={{ color: color || '#c084fc' }}>{group}</span>
              <span className="text-xs opacity-50" style={{ color: '#f0e6ff' }}>({gtasks.length})</span>
            </div>
            <div className="space-y-1.5">
              {gtasks.map((task) => (
                <TaskRow key={task.id} task={task} onComplete={complete} onDelete={deleteTask} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function TaskRow({ task, onComplete, onDelete }) {
  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG[1]
  const isOverdue = task.due_date && !task.completed && task.due_date < new Date().toISOString().split('T')[0]

  return (
    <div className={`card p-3 flex items-start gap-3 group transition-all ${task.completed ? 'opacity-50' : ''}`}>
      <button onClick={() => !task.completed && onComplete(task.id)} className="mt-0.5 flex-shrink-0">
        {task.completed
          ? <CheckCircle2 size={20} style={{ color: '#5eead4' }} />
          : <Circle size={20} style={{ color: p.color }} className="hover:scale-110 transition-transform" />
        }
      </button>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm ${task.completed ? 'line-through' : ''}`} style={{ color: '#f0e6ff' }}>{task.title}</div>
        {task.description && <div className="text-xs opacity-60 mt-0.5 truncate" style={{ color: '#c084fc' }}>{task.description}</div>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs font-semibold" style={{ color: p.color }}>{p.dot} {p.label}</span>
          {task.due_date && (
            <span className="text-xs" style={{ color: isOverdue ? '#fca5a5' : '#93c5fd' }}>
              📅 {new Date(task.due_date).toLocaleDateString('de-DE')}
              {isOverdue && ' (Überfällig!)'}
            </span>
          )}
          <span className="text-xs" style={{ color: '#fde68a' }}>+{task.xp_reward} XP</span>
        </div>
      </div>
      <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
        <Trash2 size={16} style={{ color: '#fca5a5' }} />
      </button>
    </div>
  )
}
