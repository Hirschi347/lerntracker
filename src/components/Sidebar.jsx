import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'

const nav = [
  { to: '/', icon: '🏠', label: 'Dashboard' },
  { to: '/pomodoro', icon: '🍅', label: 'Pomodoro' },
  { to: '/aufgaben', icon: '✅', label: 'Aufgaben' },
  { to: '/pruefungen', icon: '📋', label: 'Prüfungen' },
  { to: '/karteikarten', icon: '🃏', label: 'Karteikarten' },
  { to: '/notizen', icon: '📝', label: 'Notizen' },
  { to: '/scanner', icon: '📸', label: 'Scans' },
  { to: '/kalender', icon: '📅', label: 'Kalender' },
  { to: '/statistiken', icon: '📊', label: 'Statistiken' },
  { to: '/ziele', icon: '🎯', label: 'Ziele' },
  { to: '/achievements', icon: '🏆', label: 'Achievements' },
  { to: '/faecher', icon: '🎨', label: 'Fächer' },
]

function calcLevel(xp) {
  let level = 1, required = 100, totalXP = 0
  while (xp >= totalXP + required) { totalXP += required; level++; required = level * 150 }
  return { level, currentXP: xp - totalXP, required }
}

export default function Sidebar() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (window.api) {
        const s = await window.api.getStats()
        setStats(s)
      }
    }
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  const levelInfo = stats ? calcLevel(stats.xp) : { level: 1, currentXP: 0, required: 100 }
  const progress = (levelInfo.currentXP / levelInfo.required) * 100

  return (
    <aside
      className="flex flex-col w-56 h-full relative z-10 py-3"
      style={{ background: 'rgba(8,0,18,0.85)', borderRight: '1px solid rgba(192,132,252,0.15)', backdropFilter: 'blur(12px)' }}
    >
      {/* Level & XP */}
      <div className="px-4 pb-3 mb-2" style={{ borderBottom: '1px solid rgba(192,132,252,0.12)' }}>
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #c084fc)', boxShadow: '0 0 12px rgba(192,132,252,0.5)' }}
          >
            {levelInfo.level}
          </div>
          <div>
            <div className="font-black text-xs" style={{ color: '#c084fc' }}>Level {levelInfo.level}</div>
            <div className="text-xs opacity-60" style={{ color: '#f0e6ff' }}>{levelInfo.currentXP} / {levelInfo.required} XP</div>
          </div>
        </div>
        {/* XP bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(192,132,252,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7c3aed, #c084fc, #f9a8d4)' }}
          />
        </div>
        {/* Streak */}
        {stats && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-bold" style={{ color: '#fde68a' }}>{stats.streak} Tage Streak</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {nav.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-150 no-drag ${
                isActive
                  ? 'font-bold'
                  : 'opacity-60 hover:opacity-90 hover:bg-white/5'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { background: 'rgba(192,132,252,0.18)', color: '#c084fc', border: '1px solid rgba(192,132,252,0.3)' }
                : { color: '#f0e6ff' }
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            <span className="text-sm font-semibold">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom XP display */}
      <div className="px-4 pt-2 text-center" style={{ borderTop: '1px solid rgba(192,132,252,0.1)' }}>
        <div className="text-xs opacity-50" style={{ color: '#c084fc' }}>✨ {stats?.xp ?? 0} Gesamt-XP</div>
      </div>
    </aside>
  )
}
