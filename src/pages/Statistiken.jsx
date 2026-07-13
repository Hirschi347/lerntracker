import { useEffect, useState } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { usePomodoroStore } from '../hooks/usePomodoroStore'

const COLORS = ['#c084fc', '#f9a8d4', '#93c5fd', '#5eead4', '#fde68a', '#fca5a5']

export default function Statistiken() {
  const [data, setData] = useState(null)
  const [sessions30, setSessions30] = useState([])
  const [range, setRange] = useState(30)
  const [heatmap, setHeatmap] = useState([])
  const { sessionCount } = usePomodoroStore() || {}

  useEffect(() => {
    const load = async () => {
      const [d, sessions, hm] = await Promise.all([
        window.api?.getDashboardStats(),
        window.api?.getPomodoroSessions(range),
        window.api?.getHeatmapData(),
      ])
      setData(d)
      setSessions30(sessions || [])
      setHeatmap(hm || [])
    }
    load()
  }, [range, sessionCount])

  if (!data) return <div className="flex items-center justify-center h-48 opacity-50" style={{ color: '#c084fc' }}>Lade Statistiken...</div>

  const { stats, tasksCompleted, totalTasks, totalDecks, unlockedAchievements } = data

  // Process sessions for chart
  const byDate = sessions30.reduce((acc, s) => {
    acc[s.date] = (acc[s.date] || 0) + s.duration_minutes
    return acc
  }, {})
  const dailyData = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, minutes]) => ({ date: date.slice(5), minutes }))

  // By subject
  const bySubject = sessions30.reduce((acc, s) => {
    if (!s.subject_name) return acc
    if (!acc[s.subject_name]) acc[s.subject_name] = { name: s.subject_name, minutes: 0, color: s.subject_color || '#c084fc' }
    acc[s.subject_name].minutes += s.duration_minutes
    return acc
  }, {})
  const subjectData = Object.values(bySubject).sort((a, b) => b.minutes - a.minutes)
  const totalMinutes = sessions30.reduce((s, p) => s + p.duration_minutes, 0)

  const tooltipStyle = { background: '#1a0040', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 8, color: '#f0e6ff', fontSize: 12 }

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>📊 Statistiken</h1>
        <div className="flex gap-2">
          {[7, 14, 30].map((d) => (
            <button key={d} onClick={() => setRange(d)}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${range === d ? 'glow' : 'opacity-60'}`}
              style={range === d ? { background: 'rgba(192,132,252,0.2)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.4)' } : { background: 'rgba(255,255,255,0.05)', color: '#f0e6ff', border: '1px solid rgba(255,255,255,0.1)' }}
            >{d} Tage</button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Lernzeit gesamt" value={`${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`} icon="⏱️" color="#93c5fd" />
        <StatBox label="Pomodoros" value={sessions30.length} icon="🍅" color="#f9a8d4" />
        <StatBox label="Aufgaben erledigt" value={`${tasksCompleted}/${totalTasks}`} icon="✅" color="#5eead4" />
        <StatBox label="XP gesamt" value={stats.xp} icon="✨" color="#c084fc" />
      </div>

      {/* Level progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold" style={{ color: '#f0e6ff' }}>⭐ Level {stats.level} Fortschritt</div>
          <div className="text-sm opacity-60" style={{ color: '#c084fc' }}>{stats.currentXP} / {stats.required} XP</div>
        </div>
        <div className="h-4 rounded-full overflow-hidden" style={{ background: 'rgba(192,132,252,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-700 relative"
            style={{ width: `${(stats.currentXP / stats.required) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #c084fc, #f9a8d4)', boxShadow: '0 0 12px rgba(192,132,252,0.6)' }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1 opacity-50" style={{ color: '#c084fc' }}>
          <span>Level {stats.level}</span>
          <span>Level {stats.level + 1}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily study */}
        <div className="card p-4">
          <div className="font-bold mb-3" style={{ color: '#f0e6ff' }}>📈 Tägliche Lernzeit</div>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: '#c084fc', fontSize: 10 }} />
                <YAxis tick={{ fill: '#c084fc', fontSize: 10 }} unit="m" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} Min`, 'Lernzeit']} />
                <Area type="monotone" dataKey="minutes" stroke="#c084fc" strokeWidth={2} fill="url(#grad1)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* By subject pie */}
        <div className="card p-4">
          <div className="font-bold mb-3" style={{ color: '#f0e6ff' }}>📚 Lernzeit nach Fach</div>
          {subjectData.length > 0 ? (
            <div className="flex items-center gap-4">
              <PieChart width={140} height={140}>
                <Pie data={subjectData} dataKey="minutes" cx={65} cy={65} outerRadius={60} innerRadius={30}>
                  {subjectData.map((entry, i) => (
                    <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
              <div className="flex-1 space-y-1.5">
                {subjectData.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color || COLORS[i % COLORS.length] }} />
                    <span className="text-xs truncate" style={{ color: '#f0e6ff' }}>{s.name}</span>
                    <span className="text-xs opacity-60 ml-auto" style={{ color: '#c084fc' }}>{s.minutes}m</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <EmptyChart />}
        </div>

        {/* Weekly bar */}
        <div className="card p-4 md:col-span-2">
          <div className="font-bold mb-3" style={{ color: '#f0e6ff' }}>📊 Sessions pro Tag</div>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={dailyData}>
                <XAxis dataKey="date" tick={{ fill: '#c084fc', fontSize: 10 }} />
                <YAxis tick={{ fill: '#c084fc', fontSize: 10 }} unit="m" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} Min`, 'Lernzeit']} />
                <Bar dataKey="minutes" fill="#c084fc" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>

      {/* Activity Heatmap */}
      <ActivityHeatmap data={heatmap} />

      {/* Streaks & achievements summary */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Aktueller Streak" value={`${stats.streak} 🔥`} icon="" color="#fde68a" />
        <StatBox label="Achievements" value={`${unlockedAchievements}/14`} icon="🏆" color="#fde68a" />
        <StatBox label="Karten-Decks" value={totalDecks} icon="🃏" color="#5eead4" />
      </div>
    </div>
  )
}

