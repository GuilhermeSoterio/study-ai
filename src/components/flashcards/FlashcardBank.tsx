import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { isDue } from '@/lib/srs'
import type { Flashcard } from '@/types'

function isOrphan(card: Flashcard, disc: Record<string, string[]>): boolean {
  const validDisc = Object.keys(disc)
  if (!validDisc.includes(card.disc)) return true
  const validMats = disc[card.disc] ?? []
  return !validMats.includes(card.mat)
}

// ── Limpeza em lote ───────────────────────────────────────────────────────────

function BulkGroup({
  invalidDisc,
  cards,
  disc,
}: {
  invalidDisc: string
  cards: Flashcard[]
  disc: Record<string, string[]>
}) {
  const updateFlashcard = useStore(s => s.updateFlashcard)
  const removeFlashcard = useStore(s => s.removeFlashcard)
  const [newDisc, setNewDisc] = useState(Object.keys(disc)[0] ?? '')
  const [newMat, setNewMat] = useState(disc[Object.keys(disc)[0]]?.[0] ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const discNames = Object.keys(disc)
  const mats = disc[newDisc] ?? []

  async function applyAll() {
    setSaving(true)
    for (const card of cards) {
      updateFlashcard(card.id, { disc: newDisc, mat: newMat })
      await new Promise(r => setTimeout(r, 60))
    }
    setSaving(false)
  }

  async function deleteAll() {
    setSaving(true)
    for (const card of cards) {
      removeFlashcard(card.id)
      await new Promise(r => setTimeout(r, 60))
    }
    setSaving(false)
  }

  return (
    <div className="border border-warning/30 rounded-card bg-warning/5 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[12px] font-bold text-warning">"{invalidDisc}"</span>
          <span className="text-[11px] text-muted ml-2">{cards.length} card{cards.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Preview dos primeiros cards */}
      <div className="space-y-1 max-h-28 overflow-y-auto">
        {cards.slice(0, 5).map(c => (
          <div key={c.id} className="text-[11px] text-muted truncate bg-surface3 rounded px-2 py-0.5">
            {c.q.slice(0, 80)}{c.q.length > 80 ? '…' : ''}
          </div>
        ))}
        {cards.length > 5 && (
          <div className="text-[10px] text-dim px-2">+ {cards.length - 5} cards</div>
        )}
      </div>

      {/* Formulário de re-categorização */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Nova disciplina</label>
          <select
            value={newDisc}
            onChange={e => { setNewDisc(e.target.value); setNewMat(disc[e.target.value]?.[0] ?? '') }}
            className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-[12px] text-text focus:outline-none focus:border-primary"
          >
            {discNames.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Nova matéria</label>
          <select
            value={newMat}
            onChange={e => setNewMat(e.target.value)}
            className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-[12px] text-text focus:outline-none focus:border-primary"
          >
            {mats.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={applyAll}
          disabled={saving || !newDisc || !newMat}
          className="text-[12px] font-bold text-white bg-primary px-4 py-1.5 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Salvando…' : `Mover todos (${cards.length})`}
        </button>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
            className="text-[12px] text-danger border border-danger/30 px-3 py-1.5 rounded hover:bg-danger/10 transition-all"
          >
            Apagar todos
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted">Confirmar?</span>
            <button
              onClick={deleteAll}
              className="text-[12px] text-danger border border-danger/50 px-3 py-1.5 rounded hover:bg-danger/10"
            >
              Sim, apagar
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-[12px] text-muted border border-border px-3 py-1.5 rounded hover:text-text"
            >
              Não
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function BulkCleanup({ disc }: { disc: Record<string, string[]> }) {
  const cards = useStore(s => s.flashcards)

  const groups = useMemo(() => {
    const orphans = cards.filter(c => isOrphan(c, disc))
    const map = new Map<string, Flashcard[]>()
    for (const card of orphans) {
      const key = card.disc
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(card)
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [cards, disc])

  if (groups.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="text-[12px] font-bold text-warning">
        ⚠️ {groups.reduce((s, [, c]) => s + c.length, 0)} cards com categorias inválidas — agrupados abaixo
      </div>
      {groups.map(([invalidDisc, groupCards]) => (
        <BulkGroup key={invalidDisc} invalidDisc={invalidDisc} cards={groupCards} disc={disc} />
      ))}
    </div>
  )
}

function CardItem({
  card,
  disc,
}: {
  card: Flashcard
  disc: Record<string, string[]>
}) {
  const updateFlashcard = useStore(s => s.updateFlashcard)
  const removeFlashcard = useStore(s => s.removeFlashcard)
  const [expanded, setExpanded] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editDisc, setEditDisc] = useState(card.disc)
  const [editMat, setEditMat] = useState(card.mat)

  const orphan = isOrphan(card, disc)
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

  const discNames = Object.keys(disc)
  const editMats = disc[editDisc] ?? []

  function saveEdit() {
    updateFlashcard(card.id, { disc: editDisc, mat: editMat })
    setEditing(false)
  }

  return (
    <div className={`border rounded-card overflow-hidden transition-all ${
      orphan
        ? 'border-warning/50 bg-warning/5'
        : expanded
          ? 'border-primary/40 bg-surface2'
          : 'border-border bg-surface'
    }`}>
      <div
        className="flex items-start gap-3 p-3.5 cursor-pointer hover:bg-surface2/70 transition-colors"
        onClick={() => { setExpanded(e => !e); setEditing(false) }}
      >
        <span className="text-lg shrink-0">{due ? '🔔' : '✅'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-text font-medium leading-snug line-clamp-2">{card.q}</div>
          <div className="flex gap-2 mt-1.5 flex-wrap items-center">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${orphan ? 'bg-warning/20 text-warning font-bold' : 'bg-surface3 text-muted'}`}>
              {card.disc}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${orphan ? 'bg-warning/20 text-warning font-bold' : 'bg-surface3 text-muted'}`}>
              {card.mat}
            </span>
            {orphan && (
              <span className="text-[10px] font-bold text-warning">⚠️ categoria inválida</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${accBadge}`}>
            {accPct === null ? 'Nova' : `${accPct}%`}
          </span>
          <span className="text-muted text-xs">{reviews.length}rev</span>
          <span className="text-dim text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 space-y-3 pt-3">
          {/* Resposta */}
          {!editing && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Resposta</div>
              <div className="text-[13px] text-text/90 whitespace-pre-wrap leading-relaxed">{card.a}</div>
            </div>
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

          {/* Edição de disc/mat */}
          {editing && (
            <div className="space-y-3 bg-surface3 rounded-lg p-3 border border-border">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted">
                Corrigir categoria
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Disciplina</label>
                  <select
                    value={editDisc}
                    onChange={e => { setEditDisc(e.target.value); setEditMat('') }}
                    className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-sm text-text focus:outline-none focus:border-primary"
                  >
                    {discNames.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Matéria</label>
                  <select
                    value={editMat}
                    onChange={e => setEditMat(e.target.value)}
                    className="w-full bg-surface2 border border-border rounded px-2 py-1.5 text-sm text-text focus:outline-none focus:border-primary"
                  >
                    {editMats.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="text-[12px] font-bold text-white bg-primary px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
                >
                  Salvar
                </button>
                <button
                  onClick={() => { setEditing(false); setEditDisc(card.disc); setEditMat(card.mat) }}
                  className="text-[12px] text-muted border border-border px-3 py-1.5 rounded hover:text-text transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Ações */}
          {!editing && (
            <div className="flex gap-2 pt-1 flex-wrap">
              <button
                onClick={e => { e.stopPropagation(); setEditing(true) }}
                className="text-[12px] text-primary border border-primary/30 px-3 py-1.5 rounded-sm hover:bg-primary/10 transition-all"
              >
                ✏️ Editar categoria
              </button>
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
          )}
        </div>
      )}
    </div>
  )
}

export function FlashcardBank() {
  const cards = useStore(s => s.flashcards)
  const disc  = useStore(s => s.disc)
  const [discFilter, setDiscFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [onlyOrphans, setOnlyOrphans] = useState(false)

  const allDiscs = [...new Set(cards.map(c => c.disc))].filter(Boolean)
  const orphanCount = cards.filter(c => isOrphan(c, disc)).length

  const filtered = useMemo(() => {
    let list = discFilter === 'all' ? cards : cards.filter(c => c.disc === discFilter)
    if (onlyOrphans) list = list.filter(c => isOrphan(c, disc))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.q.toLowerCase().includes(q) ||
        c.a.toLowerCase().includes(q) ||
        c.mat.toLowerCase().includes(q)
      )
    }
    // Orphans primeiro
    return list.sort((a, b) => {
      const aOrph = isOrphan(a, disc) ? 0 : 1
      const bOrph = isOrphan(b, disc) ? 0 : 1
      if (aOrph !== bOrph) return aOrph - bOrph
      return b.ts - a.ts
    })
  }, [cards, discFilter, search, onlyOrphans, disc])

  return (
    <div className="space-y-4">
      {/* Aviso de orphans */}
      {orphanCount > 0 && (
        <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-card px-4 py-3">
          <span className="text-warning text-lg">⚠️</span>
          <div className="flex-1 text-[12px] text-warning">
            <span className="font-bold">{orphanCount} card{orphanCount > 1 ? 's' : ''}</span>
            {' '}com disciplina/matéria fora da lista atual.{' '}
            <button
              onClick={() => { setOnlyOrphans(true); setDiscFilter('all') }}
              className="underline font-bold hover:no-underline"
            >
              Limpar em lote
            </button>
          </div>
        </div>
      )}

      {/* Limpeza em lote */}
      {onlyOrphans && <BulkCleanup disc={disc} />}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setDiscFilter('all'); setOnlyOrphans(false) }}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            discFilter === 'all' && !onlyOrphans
              ? 'bg-gradient-to-r from-primary to-cyan-600 border-transparent text-white'
              : 'border-border text-muted hover:border-primary'
          }`}
        >
          Todos ({cards.length})
        </button>

        {orphanCount > 0 && (
          <button
            onClick={() => { setOnlyOrphans(o => !o); setDiscFilter('all') }}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              onlyOrphans
                ? 'bg-warning border-transparent text-black'
                : 'border-warning/50 text-warning hover:bg-warning/10'
            }`}
          >
            ⚠️ Inválidos ({orphanCount})
          </button>
        )}

        {allDiscs.map(d => (
          <button
            key={d}
            onClick={() => { setDiscFilter(d); setOnlyOrphans(false) }}
            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
              discFilter === d && !onlyOrphans
                ? 'bg-gradient-to-r from-primary to-cyan-600 border-transparent text-white'
                : 'border-border text-muted hover:border-primary'
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
        className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary"
      />

      <div className="text-[12px] text-muted">
        {filtered.length} card{filtered.length !== 1 ? 's' : ''}
        {search && ` para "${search}"`}
        {onlyOrphans && ' · mostrando apenas categorias inválidas'}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm">
          {search ? 'Nenhum card encontrado.' : 'Nenhum card ainda. Crie o primeiro!'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(card => (
            <CardItem key={card.id} card={card} disc={disc} />
          ))}
        </div>
      )}
    </div>
  )
}
