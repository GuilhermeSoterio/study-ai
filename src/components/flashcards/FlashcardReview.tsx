import { useState } from 'react'
import { useStore } from '@/store'
import { isDue, calcNextDue, dueCount } from '@/lib/srs'
import { localDate } from '@/lib/utils'
import type { Flashcard } from '@/types'

function DiscFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const allCards = useStore(s => s.flashcards)
  const cards = allCards.filter(c => !c.ignored)
  const discs = [...new Set(cards.map(c => c.disc))].filter(Boolean)

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      <button
        onClick={() => onChange('all')}
        className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
          value === 'all'
            ? 'bg-gradient-to-r from-primary to-cyan-600 border-transparent text-white'
            : 'border-border text-muted hover:border-primary2 hover:text-text'
        }`}
      >
        Todos ({dueCount(cards)})
      </button>
      {discs.map(d => {
        const count = dueCount(cards.filter(c => c.disc === d))
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              value === d
                ? 'bg-gradient-to-r from-primary to-cyan-600 border-transparent text-white'
                : 'border-border text-muted hover:border-primary2 hover:text-text'
            }`}
          >
            {d.split(' ')[0]} ({count})
          </button>
        )
      })}
    </div>
  )
}

interface CardViewProps {
  card: Flashcard
  onRate: (rating: 1 | 2 | 3) => void
}

