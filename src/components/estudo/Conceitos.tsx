import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { isDue, dueCount, calcNextDue } from '@/lib/srs'
import type { Conceito } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

type Tab = 'materias' | 'revisar' | 'novo'

// ── Card de conceito (expandível) ─────────────────────────────────────────────

function ConceitoCard({ c }: { c: Conceito }) {
  const updateConceito = useStore(s => s.updateConceito)
  const removeConceito = useStore(s => s.removeConceito)
  const disc = useStore(s => s.disc)

  const [open, setOpen]           = useState(false)
  const [editing, setEditing]     = useState(false)
  const [confirming, setConf]     = useState(false)
  const [editTitulo, setET]       = useState(c.titulo)
  const [editConteudo, setEC]     = useState(c.conteudo)
  const [editDisc, setED]         = useState(c.disc)
  const [editMat, setEM]          = useState(c.mat)

  const due      = isDue(c.reviews)
  const reviews  = c.reviews ?? []
  const lastRev  = reviews[reviews.length - 1]
  const accPct   = reviews.length > 0
    ? Math.round(reviews.filter(r => r.rating >= 2).length / reviews.length * 100)
    : null

  const discNames = Object.keys(disc)
  const editMats  = disc[editDisc] ?? []

  function saveEdit() {
    updateConceito(c.id, {
      titulo: editTitulo.trim(),
      conteudo: editConteudo.trim(),
      disc: editDisc,
      mat: editMat,
    })
    setEditing(false)
  }

  return (
    <div className={`border rounded-card overflow-hidden transition-all ${
      open ? 'border-primary/40 bg-surface2' : 'border-border bg-surface'
    }`}>
      <div
        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-surface2/70 transition-colors"
        onClick={() => { setOpen(o => !o); setEditing(false) }}
      >
        <span className="text-base shrink-0 mt-0.5">{due ? '🔔' : '✅'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text leading-snug">{c.titulo}</div>
          {!open && (
            <div className="text-[11px] text-muted mt-0.5 line-clamp-1">{c.conteudo}</div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {accPct !== null && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              accPct >= 70 ? 'text-success border-success/30 bg-success/10'
              : accPct >= 50 ? 'text-warning border-warning/30 bg-warning/10'
              : 'text-danger border-danger/30 bg-danger/10'
            }`}>{accPct}%</span>
          )}
          <span className="text-muted text-xs">{reviews.length}rev</span>
          <span className="text-dim text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-3">
          {!editing && (
            <>
              <div className="text-[13px] text-text/90 whitespace-pre-wrap leading-relaxed">
                {c.conteudo}
              </div>
              {lastRev && (
                <div className="text-[11px] text-dim">
                  Última revisão: {new Date(lastRev.ts).toLocaleDateString('pt-BR')} ·{' '}
                  Próxima:{' '}
                  {due
                    ? <span className="text-warning">Hoje</span>
                    : new Date(lastRev.nextDue).toLocaleDateString('pt-BR')
                  }
                </div>
              )}
              <div className="flex gap-2 flex-wrap pt-1">
                <button
                  onClick={e => { e.stopPropagation(); setEditing(true) }}
                  className="text-[12px] text-primary border border-primary/30 px-3 py-1.5 rounded-sm hover:bg-primary/10 transition-all"
                >
                  ✏️ Editar
                </button>
                {!confirming ? (
                  <button
                    onClick={() => setConf(true)}
                    className="text-[12px] text-danger border border-danger/30 px-3 py-1.5 rounded-sm hover:bg-danger/10 transition-all"
                  >
                    Excluir
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-muted">Confirmar?</span>
                    <button onClick={() => removeConceito(c.id)} className="text-[12px] text-danger border border-danger/50 px-3 py-1.5 rounded-sm hover:bg-danger/10">Sim</button>
                    <button onClick={() => setConf(false)} className="text-[12px] text-muted border border-border px-3 py-1.5 rounded-sm hover:text-text">Não</button>
                  </div>
                )}
              </div>
            </>
          )}

          {editing && (
            <div className="space-y-3 bg-surface3 rounded-lg p-3 border border-border">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Editar conceito</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Disciplina</label>
                  <select
                    value={editDisc}
                    onChange={e => { setED(e.target.value); setEM('') }}
                    className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-[12px] text-text focus:outline-none focus:border-primary"
                  >
                    {discNames.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Matéria</label>
                  <select
                    value={editMat}
                    onChange={e => setEM(e.target.value)}
                    className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-[12px] text-text focus:outline-none focus:border-primary"
                  >
                    {editMats.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Conceito / Termo</label>
                <input
                  value={editTitulo}
                  onChange={e => setET(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded px-2.5 py-1.5 text-[12px] text-text focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Definição / Conteúdo</label>
                <textarea
                  value={editConteudo}
                  onChange={e => setEC(e.target.value)}
                  rows={4}
                  className="w-full bg-surface2 border border-border rounded px-2.5 py-1.5 text-[12px] text-text focus:outline-none focus:border-primary resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  disabled={!editTitulo.trim() || !editConteudo.trim()}
                  className="text-[12px] font-bold text-white bg-primary px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Salvar
                </button>
                <button
                  onClick={() => { setEditing(false); setET(c.titulo); setEC(c.conteudo); setED(c.disc); setEM(c.mat) }}
                  className="text-[12px] text-muted border border-border px-3 py-1.5 rounded hover:text-text transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Aba: Por Matéria ──────────────────────────────────────────────────────────

function TabMaterias() {
  const conceitos = useStore(s => s.conceitos)
  const discMap   = useStore(s => s.disc)
  const [search, setSearch]           = useState('')
  const [openGroups, setOpenGroups]   = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    if (!search.trim()) return conceitos
    const q = search.toLowerCase()
    return conceitos.filter(c =>
      c.titulo.toLowerCase().includes(q) ||
      c.conteudo.toLowerCase().includes(q) ||
      c.mat.toLowerCase().includes(q) ||
      c.disc.toLowerCase().includes(q)
    )
  }, [conceitos, search])

  // Agrupa: disc → mat → cards
  const groups = useMemo(() => {
    const map = new Map<string, Map<string, Conceito[]>>()
    for (const c of filtered) {
      if (!map.has(c.disc)) map.set(c.disc, new Map())
      const matMap = map.get(c.disc)!
      if (!matMap.has(c.mat)) matMap.set(c.mat, [])
      matMap.get(c.mat)!.push(c)
    }
    // Ordena disc pela ordem do discMap
    const discOrder = Object.keys(discMap)
    return [...map.entries()].sort(([a], [b]) => {
      const ia = discOrder.indexOf(a)
      const ib = discOrder.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
  }, [filtered, discMap])

  function toggleGroup(key: string) {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  if (conceitos.length === 0) {
    return (
      <div className="py-20 text-center text-muted text-sm">
        Nenhum conceito cadastrado ainda. Crie o primeiro na aba <strong>Novo</strong>.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar conceito, matéria…"
        className="w-full text-[12px] bg-surface border border-border rounded-lg px-3 py-2 text-text placeholder:text-muted outline-none focus:border-primary"
      />
      <div className="text-[11px] text-muted">{filtered.length} conceito(s)</div>

      {groups.map(([discName, matMap]) => (
        <div key={discName} className="space-y-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-muted px-1">{discName}</div>
          {[...matMap.entries()].map(([matName, cards]) => {
            const key = `${discName}__${matName}`
            const open = openGroups.has(key)
            const dueN = cards.filter(c => isDue(c.reviews)).length
            return (
              <div key={matName} className="bg-surface border border-border rounded-card overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface2 transition-colors"
                  onClick={() => toggleGroup(key)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-text">{matName}</span>
                    <span className="text-[10px] text-muted">{cards.length} conceito{cards.length !== 1 ? 's' : ''}</span>
                    {dueN > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">
                        {dueN} p/ revisar
                      </span>
                    )}
                  </div>
                  <span className="text-dim text-xs">{open ? '▲' : '▼'}</span>
                </button>
                {open && (
                  <div className="border-t border-border/50 p-3 space-y-2">
                    {cards.map(c => <ConceitoCard key={c.id} c={c} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Aba: Revisar ──────────────────────────────────────────────────────────────

// ── Sistema de 3 baralhos ─────────────────────────────────────────────────────

type PileKey = 'hard' | 'medium' | 'easy'
type SortPhase = 'sorting' | 'select' | 'reviewing'

const PILE_META: Record<PileKey, { label: string; icon: string; color: string; bg: string; border: string }> = {
  hard:   { label: 'Difícil', icon: '😰', color: 'rgba(240,100,80,0.95)',  bg: 'rgba(192,57,43,0.10)',  border: 'rgba(192,57,43,0.55)'  },
  medium: { label: 'Médio',   icon: '🤔', color: 'rgba(245,190,50,0.95)',  bg: 'rgba(212,160,23,0.10)', border: 'rgba(212,160,23,0.55)' },
  easy:   { label: 'Fácil',   icon: '😊', color: 'rgba(100,200,130,0.95)', bg: 'rgba(74,124,89,0.10)',  border: 'rgba(74,124,89,0.55)'  },
}

function DeckVisual({ count, pileKey, large = false }: { count: number; pileKey: PileKey; large?: boolean }) {
  const meta   = PILE_META[pileKey]
  const w      = large ? 100 : 64
  const h      = large ? 120 : 80
  const layers = Math.min(count, 3)

  if (count === 0) return (
    <div style={{ width: w + 8, height: h + 10 }} className="flex items-center justify-center">
      <div className="w-full rounded-xl border-2 border-dashed opacity-20"
        style={{ height: h, borderColor: meta.border }} />
    </div>
  )

  return (
    <div className="relative" style={{ width: w + 8, height: h + 10 }}>
      {Array.from({ length: layers }).map((_, i) => {
        const depth = layers - i
        return (
          <div key={i} className="absolute rounded-xl" style={{
            width: w, height: h,
            top: depth * 3, left: depth * 2,
            background: meta.bg,
            border: `1.5px solid ${meta.border}`,
            opacity: 0.2 + (i / layers) * 0.3,
          }} />
        )
      })}
      <div className="absolute top-0 left-0 rounded-xl flex flex-col items-center justify-center gap-1"
        style={{ width: w, height: h, background: meta.bg, border: `2px solid ${meta.border}` }}>
        <span style={{ fontSize: large ? 24 : 16 }}>{meta.icon}</span>
        <span className="font-black leading-none" style={{ fontSize: large ? 34 : 20, color: meta.color }}>{count}</span>
      </div>
    </div>
  )
}

// ── Sessão de triagem (3 baralhos) ────────────────────────────────────────────

function TriageSession({ queue, onFinish }: { queue: Conceito[]; onFinish: () => void }) {
  const updateConceito = useStore(s => s.updateConceito)

  const [phase,         setPhase]         = useState<SortPhase>('sorting')
  const [sortIdx,       setSortIdx]       = useState(0)
  const [flipped,       setFlipped]       = useState(false)
  const [piles,         setPiles]         = useState<Record<PileKey, Conceito[]>>({ hard: [], medium: [], easy: [] })
  const [reviewingKey,  setReviewingKey]  = useState<'hard' | 'medium' | null>(null)
  const [reviewIdx,     setReviewIdx]     = useState(0)
  const [reviewFlip,    setReviewFlip]    = useState(false)
  const [reviewedPiles, setReviewedPiles] = useState<Set<PileKey>>(new Set())

  const sortCard = queue[sortIdx] ?? null
  const sortPct  = queue.length > 0 ? (sortIdx / queue.length) * 100 : 0

  function classify(pile: PileKey) {
    if (!sortCard) return
    if (pile === 'easy') {
      const nextDue = calcNextDue(sortCard.reviews ?? [], 3)
      updateConceito(sortCard.id, {
        reviews: [...(sortCard.reviews ?? []), { ts: Date.now(), rating: 3 as const, nextDue }],
      })
    }
    setPiles(prev => ({ ...prev, [pile]: [...prev[pile], sortCard] }))
    setFlipped(false)
    const next = sortIdx + 1
    setSortIdx(next)
    if (next >= queue.length) setPhase('select')
  }

  function startPileReview(key: 'hard' | 'medium') {
    setReviewingKey(key)
    setReviewIdx(0)
    setReviewFlip(false)
    setPhase('reviewing')
  }

  function rateCard(rating: 1 | 2 | 3) {
    const key         = reviewingKey!
    const currentPile = piles[key]
    const card        = currentPile[reviewIdx]

    // Apply SRS
    const nextDue = calcNextDue(card.reviews ?? [], rating)
    updateConceito(card.id, {
      reviews: [...(card.reviews ?? []), { ts: Date.now(), rating, nextDue }],
    })

    // Move card to target pile based on rating:
    //   Fácil  (3) → easy  (always)
    //   Difícil(1) → hard  (só se não estava já no hard)
    //   Médio  (2) → consumido (removido, SRS aplicado)
    const targetPile: PileKey | null =
      rating === 3 ? 'easy' :
      rating === 1 && key !== 'hard' ? 'hard' :
      null  // consumed

    // Remove card from current pile (posição removida, próximo card sobe ao mesmo índice)
    const newCurrentPile = currentPile.filter((_, i) => i !== reviewIdx)

    setPiles(prev => ({
      ...prev,
      [key]: newCurrentPile,
      ...(targetPile ? { [targetPile]: [...prev[targetPile], card] } : {}),
    }))

    setReviewFlip(false)

    // Termina revisão se a pilha esvaziou ou o índice passou do fim
    if (newCurrentPile.length === 0 || reviewIdx >= newCurrentPile.length) {
      if (newCurrentPile.length === 0) {
        setReviewedPiles(prev => new Set([...prev, key]))
      }
      setReviewingKey(null)
      setPhase('select')
    }
    // Não altera reviewIdx: o próximo card já ocupa a mesma posição após remoção
  }

  // ── TRIAGEM: classificar ────────────────────────────────────────────────────
  if (phase === 'sorting') {
    return (
      <div className="max-w-xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onFinish} className="text-[11px] text-muted hover:text-text transition-colors">← Matérias</button>
          <span className="text-[11px] text-muted">{sortIdx + 1} / {queue.length}</span>
        </div>

        {/* Progress */}
        <div className="bg-surface3 rounded-full h-1 overflow-hidden">
          <div className="bg-warning h-full rounded-full transition-all duration-300" style={{ width: `${sortPct}%` }} />
        </div>

        {/* ── Baralhos — sempre visíveis no topo ── */}
        <div className="grid grid-cols-3 gap-2">
          {(['hard', 'medium', 'easy'] as PileKey[]).map(key => {
            const m     = PILE_META[key]
            const count = piles[key].length
            return (
              <div key={key}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
                style={{
                  background:  m.bg,
                  border:      `1.5px solid ${m.border}`,
                  opacity:     count > 0 ? 1 : 0.30,
                }}
              >
                <span className="text-base shrink-0">{m.icon}</span>
                <div className="min-w-0">
                  <div className="font-black text-[22px] leading-none tabular-nums" style={{ color: m.color }}>{count}</div>
                  <div className="text-[9px] font-bold uppercase tracking-wider truncate" style={{ color: m.color, opacity: 0.75 }}>{m.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Botão para ir aos baralhos antes de terminar */}
        {sortIdx > 0 && (
          <button
            onClick={() => setPhase('select')}
            className="w-full py-1.5 rounded-sm text-[11px] font-bold transition-all hover:brightness-110"
            style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.30)', color: 'rgba(245,190,50,0.85)' }}
          >
            Ver baralhos → ({sortIdx} classificado{sortIdx !== 1 ? 's' : ''}, {queue.length - sortIdx} restante{queue.length - sortIdx !== 1 ? 's' : ''})
          </button>
        )}

        {sortCard && (
          <div className="text-[11px] text-muted text-center">{sortCard.disc} · {sortCard.mat}</div>
        )}

        {/* Card */}
        {sortCard && (
          <div
            className="bg-surface border border-warning/20 rounded-card p-6 min-h-[140px] flex flex-col justify-center cursor-pointer hover:border-warning/40 transition-colors"
            onClick={() => setFlipped(f => !f)}
          >
            {!flipped ? (
              <div className="space-y-2 text-center">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Conceito</div>
                <div className="text-[18px] font-black text-text">{sortCard.titulo}</div>
                <div className="text-[11px] text-dim mt-4">Clique para revelar</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-muted text-center">Definição</div>
                <div className="text-[14px] text-text/90 whitespace-pre-wrap leading-relaxed">{sortCard.conteudo}</div>
              </div>
            )}
          </div>
        )}

        {/* Botões de classificação */}
        {flipped ? (
          <div className="grid grid-cols-3 gap-2">
            {(['hard', 'medium', 'easy'] as PileKey[]).map(key => {
              const m = PILE_META[key]
              return (
                <button key={key} onClick={() => classify(key)}
                  className="py-2.5 rounded-card text-[12px] font-bold transition-all hover:brightness-110 active:scale-95"
                  style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.color }}>
                  {m.icon} {m.label}
                </button>
              )
            })}
          </div>
        ) : (
          <button onClick={() => setFlipped(true)}
            className="w-full py-2.5 rounded-card bg-gradient-to-r from-warning to-orange-500 text-white font-bold text-[13px] hover:opacity-90 transition-opacity">
            Revelar
          </button>
        )}
      </div>
    )
  }

  // ── SELEÇÃO: escolher qual baralho revisar ──────────────────────────────────
  if (phase === 'select') {
    const hardPending   = piles.hard.length > 0
    const mediumPending = piles.medium.length > 0
    const allDone       = !hardPending && !mediumPending

    const remaining = queue.length - sortIdx

    return (
      <div className="max-w-xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={onFinish} className="text-[11px] text-muted hover:text-text transition-colors">← Matérias</button>
          <div className="flex items-center gap-2">
            {remaining > 0 && (
              <button
                onClick={() => setPhase('sorting')}
                className="text-[11px] font-bold px-3 py-1 rounded-sm transition-all hover:brightness-110"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(165,150,125,0.85)' }}
              >
                ↩ Continuar triagem ({remaining} restantes)
              </button>
            )}
            <span className="text-[11px] text-muted">{sortIdx} classificados</span>
          </div>
        </div>

        {/* 3 baralhos */}
        <div className="grid grid-cols-3 gap-3">
          {(['hard', 'medium', 'easy'] as PileKey[]).map(key => {
            const m       = PILE_META[key]
            const count   = piles[key].length
            const isDone  = key !== 'easy' && reviewedPiles.has(key as PileKey)
            const pending = key !== 'easy' && !isDone && count > 0
            return (
              <div key={key} className="flex flex-col items-center gap-3 p-3 rounded-xl"
                style={{ background: m.bg, border: `1.5px solid ${m.border}` }}>
                <DeckVisual count={count} pileKey={key} large />
                <div className="text-center">
                  <div className="text-[13px] font-black" style={{ color: m.color }}>{m.label}</div>
                  <div className="text-[10px] text-muted">{count} card{count !== 1 ? 's' : ''}</div>
                </div>
                {key === 'easy' ? (
                  <div className="text-[10px] font-semibold text-center" style={{ color: count > 0 ? m.color : 'rgba(100,90,120,0.5)' }}>
                    {count > 0 ? '✓ SRS aplicado' : '—'}
                  </div>
                ) : isDone ? (
                  <div className="text-[11px] font-bold text-success">✓ Revisado</div>
                ) : pending ? (
                  <button onClick={() => startPileReview(key as 'hard' | 'medium')}
                    className="w-full py-1.5 rounded-lg text-[12px] font-bold transition-all hover:brightness-110 active:scale-95"
                    style={{ background: `rgba(0,0,0,0.15)`, color: m.color, border: `1px solid ${m.border}` }}>
                    Revisar →
                  </button>
                ) : (
                  <div className="text-[10px] text-muted italic">—</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Hint text */}
        {!allDone && (hardPending || mediumPending) && (
          <p className="text-[11px] text-muted text-center">
            Escolha um baralho para revisar. Cards <span style={{ color: PILE_META.easy.color }}>Fáceis</span> já tiveram o SRS aplicado e não precisam de revisão agora.
          </p>
        )}

        <button onClick={onFinish}
          className="w-full py-2.5 rounded-card border border-border text-[13px] font-bold text-muted hover:text-text hover:bg-surface2 transition-colors">
          {allDone ? '✓ Concluído — voltar às matérias' : '← Voltar sem revisar'}
        </button>
      </div>
    )
  }

  // ── REVISÃO: revisar um baralho específico ──────────────────────────────────
  if (phase === 'reviewing' && reviewingKey) {
    const pile     = piles[reviewingKey]
    const revCard  = pile[reviewIdx]
    const meta     = PILE_META[reviewingKey]
    const revPct   = pile.length > 0 ? (reviewIdx / pile.length) * 100 : 0
    const remaining = pile.length - reviewIdx

    if (!revCard) return null

    return (
      <div className="max-w-xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => { setReviewFlip(false); setReviewIdx(0); setReviewingKey(null); setPhase('select') }}
            className="text-[11px] text-muted hover:text-text transition-colors">
            ← Baralhos
          </button>
          <span className="text-[11px] text-muted">{reviewIdx + 1} / {pile.length}</span>
        </div>

        {/* Banner */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-sm"
          style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
          <span className="text-sm">{meta.icon}</span>
          <span className="text-[11px] font-bold" style={{ color: meta.color }}>
            Revisando {meta.label}s — {remaining} restante{remaining !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Progress */}
        <div className="bg-surface3 rounded-full h-1 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ width: `${revPct}%`, background: meta.border }} />
        </div>

        <div className="text-[11px] text-muted text-center">{revCard.disc} · {revCard.mat}</div>

        {/* Card */}
        <div
          className="bg-surface rounded-card p-6 min-h-[160px] flex flex-col justify-center cursor-pointer transition-colors"
          style={{ border: `1px solid ${reviewFlip ? meta.border : 'rgba(255,255,255,0.07)'}` }}
          onClick={() => setReviewFlip(f => !f)}
        >
          {!reviewFlip ? (
            <div className="space-y-2 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted">Conceito</div>
              <div className="text-[18px] font-black text-text">{revCard.titulo}</div>
              <div className="text-[11px] text-dim mt-4">Clique para revelar</div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted text-center">Definição</div>
              <div className="text-[14px] text-text/90 whitespace-pre-wrap leading-relaxed">{revCard.conteudo}</div>
            </div>
          )}
        </div>

        {/* Rating */}
        {reviewFlip ? (
          <div className="grid grid-cols-3 gap-2">
            {(['hard', 'medium', 'easy'] as PileKey[]).map((key, i) => {
              const m = PILE_META[key]
              const rating = (i + 1) as 1 | 2 | 3
              return (
                <button key={key} onClick={() => rateCard(rating)}
                  className="py-2.5 rounded-card text-[12px] font-bold transition-all hover:brightness-110 active:scale-95"
                  style={{ background: m.bg, border: `1px solid ${m.border}`, color: m.color }}>
                  {m.icon} {m.label}
                </button>
              )
            })}
          </div>
        ) : (
          <button onClick={() => setReviewFlip(true)}
            className="w-full py-2.5 rounded-card font-bold text-[13px] text-white hover:opacity-90 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${meta.border}, ${meta.color})` }}>
            Revelar
          </button>
        )}
      </div>
    )
  }

  return null
}

