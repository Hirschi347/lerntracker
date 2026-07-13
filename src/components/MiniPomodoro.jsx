import { useNavigate, useLocation } from 'react-router-dom'
import { usePomodoroStore } from '../hooks/usePomodoroStore'

export default function MiniPomodoro() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const store     = usePomodoroStore()

  if (!store) return null

  const { MODES, mode, secondsLeft, running, sessions, toggle, reset, totalRef } = store

  // Only show when NOT on the pomodoro page and timer has been touched
  const onPomodoroPage = location.pathname === '/pomodoro'
  const hasStarted     = running || secondsLeft < totalRef.current
  if (onPomodoroPage || !hasStarted) return null

  const mins   = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs   = String(secondsLeft % 60).padStart(2, '0')
  const total  = totalRef.current || MODES[mode].duration
  const pct    = ((total - secondsLeft) / total) * 100
  const { color, label } = MODES[mode]
  const circumference = 2 * Math.PI * 20

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
      style={{
        transform: 'translateX(-50%)',
        background: 'rgba(12, 0, 28, 0.92)',
        backdropFilter: 'blur(16px)',
        border: `1px solid ${color}55`,
        boxShadow: `0 0 24px ${color}33, 0 4px 24px rgba(0,0,0,0.5)`,
        cursor: 'pointer',
        userSelect: 'none',
      }}
      onClick={() => navigate('/pomodoro')}
    >
      {/* Ring */}
      <div className="relative flex-shrink-0" style={{ width: 48, height: 48 }}>
        <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={24} cy={24} r={20} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
          <circle
            cx={24} cy={24} r={20} fill="none"
            stroke={color} strokeWidth={4} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (pct / 100) * circumference}
            style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-black text-xs" style={{ color, fontSize: 10 }}>{mins}:{secs}</span>
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="text-xs font-bold" style={{ color }}>{label}</div>
        <div className="text-xs opacity-50" style={{ color: '#f0e6ff' }}>
          {sessions} Session{sessions !== 1 ? 's' : ''} · Tippen zum Öffnen
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={toggle}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110"
          style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
        >
          {running ? '⏸' : '▶'}
        </button>
        <button
          onClick={reset}
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#f0e6ff' }}
        >↺</button>
      </div>
    </div>
  )
}
