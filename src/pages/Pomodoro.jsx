import { useEffect, useState } from 'react'
import { usePomodoroStore } from '../hooks/usePomodoroStore'
import AmbientPlayer from '../components/AmbientPlayer'

export default function Pomodoro() {
  const [subjects, setSubjects] = useState([])
  const store = usePomodoroStore()

  useEffect(() => {
    window.api?.getSubjects().then(setSubjects)
  }, [])

  if (!store) return null

  const {
    MODES, mode, secondsLeft, running, sessions,
    subjectId, setSubjectId,
    customMinutes, setCustomMinutes,
    toggle, reset, switchMode, applyCustom,
    totalRef,
  } = store

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')
  const total = totalRef.current || MODES[mode].duration
  const progress = ((total - secondsLeft) / total) * 100
  const circumference = 2 * Math.PI * 110
  const strokeDashoffset = circumference - (progress / 100) * circumference
  const { color, label } = MODES[mode]

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>🍅 Pomodoro Timer</h1>

      {/* Mode selector */}
      <div className="flex gap-2">
        {Object.entries(MODES).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchMode(key, customMinutes)}
            disabled={running}
            className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${mode === key ? 'glow' : 'opacity-50 hover:opacity-80'}`}
            style={mode === key
              ? { background: 'rgba(255,255,255,0.12)', border: `1px solid ${m.color}`, color: m.color }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0e6ff' }
            }
          >{m.label}</button>
        ))}
      </div>

      {/* Timer circle */}
      <div className="card p-8 flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <svg width={260} height={260} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={130} cy={130} r={110} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
            <circle
              cx={130} cy={130} r={110} fill="none"
              stroke={color} strokeWidth={10} strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease', filter: `drop-shadow(0 0 8px ${color})` }}
            />
          </svg>
          <div className="absolute text-center">
            <div className="font-black" style={{ fontSize: 52, color: '#f0e6ff', lineHeight: 1, textShadow: `0 0 20px ${color}` }}>
              {mins}:{secs}
            </div>
            <div className="text-sm font-semibold mt-1 opacity-70" style={{ color }}>{label}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={toggle}
            className="w-14 h-14 rounded-full font-black text-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: `linear-gradient(135deg, ${color}88, ${color})`, boxShadow: `0 0 20px ${color}55` }}
          >
            {running ? '⏸' : '▶'}
          </button>
          <button
            onClick={reset}
            className="w-14 h-14 rounded-full font-black text-xl flex items-center justify-center transition-all hover:scale-110"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#f0e6ff' }}
          >↺</button>
        </div>

        {/* Session dots */}
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: Math.max(sessions, 4) }).map((_, i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{
              background: i < sessions ? '#f9a8d4' : 'rgba(249,168,212,0.2)',
              boxShadow: i < sessions ? '0 0 6px #f9a8d4' : 'none',
            }} />
          ))}
          <span className="text-xs ml-1 opacity-60" style={{ color: '#f9a8d4' }}>{sessions} Session{sessions !== 1 ? 's' : ''}</span>
        </div>

        {running && (
          <div className="text-xs opacity-50 text-center" style={{ color: '#c084fc' }}>
            Du kannst die Seite wechseln — der Timer läuft weiter ✨
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="card p-4 space-y-3">
        <div className="font-bold text-sm" style={{ color: '#c084fc' }}>⚙️ Einstellungen</div>

        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: '#f0e6ff' }}>Fach</label>
          <select className="input-galaxy text-sm" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">Kein Fach</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
          </select>
        </div>

        <AmbientPlayer />

        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: '#f0e6ff' }}>Eigene Zeit (Minuten)</label>
          <div className="flex gap-2">
            <input
              type="number" min={1} max={120}
              className="input-galaxy text-sm"
              placeholder="z.B. 45"
              value={customMinutes}
              onChange={e => setCustomMinutes(e.target.value)}
              disabled={running}
            />
            <button
              onClick={() => applyCustom(customMinutes)}
              disabled={running}
              className="btn-secondary text-sm whitespace-nowrap"
            >Setzen</button>
          </div>
        </div>
      </div>
    </div>
  )
}
