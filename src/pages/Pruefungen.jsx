import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr); target.setHours(0,0,0,0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

function UrgencyBadge({ days }) {
  if (days < 0) return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(252,165,165,0.2)', color: '#fca5a5' }}>Vorbei</span>
  if (days === 0) return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(252,165,165,0.3)', color: '#fca5a5' }}>Heute! 😱</span>
  if (days <= 3) return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(252,165,165,0.15)', color: '#fca5a5' }}>in {days} Tag{days !== 1 ? 'en' : ''} 🔥</span>
  if (days <= 7) return <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,230,138,0.15)', color: '#fde68a' }}>in {days} Tagen ⚠️</span>
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(147,197,253,0.15)', color: '#93c5fd' }}>in {days} Tagen</span>
}

export default function Pruefungen() {
  const [exams, setExams] = useState([])
  const [subjects, setSubjects] = useState([])
  const [expanded, setExpanded] = useState({})
  const [topics, setTopics] = useState({})
  const [newTopic, setNewTopic] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', subject_id: '', notes: '' })

  const load = async () => {
    const [e, s] = await Promise.all([window.api?.getExams(), window.api?.getSubjects()])
    setExams(e || [])
    setSubjects(s || [])
  }

  useEffect(() => { load() }, [])

  const toggleExpand = async (id) => {
    const isOpen = expanded[id]
    setExpanded(prev => ({ ...prev, [id]: !isOpen }))
    if (!isOpen && !topics[id]) {
      const t = await window.api?.getExamTopics(id)
      setTopics(prev => ({ ...prev, [id]: t || [] }))
    }
  }

  const createExam = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.date) return
    await window.api?.createExam({ ...form, subject_id: form.subject_id || null })
    setForm({ title: '', date: '', subject_id: '', notes: '' })
    setShowForm(false)
    load()
  }

  const deleteExam = async (id) => {
    await window.api?.deleteExam(id)
    load()
  }

  const addTopic = async (examId) => {
    const title = newTopic[examId]?.trim()
    if (!title) return
    await window.api?.createExamTopic({ exam_id: examId, title })
    setNewTopic(prev => ({ ...prev, [examId]: '' }))
    const t = await window.api?.getExamTopics(examId)
    setTopics(prev => ({ ...prev, [examId]: t || [] }))
    load()
  }

  const toggleTopic = async (examId, topicId) => {
    await window.api?.toggleExamTopic(topicId)
    const t = await window.api?.getExamTopics(examId)
    setTopics(prev => ({ ...prev, [examId]: t || [] }))
    load()
  }

  const deleteTopic = async (examId, topicId) => {
    await window.api?.deleteExamTopic(topicId)
    const t = await window.api?.getExamTopics(examId)
    setTopics(prev => ({ ...prev, [examId]: t || [] }))
    load()
  }

  const upcoming = exams.filter(e => daysUntil(e.date) >= 0)
  const past = exams.filter(e => daysUntil(e.date) < 0)

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>📋 Prüfungen</h1>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Neue Prüfung
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="card p-4 space-y-3" style={{ borderColor: 'rgba(249,168,212,0.4)', animation: 'slideIn 0.2s ease-out' }}>
          <form onSubmit={createExam} className="space-y-3">
            <input className="input-galaxy text-base font-semibold" placeholder="Prüfungsname, z.B. Mathe Abitur..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#f9a8d4' }}>Datum *</label>
                <input type="date" className="input-galaxy" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: '#f9a8d4' }}>Fach</label>
                <select className="input-galaxy" value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">Kein Fach</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="btn-secondary text-sm" onClick={() => setShowForm(false)}>Abbrechen</button>
              <button type="submit" className="btn-primary text-sm">Prüfung anlegen ✨</button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming exams */}
      {upcoming.length === 0 && !showForm ? (
        <div className="card p-12 text-center opacity-40">
          <div className="text-5xl mb-3">📋</div>
          <div className="font-bold" style={{ color: '#c084fc' }}>Keine Prüfungen eingetragen</div>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map(exam => <ExamCard key={exam.id} exam={exam} expanded={expanded[exam.id]} topics={topics[exam.id]} newTopicVal={newTopic[exam.id] || ''} onToggleExpand={() => toggleExpand(exam.id)} onDelete={() => deleteExam(exam.id)} onAddTopic={() => addTopic(exam.id)} onToggleTopic={(tid) => toggleTopic(exam.id, tid)} onDeleteTopic={(tid) => deleteTopic(exam.id, tid)} onNewTopicChange={(val) => setNewTopic(p => ({ ...p, [exam.id]: val }))} />)}
        </div>
      )}

      {/* Past exams */}
      {past.length > 0 && (
        <div>
          <div className="text-sm font-bold opacity-40 mb-2" style={{ color: '#c084fc' }}>Vergangene Prüfungen</div>
          <div className="space-y-2 opacity-50">
            {past.map(exam => <ExamCard key={exam.id} exam={exam} expanded={expanded[exam.id]} topics={topics[exam.id]} newTopicVal={newTopic[exam.id] || ''} onToggleExpand={() => toggleExpand(exam.id)} onDelete={() => deleteExam(exam.id)} onAddTopic={() => addTopic(exam.id)} onToggleTopic={(tid) => toggleTopic(exam.id, tid)} onDeleteTopic={(tid) => deleteTopic(exam.id, tid)} onNewTopicChange={(val) => setNewTopic(p => ({ ...p, [exam.id]: val }))} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function ExamCard({ exam, expanded, topics, newTopicVal, onToggleExpand, onDelete, onAddTopic, onToggleTopic, onDeleteTopic, onNewTopicChange }) {
  const days = daysUntil(exam.date)
  const done = exam.topics_done || 0
  const total = exam.topic_count || 0
  const progress = total > 0 ? (done / total) * 100 : 0
  const color = exam.subject_color || '#c084fc'
  const isUrgent = days >= 0 && days <= 3

  return (
    <div className="card overflow-hidden group" style={{ borderColor: isUrgent ? 'rgba(252,165,165,0.4)' : `${color}30` }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="text-2xl">{exam.subject_emoji || '📋'}</div>
        <div className="flex-1 min-w-0">
          <div className="font-black text-base" style={{ color: '#f0e6ff' }}>{exam.title}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {exam.subject_name && <span className="text-xs font-semibold" style={{ color }}>{exam.subject_name}</span>}
            <span className="text-xs opacity-60" style={{ color: '#f0e6ff' }}>{new Date(exam.date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <UrgencyBadge days={days} />
          </div>
          {total > 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1" style={{ color: '#c084fc' }}>
                <span>{done}/{total} Themen</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: progress === 100 ? '#5eead4' : color, boxShadow: `0 0 6px ${color}80` }} />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={15} style={{ color: '#fca5a5' }} />
          </button>
          {expanded ? <ChevronUp size={18} style={{ color: '#c084fc' }} /> : <ChevronDown size={18} style={{ color: '#c084fc' }} />}
        </div>
      </div>

      {/* Expanded topics */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: 'rgba(192,132,252,0.12)', background: 'rgba(0,0,0,0.15)' }}>
          {(!topics || topics.length === 0) && (
            <div className="text-xs opacity-40 py-1" style={{ color: '#c084fc' }}>Noch keine Themen — füge welche hinzu!</div>
          )}
          {topics?.map(topic => (
            <div key={topic.id} className="flex items-center gap-2.5 group/topic py-0.5">
              <button
                onClick={() => onToggleTopic(topic.id)}
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                style={topic.completed
                  ? { background: '#5eead4', boxShadow: '0 0 8px rgba(94,234,212,0.5)' }
                  : { border: `1.5px solid ${color}60`, background: 'transparent' }
                }
              >
                {topic.completed && <span className="text-xs text-black font-black">✓</span>}
              </button>
              <span className={`flex-1 text-sm ${topic.completed ? 'line-through opacity-50' : ''}`} style={{ color: '#f0e6ff' }}>
                {topic.title}
              </span>
              <button onClick={() => onDeleteTopic(topic.id)} className="opacity-0 group-hover/topic:opacity-100 transition-opacity">
                <Trash2 size={12} style={{ color: '#fca5a5' }} />
              </button>
            </div>
          ))}

          {/* Add topic input */}
          <div className="flex gap-2 pt-1">
            <input
              className="input-galaxy text-sm flex-1"
              placeholder="Thema hinzufügen..."
              value={newTopicVal}
              onChange={e => onNewTopicChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && onAddTopic()}
            />
            <button onClick={onAddTopic} className="btn-primary text-sm px-3">
              <Plus size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
