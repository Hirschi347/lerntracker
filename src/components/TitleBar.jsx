import { Minus, Square, X } from 'lucide-react'

export default function TitleBar() {
  return (
    <div className="drag-region flex items-center justify-between px-4 py-2 z-50 relative" style={{ background: 'rgba(10,0,21,0.9)', borderBottom: '1px solid rgba(192,132,252,0.15)', height: 40 }}>
      <div className="flex items-center gap-2 no-drag">
        <span className="text-lg">🌌</span>
        <span className="font-black text-sm" style={{ color: '#c084fc' }}>Lerntracker</span>
      </div>
      <div className="no-drag flex gap-1">
        <button onClick={() => window.api?.minimize()} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 text-purple-300">
          <Minus size={12} />
        </button>
        <button onClick={() => window.api?.maximize()} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 text-purple-300">
          <Square size={11} />
        </button>
        <button onClick={() => window.api?.close()} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-red-500/30 text-purple-300">
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
