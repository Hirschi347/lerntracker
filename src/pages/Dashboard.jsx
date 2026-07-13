import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const LEVEL_TITLES = [
  'Sternen-Anfänger', 'Kosmos-Entdecker', 'Nebel-Reisender', 'Planeten-Forscher',
  'Galaxie-Pilot', 'Supernovaschüler', 'Quantengelehrter', 'Sternenstürmer',
  'Universum-Meister', 'Kosmischer Held',
]

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [nextExam, setNextExam] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    window.api?.getDashboardStats().then(setData)
    window.api?.getExams().then(exams => {
      if (!exams) return
      const today = new Date().toISOString().split('T')[0]
      const upcoming = exams.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))
      setNextExam(upcoming[0] || null)
    })
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-2xl animate-pulse" style={{ color: '#c084fc' }}>✨ Lade Dashboard...</div>
    </div>
  )

  const { stats, tasksCompleted, totalTasks, totalDecks, dueCards, todaySessions, unlockedAchievements, studyBySubject, dailyStudy, weeklyStudy, weeklyNotes } = data
  const progress = (stats.currentXP / stats.required) * 100
  const title = LEVEL_TITLES[Math.min(stats.level - 1, LEVEL_TITLES.length - 1)] || 'Galaktischer Gelehrter'

  const examDays = nextExam ? Math.round((new Date(nextExam.date + 'T00:00:00') - new Date().setHours(0,0,0,0)) / 86400000) : null
  const examUrgent = examDays !== null && examDays <= 3

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black mb-1" style={{ color: '#f0e6ff' }}>
          Hallo! 🌌
        </h1>
        <p className="text-sm opacity-60" style={{ color: '#c084fc' }}>{new Date().toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Level Card */}
      <div className="card glow p-5" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(192,132,252,0.1))', borderColor: 'rgba(192,132,252,0.4)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-black text-2xl" style={{ color: '#f0e6ff' }}>Level {stats.level} · {title}</div>
            <div className="text-sm opacity-70" style={{ color: '#c084fc' }}>{stats.currentXP} / {stats.required} XP bis Level {stats.level + 1}</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-2xl">🔥</div>
              <div className="font-black text-lg" style={{ color: '#fde68a' }}>{stats.streak}</div>
              <div className="text-xs opacity-60" style={{ color: '#fde68a' }}>Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">✨</div>
              <div className="font-black text-lg" style={{ color: '#c084fc' }}>{stats.xp}</div>
              <div className="text-xs opacity-60" style={{ color: '#c084fc' }}>Gesamt-XP</div>
            </div>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(192,132,252,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #c084fc, #f9a8d4)', boxShadow: '0 0 10px rgba(192,132,252,0.6)' }}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon="✅" label="Aufgaben heute" value={`${tasksCompleted}/${totalTasks}`} color="#5eead4" onClick={() => navigate('/aufgaben')} />
        <StatCard icon="🍅" label="Pomodoros heute" value={todaySessions?.c ?? 0} sub={`${todaySessions?.mins ?? 0} Min`} color="#f9a8d4" onClick={() => navigate('/pomodoro')} />
        <StatCard icon="🃏" label="Karten fällig" value={dueCards} color={dueCards > 0 ? '#fde68a' : '#5eead4'} onClick={() => navigate('/karteikarten')} />
        <StatCard icon="🏆" label="Achievements" value={`${unlockedAchievements}/14`} color="#c084fc" onClick={() => navigate('/achievements')} />
      </div>

      {/* Weekly summary + next exam */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="font-bold mb-3 flex items-center gap-2" style={{ color: '#f0e6ff' }}><span>📅</span> Diese Woche</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-black text-lg" style={{ color: '#93c5fd' }}>
                {weeklyStudy.mins >= 60 ? `${Math.floor(weeklyStudy.mins / 60)}h ${weeklyStudy.mins % 60}m` : `${weeklyStudy.mins}m`}
              </div>
              <div className="text-xs opacity-60 mt-0.5" style={{ color: '#f0e6ff' }}>Lernzeit</div>
            </div>
            <div>
              <div className="font-black text-lg" style={{ color: '#f9a8d4' }}>{weeklyStudy.sessions}</div>
              <div className="text-xs opacity-60 mt-0.5" style={{ color: '#f0e6ff' }}>Pomodoros</div>
            </div>
            <div>
              <div className="font-black text-lg" style={{ color: '#5eead4' }}>{weeklyNotes}</div>
              <div className="text-xs opacity-60 mt-0.5" style={{ color: '#f0e6ff' }}>Notizen</div>
            </div>
          </div>
        </div>

        <div
          className={`card p-4 ${nextExam ? 'cursor-pointer hover:scale-[1.01] transition-transform' : 'opacity-50'}`}
          style={{ borderColor: examUrgent ? 'rgba(252,165,165,0.4)' : nextExam ? 'rgba(249,168,212,0.3)' : undefined }}
          onClick={nextExam ? () => navigate('/pruefungen') : undefined}
        >
          <div className="font-bold mb-2 flex items-center gap-2" style={{ color: '#f0e6ff' }}><span>📋</span> Nächste Prüfung</div>
          {nextExam ? (
            <>
              <div className="font-black truncate" style={{ color: examUrgent ? '#fca5a5' : '#f0e6ff' }}>{nextExam.subject_emoji || '📋'} {nextExam.title}</div>
              <div className="text-sm mt-1 font-semibold" style={{ color: examUrgent ? '#fca5a5' : '#c084fc' }}>
                {examDays === 0 ? 'Heute! 😱' : examDays === 1 ? 'Morgen! 🔥' : `In ${examDays} Tagen`}
              </div>
            </>
          ) : (
            <div className="text-sm" style={{ color: '#c084fc' }}>Keine Prüfungen geplant</div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily study chart */}
        <div className="card p-4">
          <div className="font-bold mb-3 flex items-center gap-2" style={{ color: '#f0e6ff' }}>
            <span>📊</span> Lernzeit (14 Tage)
          </div>
          {dailyStudy.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={dailyStudy}>
                <defs>
                  <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#c084fc', fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fill: '#c084fc', fontSize: 10 }} unit="m" />
                <Tooltip
                  contentStyle={{ background: '#1a0040', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 8, color: '#f0e6ff', fontSize: 12 }}
                  formatter={(v) => [`${v} Min`, 'Lernzeit']}
                />
                <Area type="monotone" dataKey="minutes" stroke="#c084fc" strokeWidth={2} fill="url(#studyGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 opacity-40" style={{ color: '#c084fc' }}>Noch keine Daten</div>
          )}
        </div>

        {/* Study by subject */}
        <div className="card p-4">
          <div className="font-bold mb-3 flex items-center gap-2" style={{ color: '#f0e6ff' }}>
            <span>📚</span> Fächer diese Woche
          </div>
          {studyBySubject.length > 0 ? (
            <div className="space-y-2">
              {studyBySubject.map((s, i) => {
                const max = studyBySubject[0].minutes
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: '#f0e6ff' }}>
                      <span>{s.name}</span>
                      <span className="opacity-60">{s.minutes} Min</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full" style={{ width: `${(s.minutes / max) * 100}%`, background: s.color || '#c084fc' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 opacity-40" style={{ color: '#c084fc' }}>Starte einen Pomodoro mit Fach!</div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card p-4">
        <div className="font-bold mb-3" style={{ color: '#f0e6ff' }}>🚀 Schnellstart</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: '🍅 Pomodoro starten', to: '/pomodoro' },
            { label: '🃏 Karten lernen', to: '/karteikarten' },
            { label: '✅ Aufgabe hinzufügen', to: '/aufgaben' },
            { label: '📝 Notiz schreiben', to: '/notizen' },
            { label: '📸 Scan hochladen', to: '/scanner' },
          ].map(({ label, to }) => (
            <button key={to} className="btn-secondary text-sm" onClick={() => navigate(to)}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card text-left w-full hover:scale-[1.02] active:scale-[0.98] transition-transform"
      style={{ cursor: 'pointer' }}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="font-black text-xl" style={{ color }}>{value}</div>
      {sub && <div className="text-xs opacity-60 mb-0.5" style={{ color }}>{sub}</div>}
      <div className="text-xs opacity-60" style={{ color: '#f0e6ff' }}>{label}</div>
    </button>
  )
}
