import { useState } from 'react'
import { useStore } from '@/store'
import { isDue, calcNextDue, dueCount } from '@/lib/srs'
import type { Flashcard } from '@/types'

function DiscFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const cards = useStore(s => s.flashcards)
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
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="space-y-4">
      <div
        className="relative cursor-pointer select-none"
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
          {/* Front */}
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

          {/* Back */}
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

function buildQueue(filter: string, source: Flashcard[]): Flashcard[] {
  const filtered = filter === 'all' ? source : source.filter(c => c.disc === filter)
  return filtered.filter(c => isDue(c.reviews))
}

export function FlashcardReview() {
  const cards = useStore(s => s.flashcards)
  const updateFlashcard = useStore(s => s.updateFlashcard)
  const addSession = useStore(s => s.addSession)
  const userId = useStore(s => s.userId)

  const [discFilter, setDiscFilter] = useState('all')
  const [sessionCount, setSessionCount] = useState(0)

  // Snapshot queue: fixed at session start, never reacts to store changes mid-session
  // Advance by slicing the head — no index state, no stale-closure bugs
  const [queue, setQueue] = useState<Flashcard[]>(() => buildQueue('all', cards))
  const [initialTotal, setInitialTotal] = useState(() => buildQueue('all', cards).length)

  const current = queue[0]
  const remaining = queue.length

  function handleRate(rating: 1 | 2 | 3) {
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
        date: new Date().toISOString().slice(0, 10),
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

  function restart(filter?: string) {
    const f = filter ?? discFilter
    const newQ = buildQueue(f, cards)
    setQueue(newQ)
    setInitialTotal(newQ.length)
    setSessionCount(0)
  }

  const hardCards = queue.filter(c =>
    c.reviews.length > 0 && c.reviews[c.reviews.length - 1].rating === 1
  )

  if (remaining === 0) {
    return (
      <div className="space-y-4">
        <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); restart(d) }} />
        <div className="bg-surface border border-border rounded-card p-12 text-center space-y-3">
          <div className="text-5xl">{sessionCount > 0 ? '🎉' : '😴'}</div>
          <div className="text-xl font-bold text-text">
            {sessionCount > 0
              ? `${sessionCount} card${sessionCount > 1 ? 's' : ''} revisado${sessionCount > 1 ? 's' : ''}!`
              : 'Nenhum card para revisar agora'}
          </div>
          <div className="text-muted text-sm">
            {sessionCount > 0
              ? 'Ótimo trabalho! Continue revisando amanhã.'
              : 'Crie novos cards ou volte mais tarde.'}
          </div>
          {hardCards.length > 0 && (
            <button
              onClick={() => restart()}
              className="mt-2 px-5 py-2 bg-surface2 border border-border rounded-sm text-sm text-muted hover:text-text transition-all"
            >
              🔁 Revisar difíceis ({hardCards.length})
            </button>
          )}
        </div>
      </div>
    )
  }

  const progress = initialTotal > 0 ? ((initialTotal - remaining) / initialTotal) * 100 : 0

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <DiscFilter value={discFilter} onChange={d => { setDiscFilter(d); restart(d) }} />

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

      <CardView key={current.id} card={current} onRate={handleRate} />
    </div>
  )
}
