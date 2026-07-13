import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Save, FileText } from 'lucide-react'
import RichEditor from '../components/RichEditor'

const TEMPLATES = [
  { label: 'Leer', icon: '📄', desc: 'Leere Notiz', content: '' },
  { label: 'Mitschrift', icon: '✏️', desc: 'Unterrichtsstunde', content: '<h2>📖 Thema</h2><p></p><h3>Wichtige Punkte</h3><ul><li><p></p></li><li><p></p></li></ul><h3>Definitionen</h3><p></p><h3>Fragen</h3><ul><li><p></p></li></ul>' },
  { label: 'Zusammenfassung', icon: '📋', desc: 'Kapitel oder Thema', content: '<h1>Zusammenfassung</h1><h2>Hauptthemen</h2><p></p><h2>Schlüsselbegriffe</h2><ul><li><p><strong>Begriff:</strong> Definition</p></li></ul><h2>Wichtige Fakten</h2><ul><li><p></p></li></ul><h2>Fazit</h2><p></p>' },
  { label: 'Prüfung', icon: '📝', desc: 'Prüfungsvorbereitung', content: '<h1>Prüfungsvorbereitung</h1><h2>Themengebiete</h2><ul><li><p></p></li></ul><h2>Formeln &amp; Fakten</h2><p></p><h2>Noch lernen</h2><ul><li><p></p></li></ul><h2>Tipps</h2><p></p>' },
]

