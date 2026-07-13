import { useEffect } from 'react'

export default function AchievementToast({ achievement, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className="achievement-toast glass rounded-2xl p-4 flex items-center gap-3 glow"
      style={{ minWidth: 280, border: '1px solid rgba(253,230,138,0.4)', boxShadow: '0 0 25px rgba(253,230,138,0.3)' }}
    >
      <div className="text-3xl">{achievement.icon}</div>
      <div>
        <div className="text-xs font-bold mb-0.5" style={{ color: '#fde68a' }}>Achievement freigeschaltet! ✨</div>
        <div className="font-black text-sm" style={{ color: '#f0e6ff' }}>{achievement.title}</div>
        <div className="text-xs opacity-70" style={{ color: '#c084fc' }}>{achievement.desc}</div>
      </div>
    </div>
  )
}