function CardView({ card, onRate }: CardViewProps) {
  const [flipped,  setFlipped]  = useState(false)
  const [editing,  setEditing]  = useState(false)
  const [editQ,    setEditQ]    = useState(card.q)
  const [editA,    setEditA]    = useState(card.a)
  const updateFlashcard = useStore(s => s.updateFlashcard)

  function openEdit() { setEditQ(card.q); setEditA(card.a); setEditing(true) }

  function saveEdit() {
    const q = editQ.trim(); const a = editA.trim()
    if (!q || !a) return
    updateFlashcard(card.id, { q, a })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-surface2 border border-border rounded-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Editar flashcard</span>
          <button onClick={() => setEditing(false)} className="text-muted hover:text-text text-[13px] transition-colors">✕</button>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Pergunta</label>
          <textarea
            value={editQ} onChange={e => setEditQ(e.target.value)} rows={5}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[12px] text-text resize-y outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Resposta</label>
          <textarea
            value={editA} onChange={e => setEditA(e.target.value)} rows={3}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[12px] text-text resize-y outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-sm text-[11px] text-muted border border-border hover:text-text transition-all">
            Cancelar
          </button>
          <button onClick={saveEdit} disabled={!editQ.trim() || !editA.trim()}
            className="flex-1 py-2 rounded-sm text-[11px] font-bold bg-gradient-to-r from-primary to-cyan-600 text-white disabled:opacity-40"
          >
            Salvar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <button
          onClick={openEdit}
          className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded text-[12px] text-muted opacity-40 hover:opacity-100 hover:bg-surface3 transition-all"
          title="Editar flashcard"
        >
          ✏
        </button>
        <div
          className="cursor-pointer select-none"
          style={{ perspective: '1000px' }}
          onClick={() => setFlipped(f => !f)}
        >
          <div
            className="relative w-full transition-all duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: '220px',
            }}
          >
            <div
              className="absolute inset-0 bg-surface2 border border-border rounded-card p-6 flex flex-col justify-between"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                  {card.disc} › {card.mat}
                </span>
                <span className="text-[10px] text-dim bg-surface3 px-2 py-0.5 rounded-full">
                  {card.banca}
                </span>
              </div>
              <div className="text-text text-[15px] leading-relaxed font-medium text-center px-2 whitespace-pre-wrap">
                {card.q}
              </div>
              <div className="text-[11px] text-muted text-center">
                Clique para revelar a resposta
              </div>
            </div>

            <div
              className="absolute inset-0 bg-surface2 border border-primary/30 rounded-card p-6 flex flex-col justify-between"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
                  Resposta
                </span>
                <span className="text-[10px] text-dim bg-surface3 px-2 py-0.5 rounded-full">
                  {card.disc} › {card.mat}
                </span>
              </div>
              <div className="text-text text-[14px] leading-relaxed text-center px-2 whitespace-pre-wrap">
                {card.a}
              </div>
              <div className="text-[11px] text-muted text-center">
                Como você se saiu?
              </div>
            </div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="grid grid-cols-3 gap-3">
          {([
            { rating: 1 as const, label: '😓 Difícil', color: 'border-danger/50 hover:bg-danger/10 text-danger' },
            { rating: 2 as const, label: '🤔 Normal',  color: 'border-warning/50 hover:bg-warning/10 text-warning' },
            { rating: 3 as const, label: '😊 Fácil',   color: 'border-success/50 hover:bg-success/10 text-success' },
          ]).map(({ rating, label, color }) => (
            <button
              key={rating}
              onClick={e => { e.stopPropagation(); onRate(rating) }}
              className={`py-3 rounded-card border font-bold text-sm transition-all ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TriageCardView({ card, onHard, onEasy }: {
  card: Flashcard
  onHard: () => void
  onEasy: () => void
}) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="space-y-4">
      <div
        className="cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="relative w-full transition-all duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
          }}
        >
          <div
            className="absolute inset-0 bg-surface2 border border-border rounded-card p-6 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                {card.disc} › {card.mat}
              </span>
              <span className="text-[10px] text-dim bg-surface3 px-2 py-0.5 rounded-full">
                {card.banca}
              </span>
            </div>
            <div className="text-text text-[15px] leading-relaxed font-medium text-center px-2 whitespace-pre-wrap">
              {card.q}
            </div>
            <div className="text-[11px] text-muted text-center">
              Clique para revelar a resposta
            </div>
          </div>

          <div
            className="absolute inset-0 bg-surface2 border border-warning/30 rounded-card p-6 flex flex-col justify-between"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold uppercase tracking-widest text-warning">
                Resposta
              </span>
              <span className="text-[10px] text-dim bg-surface3 px-2 py-0.5 rounded-full">
                {card.disc} › {card.mat}
              </span>
            </div>
            <div className="text-text text-[14px] leading-relaxed text-center px-2 whitespace-pre-wrap">
              {card.a}
            </div>
            <div className="text-[11px] text-muted text-center">
              Você sabia?
            </div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={e => { e.stopPropagation(); onHard() }}
            className="py-3 rounded-card border font-bold text-sm transition-all border-danger/50 hover:bg-danger/10 text-danger"
          >
            ❌ Não sei / Difícil
          </button>
          <button
            onClick={e => { e.stopPropagation(); onEasy() }}
            className="py-3 rounded-card border font-bold text-sm transition-all border-success/50 hover:bg-success/10 text-success"
          >
            ✅ Sei / Fácil
          </button>
        </div>
      )}
    </div>
  )
}

function buildSRSQueue(filter: string, source: Flashcard[]): Flashcard[] {
  const active = source.filter(c => !c.ignored)
  const filtered = filter === 'all' ? active : active.filter(c => c.disc === filter)
  return filtered.filter(c => isDue(c.reviews))
}

function buildTriageQueue(filter: string, source: Flashcard[]): Flashcard[] {
  const active = source.filter(c => !c.ignored)
  const filtered = filter === 'all' ? active : active.filter(c => c.disc === filter)
  const due = filtered.filter(c => isDue(c.reviews))
  const notDue = filtered.filter(c => !isDue(c.reviews))
  return [...due, ...notDue]
}

type Mode = 'srs' | 'triage'

export function FlashcardReview() {
  const cards = useStore(s => s.flashcards)
  const updateFlashcard = useStore(s => s.updateFlashcard)
  const addSession = useStore(s => s.addSession)
  const userId = useStore(s => s.userId)

  const [discFilter, setDiscFilter] = useState('all')
  const [mode, setMode] = useState<Mode>('srs')
  const [isFocused, setIsFocused] = useState(false)

  // SRS state
  const [queue, setQueue] = useState<Flashcard[]>(() => buildSRSQueue('all', cards))
  const [initialTotal, setInitialTotal] = useState(() => buildSRSQueue('all', cards).length)
  const [sessionCount, setSessionCount] = useState(0)

  // Triage state
  const [triageQueue, setTriageQueue] = useState<Flashcard[]>([])
  const [triageTotal, setTriageTotal] = useState(0)
  const [triageHard, setTriageHard] = useState<Flashcard[]>([])

  function startSRS(filter?: string) {
    const f = filter ?? discFilter
    const q = buildSRSQueue(f, cards)
    setQueue(q)
    setInitialTotal(q.length)
    setSessionCount(0)
    setIsFocused(false)
    setMode('srs')
  }

  function startTriage(filter?: string) {
    const f = filter ?? discFilter
    const q = buildTriageQueue(f, cards)
    setTriageQueue(q)
    setTriageTotal(q.length)
    setTriageHard([])
    setMode('triage')
  }

  function focusOnHard(hard: Flashcard[]) {
    setQueue([...hard])
    setInitialTotal(hard.length)
    setSessionCount(0)
    setIsFocused(true)
    setMode('srs')
  }

  function handleTriageMark(isHard: boolean) {
    const current = triageQueue[0]
    if (!current) return
    if (isHard) setTriageHard(h => [...h, current])
    setTriageQueue(q => q.slice(1))
  }

  function handleRate(rating: 1 | 2 | 3) {
    const current = queue[0]
    if (!current) return
    const isFirst = current.reviews.length === 0
    const nextDue = calcNextDue(current.reviews, rating)
    const updated = [...current.reviews, { ts: Date.now(), rating, nextDue }]
    updateFlashcard(current.id, { reviews: updated })

    if (isFirst && userId) {
      addSession({
        id: crypto.randomUUID(),
        user_id: userId,
        ts: Date.now(),
        date: localDate(),
        disc: current.disc,
        mat: current.mat,
        total: 1,
        correct: rating >= 2 ? 1 : 0,
        banca: current.banca,
        source: 'flashcard',
      })
    }

    setSessionCount(n => n + 1)
    setQueue(q => q.slice(1))
  }

  // ── Shared: mode switcher tabs ──
  const modeTabs = (
    <div className="flex gap-1 mb-3">
      <button
        onClick={() => startSRS()}
        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
          mode === 'srs'
            ? 'bg-primary/20 text-primary border border-primary/30'
            : 'text-muted hover:text-text border border-transparent'
        }`}
      >
        Revisão SRS
      </button>
      <button
        onClick={() => startTriage()}
        className={`px-3 py-1 rounded text-xs font-bold transition-all ${
          mode === 'triage'
            ? 'bg-warning/20 text-warning border border-warning/30'
            : 'text-muted hover:text-text border border-transparent'
        }`}
      >
        Triagem
      </button>
    </div>
  )

  // ── TRIAGE MODE ──
  if (mode === 'triage') {
    const current = triageQueue[0]
    const remaining = triageQueue.length
    const done = triageTotal - remaining
    const progress = triageTotal > 0 ? (done / triageTotal) * 100 : 0

    if (remaining === 0) {
      return (
        <div className="space-y-4">
          {modeTabs}
          <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); startTriage(d) }} />
          <div className="bg-surface border border-border rounded-card p-12 text-center space-y-4">
            <div className="text-4xl">{triageHard.length > 0 ? '🎯' : '✅'}</div>
            <div className="text-xl font-bold text-text">
              {triageTotal === 0 ? 'Nenhum card encontrado' : 'Triagem concluída!'}
            </div>
            {triageHard.length > 0 ? (
              <>
                <div className="text-muted text-sm">
                  {triageHard.length} de {triageTotal} cards marcados como difíceis
                </div>
                <button
                  onClick={() => focusOnHard(triageHard)}
                  className="px-6 py-3 bg-gradient-to-r from-danger to-orange-600 text-white font-bold rounded-card text-sm"
                >
                  Revisar {triageHard.length} difíceis →
                </button>
                <div>
                  <button
                    onClick={() => startSRS()}
                    className="text-muted text-xs hover:text-text transition-colors underline underline-offset-2"
                  >
                    ou iniciar revisão SRS completa
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-muted text-sm">Nenhum card marcado como difícil.</div>
                <button
                  onClick={() => startSRS()}
                  className="px-5 py-2 bg-surface2 border border-border rounded-sm text-sm text-muted hover:text-text transition-all"
                >
                  Revisão SRS normal
                </button>
              </>
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {modeTabs}
        <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); startTriage(d) }} />

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted">{done + 1} / {triageTotal}</span>
          <div className="flex items-center gap-2">
            {triageHard.length > 0 && (
              <span className="text-xs text-danger font-bold">{triageHard.length} difíceis</span>
            )}
            {triageHard.length > 0 && (
              <button
                onClick={() => focusOnHard(triageHard)}
                className="px-3 py-1 bg-danger/10 border border-danger/40 text-danger text-xs font-bold rounded-sm hover:bg-danger/20 transition-all"
              >
                Focar nas {triageHard.length} →
              </button>
            )}
          </div>
        </div>

        <div className="bg-surface3 rounded-full h-1 overflow-hidden">
          <div
            className="bg-warning h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <TriageCardView
          key={current.id}
          card={current}
          onHard={() => handleTriageMark(true)}
          onEasy={() => handleTriageMark(false)}
        />
      </div>
    )
  }

  // ── SRS MODE ──
  const remaining = queue.length
  const progress = initialTotal > 0 ? ((initialTotal - remaining) / initialTotal) * 100 : 0

  const hardCards = queue.filter(c =>
    c.reviews.length > 0 && c.reviews[c.reviews.length - 1].rating === 1
  )

  if (remaining === 0) {
    return (
      <div className="space-y-4">
        {modeTabs}
        <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); startSRS(d) }} />
        <div className="bg-surface border border-border rounded-card p-12 text-center space-y-3">
          <div className="text-5xl">{sessionCount > 0 ? (isFocused ? '🎯' : '🎉') : '😴'}</div>
          <div className="text-xl font-bold text-text">
            {sessionCount > 0
              ? `${sessionCount} card${sessionCount > 1 ? 's' : ''} revisado${sessionCount > 1 ? 's' : ''}!`
              : 'Nenhum card para revisar agora'}
          </div>
          <div className="text-muted text-sm">
            {sessionCount > 0
              ? isFocused
                ? 'Foco concluído! Ótimo trabalho.'
                : 'Ótimo trabalho! Continue revisando amanhã.'
              : 'Crie novos cards ou volte mais tarde.'}
          </div>
          <div className="flex flex-col gap-2 items-center pt-2">
            {sessionCount === 0 && (
              <button
                onClick={() => startTriage()}
                className="px-5 py-2 bg-warning/10 border border-warning/30 text-warning rounded-sm text-sm font-bold hover:bg-warning/20 transition-all"
              >
                Fazer triagem dos cards →
              </button>
            )}
            {hardCards.length > 0 && (
              <button
                onClick={() => startSRS()}
                className="px-5 py-2 bg-surface2 border border-border rounded-sm text-sm text-muted hover:text-text transition-all"
              >
                🔁 Revisar difíceis ({hardCards.length})
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {modeTabs}
      <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); startSRS(d) }} />

      {isFocused && (
        <div className="flex items-center gap-2 px-3 py-2 bg-danger/5 border border-danger/20 rounded-sm">
          <span className="text-xs">🎯</span>
          <span className="text-xs text-danger font-bold">Modo Foco — revisando cards difíceis da triagem</span>
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-muted">
        <span>{initialTotal - remaining + 1} de {initialTotal} cards</span>
        <span>{sessionCount} revisados nesta sessão</span>
      </div>
      <div className="bg-surface3 rounded-full h-1 overflow-hidden">
        <div
          className="pbar-fill h-full rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <CardView key={queue[0].id} card={queue[0]} onRate={handleRate} />
    </div>
  )
}
