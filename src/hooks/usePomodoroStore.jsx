import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

export const MODES = {
  work:  { label: '🍅 Fokus',       duration: 25 * 60, color: '#f9a8d4' },
  short: { label: '☕ Kurze Pause', duration: 5  * 60, color: '#5eead4' },
  long:  { label: '🌙 Lange Pause', duration: 15 * 60, color: '#93c5fd' },
}

function playChime(ctx) {
  if (!ctx) return
  try {
    if (ctx.state === 'suspended') ctx.resume()
    ;[523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.22
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.35, t + 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
      osc.start(t)
      osc.stop(t + 1.1)
    })
  } catch (_) {}
}

const Ctx = createContext(null)

export function PomodoroProvider({ children }) {
  const [mode,         setModeState]  = useState('work')
  const [secondsLeft,  setSeconds]    = useState(MODES.work.duration)
  const [running,      setRunning]    = useState(false)
  const [sessions,     setSessions]   = useState(0)
  const [sessionCount, setSessionCount] = useState(0)   // increments to trigger re-fetches
  const [subjectId,    setSubjectId]  = useState('')
  const [customMinutes, setCustom]   = useState('')

  const intervalRef  = useRef(null)
  const totalRef     = useRef(MODES.work.duration)
  const audioCtxRef  = useRef(null)
  // Refs so the interval callback always sees fresh values
  const modeRef      = useRef(mode)
  const subjectIdRef = useRef(subjectId)
  const finishedRef  = useRef(false)

  useEffect(() => { modeRef.current = mode; subjectIdRef.current = subjectId }, [mode, subjectId])

  // Detect timer reaching 0 and handle completion OUTSIDE the state updater
  useEffect(() => {
    if (!finishedRef.current) return
    finishedRef.current = false

    setRunning(false)
    clearInterval(intervalRef.current)

    playChime(audioCtxRef.current)

    if (modeRef.current === 'work') {
      const mins = Math.round(totalRef.current / 60)
      const sid  = subjectIdRef.current || null
      window.api?.savePomodoro({ duration_minutes: mins, subject_id: sid })
      window.api?.autoUpdateGoals({ duration_minutes: mins, subject_id: sid })
      setSessions(s => s + 1)
      setSessionCount(c => c + 1)
      try { new Notification('✨ Pomodoro geschafft!', { body: `${mins} Minuten Fokus! +${Math.max(1, mins)} XP 🌙` }) } catch (_) {}
    } else {
      try { new Notification('🍅 Pause vorbei!', { body: 'Zurück in den Fokus-Modus! ✨' }) } catch (_) {}
    }
  }, [secondsLeft])

  const tick = useCallback(() => {
    setSeconds(prev => {
      if (prev <= 1) {
        finishedRef.current = true   // signal — effect handles the rest
        return 0
      }
      return prev - 1
    })
  }, [])

  useEffect(() => {
    if (running) intervalRef.current = setInterval(tick, 1000)
    else         clearInterval(intervalRef.current)
    return () => clearInterval(intervalRef.current)
  }, [running, tick])

  const switchMode = useCallback((m, customMins) => {
    if (running) return
    const duration = customMins && m === 'work'
      ? parseInt(customMins) * 60
      : MODES[m].duration
    setModeState(m)
    setSeconds(duration)
    totalRef.current = duration
  }, [running])

  const toggle = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    setRunning(r => !r)
  }, [])

  const reset = useCallback(() => {
    setRunning(false)
    clearInterval(intervalRef.current)
    const duration = customMinutes && modeRef.current === 'work'
      ? parseInt(customMinutes) * 60
      : MODES[modeRef.current].duration
    setSeconds(duration)
    totalRef.current = duration
  }, [customMinutes])

  const applyCustom = useCallback((mins) => {
    if (running) return
    const m = Math.max(1, Math.min(120, parseInt(mins) || 25))
    setCustom(String(m))
    setSeconds(m * 60)
    totalRef.current = m * 60
  }, [running])

  return (
    <Ctx.Provider value={{
      MODES, mode, secondsLeft, running, sessions, sessionCount,
      subjectId, setSubjectId,
      customMinutes, setCustomMinutes: setCustom,
      toggle, reset, switchMode, applyCustom,
      totalRef,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const usePomodoroStore = () => useContext(Ctx)
