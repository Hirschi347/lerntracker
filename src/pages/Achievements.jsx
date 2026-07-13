import { useEffect, useState } from 'react'

export default function Achievements() {
  const [achievements, setAchievements] = useState([])

  useEffect(() => {
    window.api?.getAchievements().then(setAchievements)
  }, [])

  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>🏆 Achievements</h1>
        <div className="text-sm font-bold" style={{ color: '#fde68a' }}>{unlocked.length} / {achievements.length} freigeschaltet</div>
      </div>

      {/* Progress */}
      <div className="card p-4">
        <div className="flex justify-between text-xs mb-2 font-semibold" style={{ color: '#c084fc' }}>
          <span>Fortschritt</span>
          <span>{Math.round((unlocked.length / Math.max(achievements.length, 1)) * 100)}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(253,230,138,0.15)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(unlocked.length / Math.max(achievements.length, 1)) * 100}%`, background: 'linear-gradient(90deg, #fde68a, #f9a8d4)', boxShadow: '0 0 10px rgba(253,230,138,0.5)' }}
          />
        </div>
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <div className="font-bold mb-3 flex items-center gap-2" style={{ color: '#fde68a' }}>
            <span>✨</span> Freigeschaltet ({unlocked.length})
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {unlocked.map((a) => (
              <AchievementCard key={a.id} achievement={a} unlocked />
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <div className="font-bold mb-3 flex items-center gap-2 opacity-60" style={{ color: '#c084fc' }}>
            <span>🔒</span> Noch zu erreichen ({locked.length})
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {locked.map((a) => (
              <AchievementCard key={a.id} achievement={a} unlocked={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AchievementCard({ achievement, unlocked }) {
  return (
    <div
      className="card p-4 flex flex-col items-center text-center transition-all"
      style={unlocked
        ? { borderColor: 'rgba(253,230,138,0.4)', background: 'rgba(253,230,138,0.05)', boxShadow: '0 0 15px rgba(253,230,138,0.15)' }
        : { opacity: 0.45, filter: 'grayscale(0.4)' }
      }
    >
      <div className="text-4xl mb-2" style={{ filter: unlocked ? 'none' : 'grayscale(1)' }}>
        {unlocked ? achievement.icon : '🔒'}
      </div>
      <div className="font-black text-sm mb-1" style={{ color: unlocked ? '#fde68a' : '#f0e6ff' }}>
        {achievement.title}
      </div>
      <div className="text-xs opacity-70" style={{ color: '#c084fc' }}>{achievement.desc}</div>
      {unlocked && achievement.unlocked_at && (
        <div className="text-xs opacity-40 mt-2" style={{ color: '#fde68a' }}>
          {new Date(achievement.unlocked_at).toLocaleDateString('de-DE')}
        </div>
      )}
    </div>
  )
}