function StatBox({ label, value, icon, color }) {
  return (
    <div className="card p-3 text-center">
      {icon && <div className="text-xl mb-1">{icon}</div>}
      <div className="font-black text-xl" style={{ color }}>{value}</div>
      <div className="text-xs opacity-60 mt-0.5" style={{ color: '#f0e6ff' }}>{label}</div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-36 opacity-30" style={{ color: '#c084fc' }}>
      Noch keine Daten
    </div>
  )
}

function ActivityHeatmap({ data }) {
  const map = {}
  data.forEach(r => { map[r.date] = r.minutes })

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(today); start.setDate(start.getDate() - 364)
  const firstDow = (start.getDay() + 6) % 7  // 0=Mon

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let i = 0; i <= 364; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i)
    cells.push(d.toISOString().split('T')[0])
  }
  const lastDow = (today.getDay() + 6) % 7
  for (let i = lastDow + 1; i < 7; i++) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const getColor = (mins) => {
    if (!mins) return 'rgba(192,132,252,0.07)'
    if (mins < 30) return 'rgba(192,132,252,0.28)'
    if (mins < 60) return 'rgba(192,132,252,0.52)'
    if (mins < 90) return 'rgba(192,132,252,0.76)'
    return '#c084fc'
  }

  const activeDays = data.length
  const totalMins = data.reduce((s, r) => s + r.minutes, 0)

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="font-bold" style={{ color: '#f0e6ff' }}>🔥 Lernaktivität (1 Jahr)</div>
        <div className="text-xs opacity-50" style={{ color: '#c084fc' }}>
          {activeDays} aktive Tage · {Math.floor(totalMins / 60)}h {totalMins % 60}m gesamt
        </div>
      </div>

      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5 flex-shrink-0">
            {week.map((day, di) => (
              <div
                key={di}
                title={day ? `${day}: ${map[day] || 0} Min` : ''}
                style={{
                  width: 11, height: 11, borderRadius: 2,
                  background: day ? getColor(map[day] || 0) : 'transparent',
                  boxShadow: day && (map[day] || 0) >= 90 ? '0 0 4px rgba(192,132,252,0.6)' : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-xs opacity-40" style={{ color: '#c084fc' }}>Wenig</span>
        {['rgba(192,132,252,0.07)', 'rgba(192,132,252,0.28)', 'rgba(192,132,252,0.52)', 'rgba(192,132,252,0.76)', '#c084fc'].map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: c }} />
        ))}
        <span className="text-xs opacity-40" style={{ color: '#c084fc' }}>Viel</span>
      </div>
    </div>
  )
}
