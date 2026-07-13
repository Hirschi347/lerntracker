import { useMemo } from 'react'

export default function Stars() {
  const stars = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 5 + 2,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.6 + 0.1,
    }))
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Nebula blobs */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 20% 50%, rgba(120,0,200,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(80,0,160,0.06) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(200,0,120,0.05) 0%, transparent 50%)',
      }} />
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `twinkle-star ${s.duration}s ${s.delay}s ease-in-out infinite`,
          }}
        />
      ))}
      {/* Larger glowing stars */}
      {Array.from({ length: 8 }, (_, i) => (
        <div
          key={`big-${i}`}
          className="absolute rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: 3,
            height: 3,
            background: ['#c084fc','#f9a8d4','#93c5fd','#5eead4'][i % 4],
            boxShadow: `0 0 6px 2px ${['rgba(192,132,252,0.6)','rgba(249,168,212,0.6)','rgba(147,197,253,0.6)','rgba(94,234,212,0.6)'][i % 4]}`,
            animation: `twinkle-star ${3 + i}s ${i * 0.5}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )
}
