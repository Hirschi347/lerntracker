import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronLeft, BookOpen, Brain } from 'lucide-react'

export default function Karteikarten() {
  const [decks, setDecks] = useState([])
  const [subjects, setSubjects] = useState([])
  const [activeDeck, setActiveDeck] = useState(null)
  const [mode, setMode] = useState('list') // list | view | study | add-card
  const [cards, setCards] = useState([])
  const [dueCards, setDueCards] = useState([])
  const [studyIndex, setStudyIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [vocabMode, setVocabMode] = useState(false)
  const [reversed, setReversed] = useState(false)
  const [vocabInput, setVocabInput] = useState('')
  const [vocabResult, setVocabResult] = useState(null)
  const [newDeck, setNewDeck] = useState({ name: '', subject_id: '' })
  const [newCard, setNewCard] = useState({ front: '', back: '' })
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [stats, setStats] = useState(null)

  const loadDecks = async () => {
    const [d, s] = await Promise.all([window.api?.getDecks(), window.api?.getSubjects()])
    setDecks(d || [])
    setSubjects(s || [])
  }

  useEffect(() => { loadDecks() }, [])

  const openDeck = async (deck) => {
    setActiveDeck(deck)
    const [c, d] = await Promise.all([window.api?.getCards(deck.id), window.api?.getDueCards(deck.id)])
    setCards(c || [])
    setDueCards(d || [])
    setMode('view')
    return { cards: c || [], dueCards: d || [] }
  }

  const startStudy = () => {
    if (!dueCards.length) return
    setStudyIndex(0)
    setFlipped(false)
    setVocabInput('')
    setVocabResult(null)
    setMode('study')
  }

  const checkVocab = () => {
    if (!vocabInput.trim()) return
    const card = dueCards[studyIndex]
    const correctAnswer = reversed ? card.front : card.back
    const norm = s => s.trim().toLowerCase().replace(/[.,!?;:\-–]/g, '').replace(/\s+/g, ' ')
    const a = norm(vocabInput), b = norm(correctAnswer)
    let result
    if (a === b) {
      result = { quality: 5, label: '🌟 Perfekt!', color: '#5eead4' }
    } else {
      const wb = b.split(' ').filter(w => w.length > 1)
      const wa = a.split(' ').filter(w => w.length > 1)
      const ratio = wb.length > 0 ? wa.filter(w => wb.includes(w)).length / wb.length : 0
      if (ratio >= 0.8) result = { quality: 4, label: '😊 Fast richtig!', color: '#93c5fd' }
      else if (ratio >= 0.4) result = { quality: 2, label: '😅 Teilweise richtig', color: '#fde68a' }
      else result = { quality: 0, label: '😵 Falsch', color: '#fca5a5' }
    }
    setVocabResult(result)
  }

  const nextVocabCard = async () => {
    const q = vocabResult?.quality ?? 0
    setVocabInput('')
    setVocabResult(null)
    await rateCard(q)
  }

  const rateCard = async (quality) => {
    try {
      const card = dueCards[studyIndex]
      const newStats = await window.api?.reviewCard({ id: card.id, quality })
      setStats(newStats)
      const next = studyIndex + 1
      if (next >= dueCards.length) {
        // Reload cards so review_count and due list are fresh
        const [c, d] = await Promise.all([
          window.api?.getCards(activeDeck.id),
          window.api?.getDueCards(activeDeck.id),
        ])
        setCards(c || [])
        setDueCards(d || [])
        setMode('view')
      } else {
        setStudyIndex(next)
        setFlipped(false)
      }
    } catch (e) {
      console.error('rateCard error:', e)
    }
  }

  const startStudyAll = () => {
    if (!cards.length) return
    setDueCards([...cards])
    setStudyIndex(0)
    setFlipped(false)
    setMode('study')
  }

  const createDeck = async (e) => {
    e.preventDefault()
    if (!newDeck.name.trim()) return
    await window.api?.createDeck({ name: newDeck.name, subject_id: newDeck.subject_id || null })
    setNewDeck({ name: '', subject_id: '' })
    setShowNewDeck(false)
    loadDecks()
  }

  const createCard = async (e) => {
    e.preventDefault()
    if (!newCard.front.trim() || !newCard.back.trim()) return
    await window.api?.createCard({ deck_id: activeDeck.id, front: newCard.front, back: newCard.back })
    setNewCard({ front: '', back: '' })
    const [c, d] = await Promise.all([window.api?.getCards(activeDeck.id), window.api?.getDueCards(activeDeck.id)])
    setCards(c || [])
    setDueCards(d || [])
  }

  const deleteDeck = async (id) => {
    await window.api?.deleteDeck(id)
    loadDecks()
  }

  const deleteCard = async (id) => {
    await window.api?.deleteCard(id)
    const [c, d] = await Promise.all([window.api?.getCards(activeDeck.id), window.api?.getDueCards(activeDeck.id)])
    setCards(c || [])
    setDueCards(d || [])
  }

  // ── Study Mode ──────────────────────────────────────────────────────────────
  if (mode === 'study' && dueCards.length > 0) {
    const card = dueCards[studyIndex]
    const question = reversed ? card.back  : card.front
    const answer   = reversed ? card.front : card.back

    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <button className="btn-secondary p-2" onClick={() => { setMode('view'); setFlipped(false); setVocabInput(''); setVocabResult(null) }}><ChevronLeft size={18} /></button>
          <h1 className="text-xl font-black" style={{ color: '#f0e6ff' }}>🧠 {activeDeck.name}</h1>
          <span className="ml-auto text-sm opacity-60" style={{ color: '#c084fc' }}>{studyIndex + 1} / {dueCards.length}</span>
        </div>

        {/* Progress */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(192,132,252,0.15)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(studyIndex / dueCards.length) * 100}%`, background: 'linear-gradient(90deg, #7c3aed, #c084fc)' }} />
        </div>

        {/* Mode + direction toggles */}
        <div className="flex gap-2">
          {[{ id: false, label: '🃏 Karten-Modus' }, { id: true, label: '✏️ Vokabel-Modus' }].map(({ id, label }) => (
            <button key={String(id)} onClick={() => { setVocabMode(id); setFlipped(false); setVocabInput(''); setVocabResult(null) }}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold transition-all"
              style={vocabMode === id
                ? { background: 'rgba(192,132,252,0.2)', border: '1px solid rgba(192,132,252,0.4)', color: '#c084fc' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0e6ff', opacity: 0.6 }}
            >{label}</button>
          ))}
          <button
            onClick={() => { setReversed(r => !r); setFlipped(false); setVocabInput(''); setVocabResult(null) }}
            title="Vorder- und Rückseite tauschen"
            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={reversed
              ? { background: 'rgba(253,230,138,0.2)', border: '1px solid rgba(253,230,138,0.4)', color: '#fde68a' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0e6ff', opacity: 0.6 }}
          >⇄</button>
        </div>

        {/* Flashcard */}
        {vocabMode ? (
          <div className="space-y-3">
            <div className="card min-h-36 flex flex-col items-center justify-center p-8 text-center"
              style={{ borderColor: vocabResult ? `${vocabResult.color}55` : 'rgba(192,132,252,0.4)' }}>
              <div className="text-xs font-bold mb-3 opacity-50" style={{ color: '#c084fc' }}>FRAGE</div>
              <div className="text-xl font-bold" style={{ color: '#f0e6ff' }}>{question}</div>
            </div>

            {!vocabResult ? (
              <div className="flex gap-2">
                <input
                  className="input-galaxy flex-1 text-sm"
                  placeholder="Antwort eingeben..."
                  value={vocabInput}
                  onChange={e => setVocabInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && checkVocab()}
                  autoFocus
                />
                <button onClick={checkVocab} className="btn-primary text-sm px-4">Prüfen</button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="card p-3 text-center" style={{ borderColor: `${vocabResult.color}55`, background: `${vocabResult.color}11` }}>
                  <div className="font-black text-base mb-1" style={{ color: vocabResult.color }}>{vocabResult.label}</div>
                  <div className="text-xs opacity-70" style={{ color: '#f0e6ff' }}>Richtige Antwort: <span style={{ color: '#5eead4' }}>{answer}</span></div>
                </div>
                <button onClick={nextVocabCard} className="btn-primary w-full text-sm">Weiter →</button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              className="card cursor-pointer select-none min-h-52 flex flex-col items-center justify-center p-8 text-center transition-all"
              style={{ borderColor: flipped ? 'rgba(94,234,212,0.4)' : 'rgba(192,132,252,0.4)', boxShadow: flipped ? '0 0 30px rgba(94,234,212,0.2)' : '0 0 30px rgba(192,132,252,0.2)' }}
              onClick={() => setFlipped(!flipped)}
            >
              {!flipped ? (
                <>
                  <div className="text-xs font-bold mb-3 opacity-50" style={{ color: '#c084fc' }}>FRAGE — Klicken zum Umdrehen</div>
                  <div className="text-xl font-bold" style={{ color: '#f0e6ff' }}>{question}</div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold mb-3 opacity-50" style={{ color: '#5eead4' }}>ANTWORT</div>
                  <div className="text-xl font-bold" style={{ color: '#5eead4' }}>{answer}</div>
                </>
              )}
            </div>

            {flipped && (
              <div className="space-y-2">
                <div className="text-xs text-center font-semibold opacity-60" style={{ color: '#f0e6ff' }}>Wie gut wusstest du es?</div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { q: 0, label: '😵 Falsch', color: '#fca5a5' },
                    { q: 2, label: '😅 Schwer', color: '#fde68a' },
                    { q: 4, label: '😊 Gut', color: '#93c5fd' },
                    { q: 5, label: '🌟 Super', color: '#5eead4' },
                  ].map(({ q, label, color }) => (
                    <button key={q} onClick={() => rateCard(q)}
                      className="py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 hover:brightness-110"
                      style={{ background: `${color}22`, border: `1px solid ${color}55`, color }}
                    >{label}</button>
                  ))}
                </div>
              </div>
            )}
            {!flipped && (
              <div className="text-center text-xs opacity-40" style={{ color: '#c084fc' }}>Karte umdrehen um Antwort zu sehen</div>
            )}
          </>
        )}
      </div>
    )
  }

  // ── Deck View ───────────────────────────────────────────────────────────────
  if ((mode === 'view' || mode === 'add-card') && activeDeck) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn-secondary p-2" onClick={() => { setMode('list'); setActiveDeck(null) }}><ChevronLeft size={18} /></button>
          <h1 className="text-2xl font-black" style={{ color: '#f0e6ff' }}>{activeDeck.name}</h1>
          <div className="ml-auto flex gap-2 flex-wrap">
            <button className="btn-secondary text-sm flex items-center gap-1.5" onClick={() => setMode('add-card')}>
              <Plus size={14} /> Karte
            </button>
            <button
              onClick={() => { setReversed(r => !r); setFlipped(false); setVocabInput(''); setVocabResult(null) }}
              title="Vorder- und Rückseite tauschen"
              className="btn-secondary text-sm"
              style={reversed ? { color: '#fde68a', borderColor: 'rgba(253,230,138,0.4)' } : {}}
            >⇄ {reversed ? 'Umgekehrt' : 'Normal'}</button>
            {dueCards.length === 0 && cards.length > 0 && (
              <button className="btn-secondary text-sm flex items-center gap-1.5" onClick={startStudyAll}>
                <Brain size={14} /> Alle wiederholen
              </button>
            )}
            <button
              className="btn-primary text-sm flex items-center gap-1.5"
              onClick={startStudy}
              disabled={dueCards.length === 0}
              style={dueCards.length === 0 ? { opacity: 0.4 } : {}}
            >
              <Brain size={14} /> Lernen {dueCards.length > 0 && `(${dueCards.length})`}
            </button>
          </div>
        </div>

        {dueCards.length > 0 && (
          <div className="card p-3 flex items-center gap-3" style={{ borderColor: 'rgba(253,230,138,0.4)', background: 'rgba(253,230,138,0.05)' }}>
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-bold text-sm" style={{ color: '#fde68a' }}>{dueCards.length} Karten zur Wiederholung fällig!</div>
              <div className="text-xs opacity-60" style={{ color: '#fde68a' }}>Spaced Repetition hält das Wissen frisch ✨</div>
            </div>
            <button className="btn-primary text-sm ml-auto" onClick={startStudy}>Jetzt lernen</button>
          </div>
        )}

        {/* Add card form */}
        {mode === 'add-card' && (
          <div className="card p-4 space-y-3" style={{ borderColor: 'rgba(192,132,252,0.4)', animation: 'slideIn 0.2s ease-out' }}>
            <div className="font-bold text-sm" style={{ color: '#c084fc' }}>✨ Neue Karteikarte</div>
            <form onSubmit={createCard} className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#f9a8d4' }}>🔵 Vorderseite — Frage</label>
                <textarea
                  className="input-galaxy resize-none"
                  rows={3}
                  placeholder="Was ist die Frage?"
                  value={newCard.front}
                  onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
                  required autoFocus
                  style={{ lineHeight: 1.6 }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: '#5eead4' }}>🟢 Rückseite — Antwort</label>
                <textarea
                  className="input-galaxy resize-none"
                  rows={3}
                  placeholder="Was ist die Antwort?"
                  value={newCard.back}
                  onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
                  required
                  style={{ lineHeight: 1.6 }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn-secondary text-sm" onClick={() => setMode('view')}>Zurück</button>
                <button type="submit" className="btn-primary text-sm">Karte hinzufügen ✨</button>
              </div>
            </form>
          </div>
        )}

        {/* Cards list */}
        <div className="space-y-2">
          {cards.length === 0 ? (
            <div className="card p-8 text-center opacity-50" style={{ color: '#c084fc' }}>
              <div className="text-4xl mb-2">🃏</div>
              <div className="font-semibold">Noch keine Karten</div>
              <button className="btn-primary text-sm mt-3" onClick={() => setMode('add-card')}>Erste Karte erstellen</button>
            </div>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="card p-3 flex gap-3 group">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs font-bold mb-1 opacity-40" style={{ color: '#c084fc' }}>FRAGE</div>
                    <div className="text-sm" style={{ color: '#f0e6ff' }}>{card.front}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold mb-1 opacity-40" style={{ color: '#5eead4' }}>ANTWORT</div>
                    <div className="text-sm" style={{ color: '#5eead4' }}>{card.back}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button onClick={() => deleteCard(card.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} style={{ color: '#fca5a5' }} />
                  </button>
                  <span className="text-xs opacity-40" style={{ color: '#c084fc' }}>{card.review_count}x</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // ── Deck List ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black" style={{ color: '#f0e6ff' }}>🃏 Karteikarten</h1>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowNewDeck(!showNewDeck)}>
          <Plus size={16} /> Neues Deck
        </button>
      </div>

      {showNewDeck && (
        <div className="card p-4" style={{ borderColor: 'rgba(192,132,252,0.4)', animation: 'slideIn 0.2s ease-out' }}>
          <form onSubmit={createDeck} className="flex gap-2">
            <input className="input-galaxy flex-1" placeholder="Deck-Name..." value={newDeck.name} onChange={(e) => setNewDeck({ ...newDeck, name: e.target.value })} required autoFocus />
            <select className="input-galaxy" style={{ width: 'auto' }} value={newDeck.subject_id} onChange={(e) => setNewDeck({ ...newDeck, subject_id: e.target.value })}>
              <option value="">Kein Fach</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
            </select>
            <button type="submit" className="btn-primary whitespace-nowrap">Erstellen</button>
          </form>
        </div>
      )}

      {decks.length === 0 ? (
        <div className="card p-12 text-center opacity-50" style={{ color: '#c084fc' }}>
          <div className="text-5xl mb-3">🃏</div>
          <div className="font-bold">Noch keine Decks</div>
          <div className="text-sm mt-1">Erstelle dein erstes Kartendeck!</div>
        </div>
      ) : (
        <div className="grid gap-3">
          {decks.map((deck) => (
            <div key={deck.id} className="card p-4 flex items-center gap-4 cursor-pointer hover:scale-[1.01] transition-transform group" onClick={() => openDeck(deck)}>
              <div className="text-3xl">{deck.subject_emoji || '🃏'}</div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: '#f0e6ff' }}>{deck.name}</div>
                {deck.subject_name && <div className="text-xs opacity-60" style={{ color: deck.subject_color || '#c084fc' }}>{deck.subject_name}</div>}
                <div className="flex gap-3 mt-1">
                  <span className="text-xs opacity-60" style={{ color: '#f0e6ff' }}>{deck.card_count} Karten</span>
                  {deck.due_count > 0 && <span className="text-xs font-bold" style={{ color: '#fde68a' }}>⚡ {deck.due_count} fällig</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {deck.due_count > 0 && (
                  <button className="btn-primary text-xs px-3 py-1.5" onClick={async (e) => {
                    e.stopPropagation()
                    const { dueCards: due } = await openDeck(deck)
                    if (due.length) { setStudyIndex(0); setFlipped(false); setMode('study') }
                  }}>
                    Lernen
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id) }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} style={{ color: '#fca5a5' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
