import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { isDue } from '@/lib/srs'
import type { RankCard, RankCardElo } from '@/types'

const ELO_ORDER: RankCardElo[] = ['Platina', 'Ouro', 'Prata', 'Bronze']

const ELO_STYLE: Record<RankCardElo, string> = {
  Platina: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10',
  Ouro:    'text-amber-400 border-amber-400/40 bg-amber-400/10',
  Prata:   'text-slate-400 border-slate-400/40 bg-slate-400/10',
  Bronze:  'text-orange-500 border-orange-600/40 bg-orange-600/10',
}

const ELO_ICON: Record<RankCardElo, string> = {
  Platina: '◆', Ouro: '★', Prata: '▲', Bronze: '●',
}

function EloBadge({ elo }: { elo: RankCardElo }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ELO_STYLE[elo]}`}>
      {ELO_ICON[elo]} {elo}
    </span>
  )
}

function CardItem({ card }: { card: RankCard }) {
  const updateRankCard = useStore(s => s.updateRankCard)
  const removeRankCard = useStore(s => s.removeRankCard)
  const [expanded,   setExpanded]   = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [editing,    setEditing]    = useState(false)
  const [editQ,      setEditQ]      = useState(card.q)
  const [editA,      setEditA]      = useState(card.a)

  const reviews = card.reviews ?? []
  const lastReview = reviews[reviews.length - 1]
  const due = isDue(reviews)
  const accPct = reviews.length > 0
    ? Math.round((reviews.filter(r => r.rating >= 2).length / reviews.length) * 100)
    : null

  const accBadge = accPct === null
    ? 'text-accent border-accent/30 bg-accent/10'
    : accPct >= 70
      ? 'text-success border-success/30 bg-success/10'
      : accPct >= 50
        ? 'text-warning border-warning/30 bg-warning/10'
        : 'text-danger border-danger/30 bg-danger/10'

  const ignored = Boolean(card.ignored)

  function saveEdit() {
    const q = editQ.trim(); const a = editA.trim()
    if (!q || !a) return
    updateRankCard(card.id, { q, a })
    setEditing(false)
  }

  return (
    <div className={`border rounded-card overflow-hidden transition-all ${
      ignored
        ? 'border-border/40 bg-surface opacity-50'
        : expanded
          ? 'border-amber-500/40 bg-surface2'
          : 'border-border bg-surface'
    }`}>
      <div
        className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-surface2/70 transition-colors"
        onClick={() => { setExpanded(e => !e); setEditing(false) }}
      >
        <span className="text-lg shrink-0">{ignored ? '🚫' : due ? '🔔' : '✅'}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] font-medium leading-snug line-clamp-2 ${ignored ? 'line-through text-muted' : 'text-text'}`}>
            {card.q}
          </div>
          <div className="flex gap-2 mt-1.5 flex-wrap items-center">
            <EloBadge elo={card.elo} />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface3 text-muted">
              {card.bloco_tematico}
            </span>
            <span className="text-[10px] text-dim">{card.incidencia}x em provas</span>
            {ignored && <span className="text-[10px] font-bold text-muted">ignorado</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!ignored && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${accBadge}`}>
              {accPct === null ? 'Nova' : `${accPct}%`}
            </span>
          )}
          <span className="text-muted text-xs">{reviews.length}rev</span>
          <span className="text-dim text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 space-y-3 pt-3">
          {!editing && (
            <>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Resposta</div>
                <div className="text-[13px] text-text/90 whitespace-pre-wrap leading-relaxed">{card.a}</div>
              </div>
              <div className="text-[11px] text-dim">
                {card.disciplina} › {card.materia} · Prioridade {card.prioridade}
              </div>
            </>
          )}

          {lastReview && !editing && (
            <div className="text-[11px] text-dim">
              Última revisão: {new Date(lastReview.ts).toLocaleDateString('pt-BR')} ·{' '}
              Próxima:{' '}
              {due
                ? <span className="text-warning">Hoje</span>
                : new Date(lastReview.nextDue).toLocaleDateString('pt-BR')
              }
            </div>
          )}

          {editing && (
            <div className="space-y-3 bg-surface3 rounded-lg p-3 border border-border">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Editar conteúdo</div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Pergunta</label>
                <textarea
                  value={editQ} onChange={e => setEditQ(e.target.value)} rows={4}
                  className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-sm text-text focus:outline-none focus:border-amber-400/60 resize-y"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Resposta</label>
                <textarea
                  value={editA} onChange={e => setEditA(e.target.value)} rows={3}
                  className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-sm text-text focus:outline-none focus:border-amber-400/60 resize-y"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={saveEdit}
                  className="text-[12px] font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1.5 rounded hover:opacity-90"
                >
                  Salvar
                </button>
                <button
                  onClick={() => { setEditing(false); setEditQ(card.q); setEditA(card.a) }}
                  className="text-[12px] text-muted border border-border px-3 py-1.5 rounded hover:text-text"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {!editing && (
            <div className="flex gap-2 pt-1 flex-wrap">
              <button
                onClick={e => { e.stopPropagation(); setEditQ(card.q); setEditA(card.a); setEditing(true) }}
                className="text-[12px] text-primary border border-primary/30 px-3 py-1.5 rounded-sm hover:bg-primary/10 transition-all"
              >
                ✏️ Editar
              </button>
              <button
                onClick={e => { e.stopPropagation(); updateRankCard(card.id, { ignored: !ignored }) }}
                className={`text-[12px] px-3 py-1.5 rounded-sm border transition-all ${
                  ignored
                    ? 'text-success border-success/30 hover:bg-success/10'
                    : 'text-muted border-border hover:text-warning hover:border-warning/40'
                }`}
              >
                {ignored ? '↩ Restaurar' : '🚫 Ignorar'}
              </button>
              {!ignored && (!confirming ? (
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
                    onClick={() => removeRankCard(card.id)}
                    className="text-[12px] text-danger border border-danger/50 px-3 py-1.5 rounded-sm hover:bg-danger/10"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="text-[12px] text-muted border border-border px-3 py-1.5 rounded-sm hover:text-text"
                  >
                    Não
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function RankCardBank() {
  const cards = useStore(s => s.rankCards)
  const [eloFilter,  setEloFilter]  = useState<RankCardElo | 'all'>('all')
  const [discFilter, setDiscFilter] = useState('all')
  const [search,     setSearch]     = useState('')

  const allDiscs = [...new Set(cards.map(c => c.disciplina))].filter(Boolean).sort()

  const filtered = useMemo(() => {
    let list = eloFilter === 'all' ? cards : cards.filter(c => c.elo === eloFilter)
    if (discFilter !== 'all') list = list.filter(c => c.disciplina === discFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.q.toLowerCase().includes(q) ||
        c.a.toLowerCase().includes(q) ||
        c.bloco_tematico.toLowerCase().includes(q) ||
        c.disciplina.toLowerCase().includes(q)
      )
    }
    return [...list].sort((a, b) => {
      const eloA = ELO_ORDER.indexOf(a.elo)
      const eloB = ELO_ORDER.indexOf(b.elo)
      if (eloA !== eloB) return eloA - eloB
      return a.prioridade - b.prioridade
    })
  }, [cards, eloFilter, discFilter, search])

  // Agrupa por bloco_tematico para exibição
  const grouped = useMemo(() => {
    const map = new Map<string, RankCard[]>()
    for (const card of filtered) {
      const key = `${card.elo}||${card.bloco_tematico}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(card)
    }
    return map
  }, [filtered])

  return (
    <div className="space-y-4">
      {/* Filtro por elo */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setEloFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            eloFilter === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-transparent text-white'
              : 'border-border text-muted hover:border-amber-400'
          }`}
        >
          Todos ({cards.length})
        </button>
        {ELO_ORDER.map(elo => {
          const count = cards.filter(c => c.elo === elo).length
          if (count === 0) return null
          return (
            <button
              key={elo}
              onClick={() => setEloFilter(elo)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                eloFilter === elo
                  ? ELO_STYLE[elo]
                  : 'border-border text-muted hover:border-amber-400'
              }`}
            >
              {elo} ({count})
            </button>
          )
        })}
      </div>

      {/* Filtro por disciplina */}
      {allDiscs.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setDiscFilter('all')}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${
              discFilter === 'all' ? 'bg-surface3 text-text border-border' : 'border-border text-muted'
            }`}
          >
            Todas disciplinas
          </button>
          {allDiscs.map(d => (
            <button
              key={d}
              onClick={() => setDiscFilter(d)}
              className={`px-3 py-1 rounded-full text-xs border transition-all ${
                discFilter === d ? 'bg-surface3 text-text border-border' : 'border-border text-muted'
              }`}
            >
              {d.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Busca */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar por pergunta, resposta, bloco temático..."
        className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400/60"
      />

      <div className="text-[12px] text-muted">
        {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        {search && ` para "${search}"`}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          {search ? 'Nenhum card encontrado.' : 'Nenhum EloCard ainda. Crie o primeiro!'}
        </div>
      ) : (
        <div className="space-y-6">
          {[...grouped.entries()].map(([key, groupCards]) => {
            const [elo, bloco] = key.split('||') as [RankCardElo, string]
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center gap-2">
                  <EloBadge elo={elo} />
                  <span className="text-[12px] font-bold text-text">{bloco}</span>
                  <span className="text-[11px] text-muted">· {groupCards[0].incidencia}x · prioridade {groupCards[0].prioridade}</span>
                  <span className="text-[10px] text-dim ml-auto">{groupCards.length} card{groupCards.length > 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-1.5 pl-1">
                  {groupCards.map(card => <CardItem key={card.id} card={card} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
