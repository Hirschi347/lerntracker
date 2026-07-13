import { useState, useEffect } from 'react'
import { Upload, Trash2, ExternalLink, Image } from 'lucide-react'

export default function Scanner() {
  const [scans, setScans] = useState([])
  const [subjects, setSubjects] = useState([])
  const [subjectId, setSubjectId] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState('')

  const load = async () => {
    const [s, subj] = await Promise.all([window.api?.getScans(filter || undefined), window.api?.getSubjects()])
    setScans(s || [])
    setSubjects(subj || [])
  }

  useEffect(() => { load() }, [filter])

  const upload = async () => {
    setUploading(true)
    try {
      await window.api?.uploadScan({ subject_id: subjectId || null, description })
      setDescription('')
      load()
    } finally {
      setUploading(false)
    }
  }

  const deleteScan = async (id) => {
    await window.api?.deleteScan(id)
    load()
  }

  const isImage = (path) => /\.(jpg|jpeg|png|gif|webp)$/i.test(path)

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>📸 Hefteinträge</h1>

      {/* Upload card */}
      <div className="card p-5 space-y-3" style={{ borderColor: 'rgba(147,197,253,0.3)' }}>
        <div className="font-bold" style={{ color: '#93c5fd' }}>📤 Hochladen</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#f0e6ff' }}>Fach</label>
            <select className="input-galaxy text-sm" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Kein Fach</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1" style={{ color: '#f0e6ff' }}>Beschreibung</label>
            <input className="input-galaxy text-sm" placeholder="z.B. Kapitel 3 Mitschrift..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <button
          className="btn-primary flex items-center gap-2 w-full justify-center py-3 text-base"
          onClick={upload}
          disabled={uploading}
          style={{ background: uploading ? 'rgba(147,197,253,0.3)' : undefined }}
        >
          <Upload size={18} />
          {uploading ? 'Lade hoch...' : 'Bilder/PDFs auswählen & hochladen'}
        </button>
        <div className="text-xs opacity-50 text-center" style={{ color: '#93c5fd' }}>
          Unterstützt: JPG, PNG, GIF, WebP, PDF · Mehrere Dateien gleichzeitig möglich
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-semibold" style={{ color: '#c084fc' }}>Filtern:</span>
        <select className="input-galaxy text-sm" style={{ width: 'auto' }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Alle Fächer</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
        </select>
        <span className="ml-auto text-xs opacity-50" style={{ color: '#f0e6ff' }}>{scans.length} Einträge</span>
      </div>

      {/* Scans grid */}
      {scans.length === 0 ? (
        <div className="card p-12 text-center opacity-40">
          <div className="text-5xl mb-3">📂</div>
          <div className="font-bold" style={{ color: '#c084fc' }}>Noch keine Scans hochgeladen</div>
          <div className="text-sm mt-1 opacity-70" style={{ color: '#c084fc' }}>Lade deine Hefteinträge hoch um sie hier zu sehen</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {scans.map((scan) => (
            <div key={scan.id} className="card p-3 group relative overflow-hidden hover:scale-[1.02] transition-transform">
              {/* Preview */}
              <div
                className="rounded-lg mb-2 flex items-center justify-center overflow-hidden cursor-pointer"
                style={{ height: 120, background: 'rgba(255,255,255,0.04)' }}
                onClick={async () => {
                  const err = await window.api?.openScan(scan.filepath)
                  if (err) alert('Datei konnte nicht geöffnet werden:\n' + err)
                }}
              >
                {isImage(scan.filepath) ? (
                  <img
                    src={`file://${scan.filepath}`}
                    alt={scan.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 opacity-50">
                    <Image size={32} style={{ color: '#93c5fd' }} />
                    <span className="text-xs" style={{ color: '#93c5fd' }}>PDF</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink size={20} style={{ color: 'white' }} />
                </div>
              </div>

              <div className="font-semibold text-xs truncate" style={{ color: '#f0e6ff' }}>{scan.filename}</div>
              {scan.description && <div className="text-xs opacity-60 truncate mt-0.5" style={{ color: '#c084fc' }}>{scan.description}</div>}
              {scan.subject_name && <div className="text-xs opacity-50 mt-0.5" style={{ color: '#93c5fd' }}>{scan.subject_name}</div>}
              <div className="text-xs opacity-40 mt-0.5" style={{ color: '#f0e6ff' }}>{new Date(scan.created_at).toLocaleDateString('de-DE')}</div>

              <button
                onClick={() => deleteScan(scan.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center"
              >
                <Trash2 size={12} style={{ color: '#fca5a5' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
