import { useState, useEffect } from 'react'
import { Trash2, Plus } from 'lucide-react'

const COLORS = ['#c084fc', '#f9a8d4', '#93c5fd', '#5eead4', '#fde68a', '#fca5a5', '#a78bfa', '#6ee7b7']
const EMOJIS = ['📚', '🔬', '🧮', '🌍', '🎨', '🎵', '💻', '📖', '⚗️', '🧠', '📐', '🏛️', '🌿', '✏️', '🔭', '📜']

export default function Faecher() {
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ name: '', color: '#c084fc', emoji: '📚' })
  const [showForm, setShowForm] = useState(false)

  const load = async () => {
    const s = await window.api?.getSubjects()
    setSubjects(s || [])
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    await window.api?.createSubject(form)
    setForm({ name: '', color: '#c084fc', emoji: '📚' })
    setShowForm(false)
    load()
  }

  const deleteSubject = async (id) => {
    await window.api?.deleteSubject(id)
    load()
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>🎨 Fächer</h1>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Neues Fach
        </button>
      </div>

      {showForm && (
        <div className="card p-4 space-y-3" style={{ borderColor: 'rgba(192,132,252,0.4)', animation: 'slideIn 0.2s ease-out' }}>
          <form onSubmit={create} className="space-y-3">
            <input className="input-galaxy" placeholder="Fachname..." value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />

            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: '#c084fc' }}>Emoji</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((em) => (
                  <button
                    key={em} type="button"
                    onClick={() => setForm({ ...form, emoji: em })}
                    className="w-9 h-9 rounded-xl text-lg transition-all hover:scale-110"
                    style={form.emoji === em ? { background: 'rgba(192,132,252,0.3)', border: '1px solid rgba(192,132,252,0.5)' } : { background: 'rgba(255,255,255,0.05)' }}
                  >{em}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold block mb-2" style={{ color: '#c084fc' }}>Farbe</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c} type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className="w-8 h-8 rounded-full transition-all hover:scale-110"
                    style={{ background: c, boxShadow: form.color === c ? `0 0 10px ${c}` : 'none', border: form.color === c ? '2px solid white' : '2px solid transparent' }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: `${form.color}15`, border: `1px solid ${form.color}40` }}>
              <span className="text-2xl">{form.emoji}</span>
              <span className="font-bold" style={{ color: form.color }}>{form.name || 'Vorschau'}</span>
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-secondary text-sm" onClick={() => setShowForm(false)}>Abbrechen</button>
              <button type="submit" className="btn-primary text-sm">Fach erstellen ✨</button>
            </div>
          </form>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="card p-12 text-center opacity-40">
          <div className="text-5xl mb-3">📚</div>
          <div className="font-bold" style={{ color: '#c084fc' }}>Noch keine Fächer</div>
          <div className="text-sm mt-1" style={{ color: '#c084fc' }}>Erstelle dein erstes Fach!</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="card p-4 flex items-center gap-3 group hover:scale-[1.02] transition-transform"
              style={{ borderColor: `${s.color}40`, background: `${s.color}08` }}
            >
              <span className="text-3xl">{s.emoji}</span>
              <div className="flex-1">
                <div className="font-bold" style={{ color: s.color }}>{s.name}</div>
                <div className="text-xs opacity-40 mt-0.5" style={{ color: '#f0e6ff' }}>
                  {new Date(s.created_at).toLocaleDateString('de-DE')}
                </div>
              </div>
              <button
                onClick={() => deleteSubject(s.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} style={{ color: '#fca5a5' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