export default function Notizen() {
  const [notes,         setNotes]         = useState([])
  const [subjects,      setSubjects]      = useState([])
  const [active,        setActive]        = useState(null)
  const [draft,         setDraft]         = useState({ title: '', content: '', subject_id: '' })
  const [creating,      setCreating]      = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [search,        setSearch]        = useState('')
  const [saved,         setSaved]         = useState(true)
  const saveTimeout = useRef(null)

  const load = async () => {
    const [n, s] = await Promise.all([window.api?.getNotes(), window.api?.getSubjects()])
    setNotes(n || [])
    setSubjects(s || [])
  }

  useEffect(() => { load() }, [])

  const selectNote = (note) => {
    setActive(note)
    setDraft({ title: note.title, content: note.content || '', subject_id: note.subject_id || '' })
    setCreating(false)
    setSaved(true)
  }

  const newNote = () => {
    setActive(null)
    setDraft({ title: '', content: '', subject_id: '' })
    setCreating(true)
    setShowTemplates(true)
    setSaved(false)
  }

  const applyTemplate = (tpl) => {
    setDraft(d => ({ ...d, content: tpl.content }))
    setShowTemplates(false)
  }

  const updateDraft = (field, value) => {
    const next = { ...draft, [field]: value }
    setDraft(next)
    setSaved(false)
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => doSave(next, creating), 1800)
  }

  const doSave = async (data, isCreating) => {
    const d = data || draft
    const create = isCreating !== undefined ? isCreating : creating
    if (!d.title.trim()) return
    if (create) {
      const note = await window.api?.createNote({ title: d.title, content: d.content, subject_id: d.subject_id || null })
      setActive(note)
      setCreating(false)
    } else if (active) {
      await window.api?.updateNote({ id: active.id, title: d.title, content: d.content })
    }
    setSaved(true)
    load()
  }

  useEffect(() => {
    const handler = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); doSave() } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [draft, creating, active])

  const deleteNote = async (id) => {
    await window.api?.deleteNote(id)
    if (active?.id === id) { setActive(null); setCreating(false) }
    load()
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content?.replace(/<[^>]+>/g, '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full" style={{ maxHeight: 'calc(100vh - 120px)' }}>

      {/* ── Notizliste ── */}
      <div className="flex flex-col flex-shrink-0" style={{ width: 220, borderRight: '1px solid rgba(192,132,252,0.12)' }}>
        <div className="p-3 space-y-2" style={{ borderBottom: '1px solid rgba(192,132,252,0.1)' }}>
          <button onClick={newNote} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-all"
            style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.4),rgba(192,132,252,0.2))', border: '1px solid rgba(192,132,252,0.3)', color: '#c084fc' }}>
            <Plus size={15} /> Neue Notiz
          </button>
          <input className="input-galaxy text-sm" placeholder="🔍 Suchen…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 opacity-30 gap-2">
              <FileText size={28} style={{ color: '#c084fc' }} />
              <span className="text-xs" style={{ color: '#c084fc' }}>Keine Notizen</span>
            </div>
          )}
          {filtered.map(note => {
            const isActive = active?.id === note.id
            const plain = note.content?.replace(/<[^>]+>/g, '').trim().slice(0, 55)
            return (
              <button key={note.id} onClick={() => selectNote(note)}
                className="w-full text-left px-3 py-2.5 transition-all relative group"
                style={isActive ? { background: 'rgba(192,132,252,0.12)', borderLeft: '3px solid #c084fc' } : { borderLeft: '3px solid transparent' }}
              >
                {note.subject_color && <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full" style={{ background: note.subject_color }} />}
                <div className="font-bold text-sm truncate pr-4" style={{ color: isActive ? '#c084fc' : '#f0e6ff' }}>{note.title}</div>
                {plain && <div className="text-xs mt-0.5 opacity-40 line-clamp-2" style={{ color: '#f0e6ff', lineHeight: 1.4 }}>{plain}</div>}
                <div className="text-xs mt-1 opacity-30" style={{ color: '#c084fc' }}>
                  {new Date(note.updated_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                </div>
                <button onClick={e => { e.stopPropagation(); deleteNote(note.id) }}
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={12} style={{ color: '#fca5a5' }} />
                </button>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Editor ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {(creating || active) ? (
          <>
            {/* Topbar */}
            <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(192,132,252,0.1)', background: 'rgba(10,0,21,0.6)' }}>
              <input
                className="font-black text-base bg-transparent outline-none flex-1 min-w-0"
                placeholder="Titel…"
                value={draft.title}
                onChange={e => updateDraft('title', e.target.value)}
                style={{ color: '#f0e6ff', border: 'none' }}
              />
              {!saved && <span className="text-xs flex-shrink-0 opacity-50" style={{ color: '#fde68a' }}>● ungespeichert</span>}
              {saved && draft.title && <span className="text-xs flex-shrink-0 opacity-40" style={{ color: '#5eead4' }}>✓</span>}
              <select className="input-galaxy text-xs" style={{ width: 'auto', minWidth: 100, padding: '4px 8px' }}
                value={draft.subject_id} onChange={e => updateDraft('subject_id', e.target.value)}>
                <option value="">Kein Fach</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
              </select>
              <button onClick={() => doSave()} title="Speichern (Ctrl+S)"
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: saved ? 'transparent' : 'rgba(192,132,252,0.2)', color: saved ? 'rgba(192,132,252,0.3)' : '#c084fc' }}>
                <Save size={14} />
              </button>
            </div>

            {/* Template picker or Editor */}
            {showTemplates ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6" style={{ background: 'rgba(8,0,20,0.7)' }}>
                <div className="font-bold text-sm" style={{ color: '#c084fc' }}>✨ Vorlage wählen</div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                  {TEMPLATES.map(t => (
                    <button
                      key={t.label}
                      onClick={() => applyTemplate(t)}
                      className="card p-4 text-left hover:scale-[1.03] transition-transform"
                      style={{ borderColor: 'rgba(192,132,252,0.3)', background: 'rgba(192,132,252,0.06)', cursor: 'pointer' }}
                    >
                      <div className="text-2xl mb-1">{t.icon}</div>
                      <div className="font-bold text-sm" style={{ color: '#f0e6ff' }}>{t.label}</div>
                      <div className="text-xs opacity-60 mt-0.5" style={{ color: '#c084fc' }}>{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <RichEditor
                content={draft.content}
                onChange={v => updateDraft('content', v)}
                placeholder="Schreibe deine Notiz…"
              />
            )}

            <div className="px-4 py-1 text-xs opacity-25 flex-shrink-0" style={{ color: '#c084fc', borderTop: '1px solid rgba(192,132,252,0.08)', background: 'rgba(8,0,20,0.5)' }}>
              Ctrl+S speichern · Auto-Save nach 1,8 Sek.
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-3 opacity-30">
            <FileText size={52} style={{ color: '#c084fc' }} />
            <div className="font-bold" style={{ color: '#c084fc' }}>Notiz auswählen</div>
            <button className="btn-primary opacity-100" onClick={newNote}>+ Neue Notiz</button>
          </div>
        )}
      </div>
    </div>
  )
}
