import { useState } from 'react'
import { useStore } from '@/store'
import { isDue, calcNextDue, dueCount } from '@/lib/srs'
import { localDate } from '@/lib/utils'
import type { Flashcard } from '@/types'
import { usePomodoro, PomodoroBar } from './PomodoroTimer'

function SlicePicker({ total, value, onChange }: { total: number; value: number; onChange: (v: number) => void }) {
  const opts = [1, 2, 3, 4, 5, 8, 10].filter(n => n === 1 || Math.ceil(total / n) >= 3)
  const perSlice = value <= 1 ? total : Math.ceil(total / value)
  return (
    <div className="flex items-center gap-2 flex-wrap mb-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Fatias:</span>
      <div className="flex gap-1">
        {opts.map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
              value === n
                ? 'bg-primary/20 text-primary border-primary/40'
                : 'border-border text-muted hover:border-primary2 hover:text-text'
            }`}
          >
            {n === 1 ? 'Tudo' : `${n}x`}
          </button>
        ))}
      </div>
      {value > 1 && total > 0 && (
        <span className="text-[11px] text-muted">≈{perSlice} por fatia</span>
      )}
    </div>
  )
}

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

function sliceQueue(q: Flashcard[], size: number): [Flashcard[], Flashcard[]] {
  if (size === 0) return [q, []]
  return [q.slice(0, size), q.slice(size)]
}

type Mode = 'srs' | 'triage'

export function FlashcardReview() {
  const cards = useStore(s => s.flashcards)
  const updateFlashcard = useStore(s => s.updateFlashcard)
  const addSession = useStore(s => s.addSession)
  const userId = useStore(s => s.userId)

  const pomodoro = usePomodoro()

  const [discFilter, setDiscFilter] = useState('all')
  const [mode, setMode] = useState<Mode>('srs')
  const [isFocused, setIsFocused] = useState(false)
  const [numSlices, setNumSlices] = useState(4)
  const [sessionSliceSize, setSessionSliceSize] = useState(() => {
    const q = buildSRSQueue('all', cards)
    return q.length === 0 ? 0 : Math.ceil(q.length / 4)
  })

  // SRS state (initialized with numSlices=4 default)
  const [queue, setQueue] = useState<Flashcard[]>(() => {
    const q = buildSRSQueue('all', cards)
    if (q.length === 0) return []
    const sSize = Math.ceil(q.length / 4)
    return q.slice(0, sSize)
  })
  const [initialTotal, setInitialTotal] = useState(() => {
    const q = buildSRSQueue('all', cards)
    return q.length === 0 ? 0 : Math.ceil(q.length / 4)
  })
  const [sessionCount, setSessionCount] = useState(0)
  const [pendingSRSQueue, setPendingSRSQueue] = useState<Flashcard[]>(() => {
    const q = buildSRSQueue('all', cards)
    if (q.length === 0) return []
    const sSize = Math.ceil(q.length / 4)
    return q.slice(sSize)
  })
  const [srsTotalSlices, setSRSTotalSlices] = useState(() => {
    const q = buildSRSQueue('all', cards)
    if (q.length === 0) return 1
    const sSize = Math.ceil(q.length / 4)
    return Math.ceil(q.length / sSize)
  })
  const [srsSliceNum, setSRSSliceNum] = useState(1)
  const [srsGrandTotal, setSRSGrandTotal] = useState(() => buildSRSQueue('all', cards).length)

  // Triage state
  const [triageQueue, setTriageQueue] = useState<Flashcard[]>([])
  const [triageTotal, setTriageTotal] = useState(0)
  const [triageHard, setTriageHard] = useState<Flashcard[]>([])
  const [pendingTriageQueue, setPendingTriageQueue] = useState<Flashcard[]>([])
  const [triageTotalSlices, setTriageTotalSlices] = useState(1)
  const [triageSliceNum, setTriageSliceNum] = useState(1)
  const [triageGrandTotal, setTriageGrandTotal] = useState(0)
  const [currentSliceHardCards, setCurrentSliceHardCards] = useState<Flashcard[]>([])

  function startSRS(filter?: string, nl?: number) {
    const f = filter ?? discFilter
    const numSl = nl ?? numSlices
    if (nl !== undefined) setNumSlices(nl)
    const q = buildSRSQueue(f, cards)
    const sSize = numSl <= 1 ? 0 : Math.ceil(q.length / numSl)
    setSessionSliceSize(sSize)
    setSRSGrandTotal(q.length)
    const [first, pending] = sliceQueue(q, sSize)
    setQueue(first)
    setInitialTotal(first.length)
    setSessionCount(0)
    setPendingSRSQueue(pending)
    setSRSTotalSlices(sSize === 0 ? 1 : Math.ceil(q.length / sSize))
    setSRSSliceNum(1)
    setIsFocused(false)
    setMode('srs')
  }

  function nextSRSSlice() {
    const [next, remaining] = sliceQueue(pendingSRSQueue, sessionSliceSize)
    setQueue(next)
    setInitialTotal(next.length)
    setSessionCount(0)
    setPendingSRSQueue(remaining)
    setSRSSliceNum(n => n + 1)
  }

  function startTriage(filter?: string, nl?: number) {
    const f = filter ?? discFilter
    const numSl = nl ?? numSlices
    if (nl !== undefined) setNumSlices(nl)
    const q = buildTriageQueue(f, cards)
    const sSize = numSl <= 1 ? 0 : Math.ceil(q.length / numSl)
    setSessionSliceSize(sSize)
    const [first, pending] = sliceQueue(q, sSize)
    setTriageQueue(first)
    setTriageTotal(first.length)
    setPendingTriageQueue(pending)
    setTriageTotalSlices(sSize === 0 ? 1 : Math.ceil(q.length / sSize))
    setTriageSliceNum(1)
    setTriageGrandTotal(q.length)
    setTriageHard([])
    setCurrentSliceHardCards([])
    setMode('triage')
  }

  function nextTriageSlice() {
    const [next, remaining] = sliceQueue(pendingTriageQueue, sessionSliceSize)
    setTriageQueue(next)
    setTriageTotal(next.length)
    setPendingTriageQueue(remaining)
    setTriageSliceNum(n => n + 1)
    setCurrentSliceHardCards([])
  }

  function focusOnHard(hard: Flashcard[]) {
    setQueue([...hard])
    setInitialTotal(hard.length)
    setSessionCount(0)
    setPendingSRSQueue([])
    setSRSTotalSlices(1)
    setSRSSliceNum(1)
    setIsFocused(true)
    setMode('srs')
  }

  function continueTriageFromFocus() {
    setIsFocused(false)
    nextTriageSlice()
    setMode('triage')
  }

  function handleTriageMark(isHard: boolean) {
    const current = triageQueue[0]
    if (!current) return
    if (isHard) {
      setTriageHard(h => [...h, current])
      setCurrentSliceHardCards(h => [...h, current])
    }
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

  const topControls = (
    <>
      {modeTabs}
      <PomodoroBar p={pomodoro} />
    </>
  )

  // ── TRIAGE MODE ──
  if (mode === 'triage') {
    const current = triageQueue[0]
    const remaining = triageQueue.length
    const done = triageTotal - remaining
    const progress = triageTotal > 0 ? (done / triageTotal) * 100 : 0
    const hasMoreSlices = pendingTriageQueue.length > 0

    if (remaining === 0) {
      // Slice transition — more slices to go
      if (hasMoreSlices) {
        return (
          <div className="space-y-4">
            {topControls}
            <SlicePicker total={pendingTriageQueue.length} value={numSlices} onChange={n => { startTriage(undefined, n) }} />
            <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); startTriage(d) }} />
            <div className="bg-surface border border-border rounded-card p-8 text-center space-y-4">
              <div className="text-3xl">✓</div>
              <div className="text-lg font-bold text-text">
                Fatia {triageSliceNum} de {triageTotalSlices} concluída
              </div>
              <div className="text-sm text-muted">
                {currentSliceHardCards.length > 0
                  ? `${currentSliceHardCards.length} difíceis nesta fatia · ${pendingTriageQueue.length} cards restantes`
                  : `Todos fáceis nesta fatia · ${pendingTriageQueue.length} cards restantes`}
              </div>
              {currentSliceHardCards.length > 0 && (
                <button
                  onClick={() => focusOnHard(currentSliceHardCards)}
                  className="w-full py-3 bg-danger/10 border border-danger/30 text-danger font-bold rounded-card text-sm hover:bg-danger/20 transition-all"
                >
                  Revisar {currentSliceHardCards.length} difíceis desta fatia →
                </button>
              )}
              <button
                onClick={nextTriageSlice}
                className="w-full py-3 bg-gradient-to-r from-primary to-cyan-600 text-white font-bold rounded-card text-sm"
              >
                Próxima fatia ({pendingTriageQueue.length} restantes) →
              </button>
            </div>
          </div>
        )
      }

      // Final triage completion
      return (
        <div className="space-y-4">
          {topControls}
          <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); startTriage(d) }} />
          <div className="bg-surface border border-border rounded-card p-12 text-center space-y-4">
            <div className="text-4xl">{triageHard.length > 0 ? '🎯' : '✅'}</div>
            <div className="text-xl font-bold text-text">
              {triageGrandTotal === 0 ? 'Nenhum card encontrado' : 'Triagem concluída!'}
            </div>
            {triageHard.length > 0 ? (
              <>
                <div className="text-muted text-sm">
                  {triageHard.length} de {triageGrandTotal} cards marcados como difíceis
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
        {topControls}
        <SlicePicker total={triageGrandTotal} value={numSlices} onChange={n => { startTriage(undefined, n) }} />
        <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); startTriage(d) }} />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {triageTotalSlices > 1 && (
              <span className="px-2 py-0.5 bg-warning/15 border border-warning/30 text-warning text-[11px] font-bold rounded-sm">
                Fatia {triageSliceNum}/{triageTotalSlices}
              </span>
            )}
            <span className="text-xs text-muted">{done + 1} de {triageTotal}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentSliceHardCards.length > 0 && (
              <span className="text-xs text-danger font-bold">{currentSliceHardCards.length} difíceis</span>
            )}
            {currentSliceHardCards.length > 0 && (
              <button
                onClick={() => focusOnHard(currentSliceHardCards)}
                className="px-3 py-1 bg-danger/10 border border-danger/40 text-danger text-xs font-bold rounded-sm hover:bg-danger/20 transition-all"
              >
                Focar nas {currentSliceHardCards.length} →
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
  const hasMoreSRSSlices = pendingSRSQueue.length > 0

  const hardCards = queue.filter(c =>
    c.reviews.length > 0 && c.reviews[c.reviews.length - 1].rating === 1
  )

  if (remaining === 0) {
    // SRS slice transition — more slices to go
    if (hasMoreSRSSlices) {
      return (
        <div className="space-y-4">
          {topControls}
          <SlicePicker total={pendingSRSQueue.length} value={numSlices} onChange={n => { startSRS(undefined, n) }} />
          <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); startSRS(d) }} />
          <div className="bg-surface border border-border rounded-card p-8 text-center space-y-4">
            <div className="text-3xl">✓</div>
            <div className="text-lg font-bold text-text">
              Fatia {srsSliceNum} de {srsTotalSlices} concluída
            </div>
            <div className="text-sm text-muted">
              {sessionCount} revisados · {pendingSRSQueue.length} cards restantes
            </div>
            <button
              onClick={nextSRSSlice}
              className="w-full py-3 bg-gradient-to-r from-primary to-cyan-600 text-white font-bold rounded-card text-sm"
            >
              Próxima fatia ({pendingSRSQueue.length} restantes) →
            </button>
            <button
              onClick={() => startTriage()}
              className="text-muted text-xs hover:text-text transition-colors underline underline-offset-2"
            >
              Parar por aqui
            </button>
          </div>
        </div>
      )
    }

    // SRS all done screen
    return (
      <div className="space-y-4">
        {topControls}
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
            {isFocused && pendingTriageQueue.length > 0 && (
              <button
                onClick={continueTriageFromFocus}
                className="px-5 py-2 bg-warning/10 border border-warning/30 text-warning rounded-sm text-sm font-bold hover:bg-warning/20 transition-all"
              >
                Continuar triagem ({pendingTriageQueue.length} restantes) →
              </button>
            )}
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
      {topControls}
      <SlicePicker total={srsGrandTotal} value={numSlices} onChange={n => { startSRS(undefined, n) }} />
      <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); startSRS(d) }} />

      {isFocused && (
        <div className="flex items-center gap-2 px-3 py-2 bg-danger/5 border border-danger/20 rounded-sm">
          <span className="text-xs">🎯</span>
          <span className="text-xs text-danger font-bold">Modo Foco — revisando cards difíceis da triagem</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {srsTotalSlices > 1 && (
            <span className="px-2 py-0.5 bg-primary/15 border border-primary/30 text-primary text-[11px] font-bold rounded-sm">
              Fatia {srsSliceNum}/{srsTotalSlices}
            </span>
          )}
          <span className="text-xs text-muted">{initialTotal - remaining + 1} de {initialTotal}</span>
        </div>
        <span className="text-xs text-muted">{sessionCount} revisados</span>
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