// ── Aba: Revisar (seleção de matérias) ────────────────────────────────────────

function TabRevisar() {
  const conceitos = useStore(s => s.conceitos)

  // Agrupa por "disc__mat", calcula due total e due p/ matéria
  const groups = useMemo(() => {
    const map = new Map<string, { disc: string; mat: string; total: number; due: number }>()
    for (const c of conceitos) {
      const key = `${c.disc}__${c.mat}`
      if (!map.has(key)) map.set(key, { disc: c.disc, mat: c.mat, total: 0, due: 0 })
      const g = map.get(key)!
      g.total++
      if (isDue(c.reviews)) g.due++
    }
    return [...map.values()].sort((a, b) =>
      a.disc.localeCompare(b.disc) || a.mat.localeCompare(b.mat)
    )
  }, [conceitos])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [queue,    setQueue]    = useState<Conceito[] | null>(null)

  // Agrupa por disc para exibição
  const byDisc = useMemo(() => {
    const map = new Map<string, typeof groups>()
    for (const g of groups) {
      if (!map.has(g.disc)) map.set(g.disc, [])
      map.get(g.disc)!.push(g)
    }
    return [...map.entries()]
  }, [groups])

  function handleFinish() {
    setQueue(null)
    setSelected(new Set())
  }

  function startReview() {
    const keys = selected.size > 0 ? selected : new Set(groups.map(g => `${g.disc}__${g.mat}`))
    const q = conceitos.filter(c => keys.has(`${c.disc}__${c.mat}`))
    const due    = q.filter(c =>  isDue(c.reviews))
    const notDue = q.filter(c => !isDue(c.reviews))
    if (q.length) setQueue([...due, ...notDue])
  }

  if (queue !== null) {
    return <TriageSession queue={queue} onFinish={handleFinish} />
  }

  if (conceitos.length === 0) {
    return (
      <div className="py-20 text-center text-muted text-sm">
        Nenhum conceito cadastrado ainda. Crie o primeiro na aba <strong>Novo</strong>.
      </div>
    )
  }

  function toggleKey(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const totalDue = [...selected].reduce((sum, key) => {
    const g = groups.find(g => `${g.disc}__${g.mat}` === key)
    return sum + (g?.due ?? 0)
  }, 0) || groups.reduce((s, g) => s + g.due, 0)

  const totalSel = [...selected].reduce((sum, key) => {
    const g = groups.find(g => `${g.disc}__${g.mat}` === key)
    return sum + (g?.total ?? 0)
  }, 0) || groups.reduce((s, g) => s + g.total, 0)

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="text-[12px] text-muted">
        Selecione as matérias que quer revisar, ou deixe tudo desmarcado para revisar todas.
      </div>

      {/* Lista de matérias */}
      <div className="space-y-3">
        {byDisc.map(([discName, mats]) => (
          <div key={discName} className="space-y-1">
            <div className="text-[11px] font-black uppercase tracking-wider text-muted px-1">{discName}</div>
            {mats.map(g => {
              const key = `${g.disc}__${g.mat}`
              const sel = selected.has(key)
              return (
                <button
                  key={key}
                  onClick={() => toggleKey(key)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-card border transition-all text-left ${
                    sel
                      ? 'border-primary/60 bg-primary/8 text-text'
                      : 'border-border bg-surface text-text hover:bg-surface2'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      sel ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {sel && <span className="text-white text-[10px] font-black leading-none">✓</span>}
                    </span>
                    <span className="text-[13px] font-medium">{g.mat}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {g.due > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">
                        {g.due} vencido{g.due !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-[11px] text-muted">{g.total} total</span>
                  </div>
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Botão de revisão */}
      <div className="pt-1">
        <button
          onClick={startReview}
          disabled={totalSel === 0}
          className="w-full py-3 rounded-card font-bold text-[14px] hover:opacity-90 disabled:opacity-40 transition-opacity"
          style={{ background: 'linear-gradient(135deg, rgba(212,160,23,0.70), rgba(180,130,15,0.80))', color: 'rgba(255,240,190,0.95)', border: '1px solid rgba(212,160,23,0.50)' }}
        >
          ▶ Revisar {totalSel} conceito{totalSel !== 1 ? 's' : ''}
          {totalDue > 0 && <span className="ml-2 text-[11px] opacity-75">({totalDue} vencido{totalDue !== 1 ? 's' : ''} primeiro)</span>}
        </button>
      </div>
    </div>
  )
}

// ── Aba: Novo ─────────────────────────────────────────────────────────────────

function TabNovo() {
  const disc         = useStore(s => s.disc)
  const userId       = useStore(s => s.userId)
  const addConceito  = useStore(s => s.addConceito)

  const discNames = Object.keys(disc)
  const [selDisc,   setSelDisc]   = useState(discNames[0] ?? '')
  const [selMat,    setSelMat]    = useState(disc[discNames[0]]?.[0] ?? '')
  const [titulo,    setTitulo]    = useState('')
  const [conteudo,  setConteudo]  = useState('')
  const [saved,     setSaved]     = useState(false)

  const mats  = disc[selDisc] ?? []
  const valid = titulo.trim() && conteudo.trim() && selDisc && selMat

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !userId) return
    addConceito({
      id:       crypto.randomUUID(),
      user_id:  userId,
      ts:       Date.now(),
      disc:     selDisc,
      mat:      selMat,
      titulo:   titulo.trim(),
      conteudo: conteudo.trim(),
      reviews:  [],
    })
    setTitulo('')
    setConteudo('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={submit} className="bg-surface border border-border rounded-card p-6 space-y-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Novo Conceito</div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Disciplina</label>
            <select
              value={selDisc}
              onChange={e => { setSelDisc(e.target.value); setSelMat(disc[e.target.value]?.[0] ?? '') }}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
            >
              {discNames.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Matéria</label>
            <select
              value={selMat}
              onChange={e => setSelMat(e.target.value)}
              disabled={!selDisc}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary disabled:opacity-40"
            >
              {mats.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Conceito / Termo</label>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Princípio da Legalidade, Habeas Corpus, …"
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Definição / Conteúdo</label>
          <textarea
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            rows={5}
            placeholder="Escreva a definição, explicação, fórmula ou qualquer conteúdo que precise memorizar…"
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary resize-none"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!valid}
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-cyan-600 text-white font-bold text-sm rounded-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            Salvar Conceito
          </button>
          {saved && <span className="text-success text-sm font-semibold animate-pulse">✓ Salvo!</span>}
        </div>
      </form>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function Conceitos() {
  const conceitos = useStore(s => s.conceitos)
  const [tab, setTab] = useState<Tab>('materias')
  const due = dueCount(conceitos)

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'materias', label: '📚 Por Matéria' },
    { id: 'revisar',  label: '🔄 Revisar', badge: due },
    { id: 'novo',     label: '＋ Novo' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-border pb-3">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-[13px] font-semibold transition-all ${
              tab === t.id
                ? 'bg-gradient-to-r from-primary to-cyan-600 text-white'
                : 'text-muted hover:bg-surface2 hover:text-text'
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                tab === t.id ? 'bg-white/20' : 'bg-warning/20 text-warning'
              }`}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'materias' && <TabMaterias />}
      {tab === 'revisar'  && <TabRevisar />}
      {tab === 'novo'     && <TabNovo />}
    </div>
  )
}
