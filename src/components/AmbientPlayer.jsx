import { useState, useRef, useEffect } from 'react'

const SOUNDS = [
  { id: 'off',   label: '🔇 Aus' },
  { id: 'white', label: '⬜ Weiß' },
  { id: 'brown', label: '🟫 Braun' },
  { id: 'foehn', label: '🌬️ Föhn+Regen' },
]

function buildWhite(ctx) {
  const size = ctx.sampleRate * 8
  const buf  = ctx.createBuffer(1, size, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1
  applyFade(data, size)
  return buf
}

function buildBrown(ctx) {
  const size = ctx.sampleRate * 8
  const buf  = ctx.createBuffer(1, size, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < size; i++) {
    last += (Math.random() - 0.5) * 0.03
    last = Math.max(-0.5, Math.min(0.5, last))
    data[i] = last * 2
  }
  applyFade(data, size)
  return buf
}

function applyFade(data, size) {
  const fade = Math.floor(size * 0.012)
  for (let i = 0; i < fade; i++) {
    const f = i / fade
    data[i] *= f
    data[size - 1 - i] *= f
  }
}

async function fetchAudioBuffer(ctx, url) {
  const res = await fetch(url)
  const ab  = await res.arrayBuffer()
  return new Promise((resolve, reject) => ctx.decodeAudioData(ab, resolve, reject))
}

export default function AmbientPlayer() {
  const [active,  setActive]  = useState('off')
  const [volume,  setVolume]  = useState(0.2)
  const [loading, setLoading] = useState(false)
  const ctxRef    = useRef(null)
  const soundRef  = useRef(null)   // { srcs: AudioBufferSourceNode[], gain: GainNode }
  const bufCache  = useRef({})     // url → AudioBuffer (decoded once, reused)

  const getCtx = () => {
    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  const stopCurrent = () => {
    if (!soundRef.current) return
    soundRef.current.srcs.forEach(s => { try { s.stop() } catch (_) {} })
    soundRef.current = null
  }

  const select = async (id) => {
    stopCurrent()
    setActive(id)
    if (id === 'off') return

    const ctx = getCtx()
    const master = ctx.createGain()
    master.gain.value = volume
    master.connect(ctx.destination)

    if (id === 'white') {
      // Sanftes Noise-Cancelling-Rauschen: starke Höhenabsenkung + Tiefpass
      const shelf = ctx.createBiquadFilter()
      shelf.type = 'highshelf'
      shelf.frequency.value = 1000
      shelf.gain.value = -16
      const lpf = ctx.createBiquadFilter()
      lpf.type = 'lowpass'
      lpf.frequency.value = 3200
      lpf.Q.value = 0.5
      const src = ctx.createBufferSource()
      src.buffer = buildWhite(ctx)
      src.loop = true
      src.connect(shelf)
      shelf.connect(lpf)
      lpf.connect(master)
      src.start()
      soundRef.current = { srcs: [src], gain: master }

    } else if (id === 'brown') {
      const lpf = ctx.createBiquadFilter()
      lpf.type = 'lowpass'
      lpf.frequency.value = 300
      lpf.Q.value = 0.5
      const src = ctx.createBufferSource()
      src.buffer = buildBrown(ctx)
      src.loop = true
      src.connect(lpf)
      lpf.connect(master)
      src.start()
      soundRef.current = { srcs: [src], gain: master }

    } else if (id === 'foehn') {
      setLoading(true)
      try {
        // Lade und cache die MP3-Dateien (nur beim ersten Mal)
        if (!bufCache.current.hairdryer)
          bufCache.current.hairdryer = await fetchAudioBuffer(ctx, './sounds/hairdryer.mp3')
        if (!bufCache.current.rain)
          bufCache.current.rain = await fetchAudioBuffer(ctx, './sounds/rain.mp3')

        // Föhn-Spur: voller Klang, leicht gedämpft
        const fGain = ctx.createGain()
        fGain.gain.value = 0.75
        const fSrc = ctx.createBufferSource()
        fSrc.buffer = bufCache.current.hairdryer
        fSrc.loop = true
        fSrc.connect(fGain)
        fGain.connect(master)
        fSrc.start()

        // Regen-Spur: sanft im Hintergrund
        const rGain = ctx.createGain()
        rGain.gain.value = 0.3
        const rSrc = ctx.createBufferSource()
        rSrc.buffer = bufCache.current.rain
        rSrc.loop = true
        rSrc.connect(rGain)
        rGain.connect(master)
        rSrc.start()

        soundRef.current = { srcs: [fSrc, rSrc], gain: master }
      } catch (e) {
        console.error('Sound konnte nicht geladen werden:', e)
        setActive('off')
        master.disconnect()
      } finally {
        setLoading(false)
      }
    }
  }

  const changeVolume = (v) => {
    setVolume(v)
    if (soundRef.current) soundRef.current.gain.gain.value = v
  }

  useEffect(() => () => {
    stopCurrent()
    try { ctxRef.current?.close() } catch (_) {}
  }, [])

  return (
    <div>
      <label className="text-xs font-semibold block mb-2" style={{ color: '#f0e6ff' }}>🎵 Fokus-Klang</label>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {SOUNDS.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => select(s.id)}
            disabled={loading}
            className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all hover:scale-105"
            style={active === s.id
              ? { background: 'rgba(192,132,252,0.25)', border: '1px solid rgba(192,132,252,0.5)', color: '#c084fc' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0e6ff' }}
          >{loading && s.id === 'foehn' ? '⏳ Lädt…' : s.label}</button>
        ))}
      </div>
      {active !== 'off' && (
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-40" style={{ color: '#f0e6ff' }}>🔈</span>
          <input
            type="range" min={0.05} max={0.6} step={0.05}
            value={volume}
            onChange={e => changeVolume(parseFloat(e.target.value))}
            className="flex-1 cursor-pointer"
            style={{ accentColor: '#c084fc', height: 4 }}
          />
          <span className="text-xs opacity-40" style={{ color: '#f0e6ff' }}>🔊</span>
        </div>
      )}
    </div>
  )
}
