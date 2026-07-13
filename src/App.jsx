import { HashRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Stars from './components/Stars'
import AchievementToast from './components/AchievementToast'
import TitleBar from './components/TitleBar'
import MiniPomodoro from './components/MiniPomodoro'
import { PomodoroProvider } from './hooks/usePomodoroStore'
import Dashboard from './pages/Dashboard'
import Pomodoro from './pages/Pomodoro'
import Aufgaben from './pages/Aufgaben'
import Karteikarten from './pages/Karteikarten'
import Scanner from './pages/Scanner'
import Statistiken from './pages/Statistiken'
import Notizen from './pages/Notizen'
import Kalender from './pages/Kalender'
import Achievements from './pages/Achievements'
import Faecher from './pages/Faecher'
import Ziele from './pages/Ziele'
import Pruefungen from './pages/Pruefungen'

export default function App() {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((achievements) => {
    const newToasts = achievements.map((a) => ({ ...a, key: Date.now() + Math.random() }))
    setToasts((prev) => [...prev, ...newToasts])
  }, [])

  useEffect(() => {
    if (window.api?.onAchievementUnlocked) {
      window.api.onAchievementUnlocked(addToast)
      return () => window.api.removeAchievementListener?.()
    }
  }, [addToast])

  const removeToast = useCallback((key) => setToasts((prev) => prev.filter((t) => t.key !== key)), [])

  return (
    <HashRouter>
      <PomodoroProvider>
        <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0a0015' }}>
          <Stars />
          <TitleBar />
          <div className="flex flex-1 overflow-hidden relative z-10">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pomodoro" element={<Pomodoro />} />
                <Route path="/aufgaben" element={<Aufgaben />} />
                <Route path="/karteikarten" element={<Karteikarten />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/statistiken" element={<Statistiken />} />
                <Route path="/notizen" element={<Notizen />} />
                <Route path="/kalender" element={<Kalender />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/faecher" element={<Faecher />} />
                <Route path="/ziele" element={<Ziele />} />
                <Route path="/pruefungen" element={<Pruefungen />} />
              </Routes>
            </main>
          </div>

          {/* Floating mini player */}
          <MiniPomodoro />

          {/* Achievement toasts */}
          <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
            {toasts.map((t) => (
              <AchievementToast key={t.key} achievement={t} onClose={() => removeToast(t.key)} />
            ))}
          </div>
        </div>
      </PomodoroProvider>
    </HashRouter>
  )
}
