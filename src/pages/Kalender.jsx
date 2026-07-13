import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export default function Kalender() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ title: '', subject_id: '', description: '' })
  const [showForm, setShowForm] = useState(false)

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  const load = async () => {
    const [e, s] = await Promise.all([window.api?.getEvents(monthStr), window.api?.getSubjects()])
    setEvents(e || [])
    setSubjects(s || [])
  }

  useEffect(() => { load() }, [monthStr])

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  const getDaysInMonth = () => {
    const first = new Date(year, month, 1).getDay()
    const offset = (first === 0 ? 6 : first - 1)
    const days = new Date(year, month + 1, 0).getDate()
    return { offset, days }
  }

  const { offset, days } = getDaysInMonth()

  const addEvent = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !selected) return
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(selected).padStart(2, '0')}`
    await window.api?.createEvent({ title: form.title, date, subject_id: form.subject_id || null, description: form.description })
    setForm({ title: '', subject_id: '', description: '' })
    setShowForm(false)
    load()
  }

  const deleteEvent = async (id) => {
    await window.api?.deleteEvent(id)
    load()
  }

  const getEventsForDay = (day) => {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter((e) => e.date === date)
  }

  const isToday = (day) => today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
  const selectedDate = selected ? `${year}-${String(month + 1).padStart(2, '0')}-${String(selected).padStart(2, '0')}` : null
  const selectedEvents = selected ? getEventsForDay(selected) : []

  return (
    <div className="max-w-4xl space-y-4">
      <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>📅 Kalender</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="md:col-span-2 card p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: '#c084fc' }}>
              <ChevronLeft size={18} />
            </button>
            <div className="font-black text-lg" style={{ color: '#f0e6ff' }}>{MONTHS[month]} {year}</div>
            <button onClick={nextMonth} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors" style={{ color: '#c084fc' }}>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-bold py-1 opacity-50" style={{ color: '#c084fc' }}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
              const dayEvents = getEventsForDay(day)
              const isSel = selected === day
              return (
                <button
                  key={day}
                  onClick={() => { setSelected(day); setShowForm(false) }}
                  className="relative rounded-lg py-1.5 flex flex-col items-center transition-all hover:bg-white/10"
                  style={isSel ? { background: 'rgba(192,132,252,0.25)', border: '1px solid rgba(192,132,252,0.5)' } : isToday(day) ? { background: 'rgba(249,168,212,0.15)', border: '1px solid rgba(249,168,212,0.3)' } : {}}
                >
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isSel ? '#c084fc' : isToday(day) ? '#f9a8d4' : '#f0e6ff' }}
                  >{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((ev, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: ev.subject_color || '#c084fc' }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-3">
          {selected ? (
            <>
              <div className="card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm" style={{ color: '#f0e6ff' }}>
                    {selected}. {MONTHS[month]}
                  </div>
                  <button className="btn-primary p-1.5 rounded-lg" onClick={() => setShowForm(!showForm)}>
                    <Plus size={14} />
                  </button>
                </div>

                {showForm && (
                  <form onSubmit={addEvent} className="space-y-2 mb-3 p-2 rounded-lg" style={{ background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.2)' }}>
                    <input className="input-galaxy text-sm" placeholder="Termin..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required autoFocus />
                    <select className="input-galaxy text-sm" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                      <option value="">Kein Fach</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                    </select>
                    <input className="input-galaxy text-sm" placeholder="Notiz..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    <div className="flex gap-1.5">
                      <button type="submit" className="btn-primary text-xs flex-1">Speichern</button>
                      <button type="button" className="btn-secondary text-xs" onClick={() => setShowForm(false)}>✕</button>
                    </div>
                  </form>
                )}

                {selectedEvents.length === 0 ? (
                  <div className="text-xs opacity-40 text-center py-3" style={{ color: '#c084fc' }}>Keine Termine</div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedEvents.map((ev) => (
                      <div key={ev.id} className="flex items-start gap-2 group p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: ev.subject_color || '#c084fc' }} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs" style={{ color: '#f0e6ff' }}>{ev.title}</div>
                          {ev.subject_name && <div className="text-xs opacity-50" style={{ color: '#c084fc' }}>{ev.subject_name}</div>}
                          {ev.description && <div className="text-xs opacity-40" style={{ color: '#f0e6ff' }}>{ev.description}</div>}
                        </div>
                        <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={12} style={{ color: '#fca5a5' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="card p-6 text-center opacity-40">
              <div className="text-3xl mb-2">📅</div>
              <div className="text-sm" style={{ color: '#c084fc' }}>Tag auswählen</div>
            </div>
          )}

          {/* Upcoming events */}
          <div className="card p-3">
            <div className="font-bold text-sm mb-2" style={{ color: '#f0e6ff' }}>📌 Alle Termine</div>
            {events.length === 0 ? (
              <div className="text-xs opacity-40 text-center py-2" style={{ color: '#c084fc' }}>Keine Termine diesen Monat</div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {events.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-2 text-xs p-1.5 rounded-lg hover:bg-white/5 group">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ev.subject_color || '#c084fc' }} />
                    <div className="flex-1 min-w-0">
                      <span style={{ color: '#f0e6ff' }}>{ev.date.slice(8)}. </span>
                      <span style={{ color: '#f0e6ff' }} className="font-semibold">{ev.title}</span>
                    </div>
                    <button onClick={() => deleteEvent(ev.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={10} style={{ color: '#fca5a5' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
