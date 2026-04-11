import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { isDue } from '@/lib/srs'
import type { Flashcard } from '@/types'

function CardItem({ card }: { card: Flashcard }) {
  const removeFlashcard = useStore(s => s.removeFlashcard)
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const reviews = card.reviews ?? []
  const lastReview = reviews[reviews.length - 1]
  const due = isDue(reviews)
  const accPct = reviews.length > 0
    ? Math.round((reviews.filter(r => r.rating >= 2).length / reviews.length) * 100)
    : null

  const badgeColor = accPct === null
    ? 'text-accent border-accent/30 bg-accent/10'
    : accPct >= 70
      ? 'text-success border-success/30 bg-success/10'
      : accPct >= 50
        ? 'text-warning border-warning/30 bg-warning/10'
        : 'text-danger border-danger/30 bg-danger/10'

  return (
    <div className={`border rounded-card overflow-hidden transition-all ${expanded ? 'border-primary/40 bg-surface2' : 'border-border bg-surface'}`}>
      <div
        className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-surface2 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="text-lg shrink-0">{due ? '🔔' : '✅'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-text font-medium leading-snug line-clamp-2">{card.q}</div>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] text-muted bg-surface3 px-2 py-0.5 rounded-full">{card.disc}</span>
            <span className="text-[10px] text-muted bg-surface3 px-2 py-0.5 rounded-full">{card.mat}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {accPct === null ? 'Nova' : `${accPct}%`}
          </span>
          <span className="text-muted text-xs">{card.reviews.length}rev</span>
          <span className="text-dim text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 space-y-3 pt-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Resposta</div>
            <div className="text-[13px] text-text/90 whitespace-pre-wrap leading-relaxed">{card.a}</div>
          </div>

          {lastReview && (
            <div className="text-[11px] text-dim">
              Última revisão: {new Date(lastReview.ts).toLocaleDateString('pt-BR')} ·{' '}
              Próxima: {due ? <span className="text-warning">Hoje</span> : new Date(lastReview.nextDue).toLocaleDateString('pt-BR')}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="text-[12px] text-danger border border-danger/30 px-3 py-1.5 rounded-sm hover:bg-danger/10 transition-all"
              >
                Excluir
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="text-[12px] text-muted">Confirmar exclusão?</span>
                <button
                  onClick={() => removeFlashcard(card.id)}
                  className="text-[12px] text-danger border border-danger/50 px-3 py-1.5 rounded-sm hover:bg-danger/10 transition-all"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="text-[12px] text-muted border border-border px-3 py-1.5 rounded-sm hover:text-text transition-all"
                >
                  Não
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function FlashcardBank() {
  const cards = useStore(s => s.flashcards)
  const [discFilter, setDiscFilter] = useState('all')
  const [search, setSearch] = useState('')

  const discs = [...new Set(cards.map(c => c.disc))].filter(Boolean)

  const filtered = useMemo(() => {
    let list = discFilter === 'all' ? cards : cards.filter(c => c.disc === discFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.q.toLowerCase().includes(q) ||
        c.a.toLowerCase().includes(q) ||
        c.mat.toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => b.ts - a.ts)
  }, [cards, discFilter, search])

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setDiscFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            discFilter === 'all'
              ? 'bg-gradient-to-r from-primary to-cyan-600 border-transparent text-white'
              : 'border-border text-muted hover:border-primary2'
          }`}
        >
          Todos ({cards.length})
        </button>
        {discs.map(d => (
          <button
            key={d}
            onClick={() => setDiscFilter(d)}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              discFilter === d
                ? 'bg-gradient-to-r from-primary to-cyan-600 border-transparent text-white'
                : 'border-border text-muted hover:border-primary2'
            }`}
          >
            {d.split(' ')[0]} ({cards.filter(c => c.disc === d).length})
          </button>
        ))}
      </div>

      {/* Busca */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por pergunta, resposta ou matéria..."
        className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary2"
      />

      {/* Contador */}
      <div className="text-[12px] text-muted">
        {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        {search && ` para "${search}"`}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          {search ? 'Nenhum card encontrado.' : 'Nenhum card ainda. Crie o primeiro!'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(card => <CardItem key={card.id} card={card} />)}
        </div>
      )}
    </div>
  )
}
