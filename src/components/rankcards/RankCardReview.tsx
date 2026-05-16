import { useState, useMemo, useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { isDue, calcNextDue, dueCount } from '@/lib/srs'
import type { RankCard, RankCardElo } from '@/types'

const ELO_STYLE: Record<RankCardElo, string> = {
  Platina: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10',
  Ouro:    'text-amber-400 border-amber-400/40 bg-amber-400/10',
  Prata:   'text-slate-400 border-slate-400/40 bg-slate-400/10',
  Bronze:  'text-orange-500 border-orange-600/40 bg-orange-600/10',
}

const ELO_ORDER: RankCardElo[] = ['Platina', 'Ouro', 'Prata', 'Bronze']

const ELO_CARD: Record<RankCardElo, {
  stripe:    string
  glow:      string
  frontBg:   string
  backBorder: string
  backGlow:  string
  label:     string
  icon:      string
}> = {
  Platina: {
    stripe:    'bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-400',
    glow:      '0 0 28px rgba(34,211,238,0.30), 0 0 8px rgba(34,211,238,0.15)',
    frontBg:   'bg-gradient-to-b from-cyan-950/30 to-surface2',
    backBorder: 'border-cyan-400/50',
    backGlow:  '0 0 28px rgba(34,211,238,0.25)',
    label:     'text-cyan-300',
    icon:      '◆',
  },
  Ouro: {
    stripe:    'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400',
    glow:      '0 0 24px rgba(251,191,36,0.28), 0 0 8px rgba(251,191,36,0.12)',
    frontBg:   'bg-gradient-to-b from-amber-950/30 to-surface2',
    backBorder: 'border-amber-400/50',
    backGlow:  '0 0 24px rgba(251,191,36,0.22)',
    label:     'text-amber-300',
    icon:      '★',
  },
  Prata: {
    stripe:    'bg-gradient-to-r from-slate-400 via-slate-300 to-slate-400',
    glow:      '0 0 18px rgba(148,163,184,0.20)',
    frontBg:   'bg-gradient-to-b from-slate-900/20 to-surface2',
    backBorder: 'border-slate-400/40',
    backGlow:  '0 0 18px rgba(148,163,184,0.15)',
    label:     'text-slate-300',
    icon:      '▲',
  },
  Bronze: {
    stripe:    'bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600',
    glow:      '0 0 18px rgba(234,88,12,0.22)',
    frontBg:   'bg-gradient-to-b from-orange-950/25 to-surface2',
    backBorder: 'border-orange-500/40',
    backGlow:  '0 0 18px rgba(234,88,12,0.15)',
    label:     'text-orange-400',
    icon:      '●',
  },
}

function EloBadge({ elo, large }: { elo: RankCardElo; large?: boolean }) {
  return (
    <span className={`font-bold rounded-full border ${ELO_STYLE[elo]} ${large ? 'text-[11px] px-2.5 py-0.5' : 'text-[10px] px-2 py-0.5'}`}>
      {ELO_CARD[elo].icon} {elo}
    </span>
  )
}

function SlicePicker({ total, value, onChange }: { total: number; value: number; onChange: (v: number) => void }) {
  const opts = [1, 2, 3, 4, 5, 8, 10].filter(n => n === 1 || Math.ceil(total / n) >= 3)
  return (
    <div className="space-y-3">
      <div className="text-[13px] font-bold text-text">Em quantos blocos quer dividir os {total} cards?</div>
      <div className="flex gap-2 flex-wrap">
        {opts.map(n => {
          const per = n <= 1 ? total : Math.ceil(total / n)
          const sel = value === n
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={`flex flex-col items-center px-4 py-2.5 rounded-sm border transition-all min-w-[72px] ${
                sel
                  ? 'bg-amber-500/20 border-amber-500/60'
                  : 'border-border hover:border-amber-400/60 hover:bg-surface3'
              }`}
            >
              <span className={`text-[13px] font-black ${sel ? 'text-amber-400' : 'text-text'}`}>
                {n === 1 ? 'Tudo' : `${n} blocos`}
              </span>
              <span className={`text-[10px] ${sel ? 'text-amber-300/70' : 'text-muted'}`}>
                {n === 1 ? `${total} cards` : `~${per} cards`}
              </span>
            </button>
          )
        })}
      </div>
      {value > 1 && (
        <div className="text-[11px] text-amber-400 font-semibold">
          ✓ {value} blocos de ~{Math.ceil(total / value)} cards cada
        </div>
      )}
    </div>
  )
}

interface Filters {
  disciplina: string
  materia:    string
  elo:        string
}

function buildQueue(filters: Filters, source: RankCard[]): RankCard[] {
  let list = source.filter(c => !c.ignored)
  if (filters.disciplina !== 'all') list = list.filter(c => c.disciplina === filters.disciplina)
  if (filters.materia    !== 'all') list = list.filter(c => c.materia    === filters.materia)
  if (filters.elo        !== 'all') list = list.filter(c => c.elo        === filters.elo)
  return list
    .filter(c => isDue(c.reviews))
    .sort((a, b) => {
      const eloA = ELO_ORDER.indexOf(a.elo)
      const eloB = ELO_ORDER.indexOf(b.elo)
      if (eloA !== eloB) return eloA - eloB
      return a.prioridade - b.prioridade
    })
}

// ── Filtro de Disciplina ──────────────────────────────────────────────────────

function DisciplinaFilter({
  all, filters, onChange,
}: {
  all: RankCard[]
  filters: Filters
  onChange: (disciplina: string) => void
}) {
  const active = all.filter(c => !c.ignored)
  const discs = [...new Set(active.map(c => c.disciplina))].filter(Boolean).sort()

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Disciplina</span>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onChange('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            filters.disciplina === 'all'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-transparent text-white'
              : 'border-border text-muted hover:border-amber-400 hover:text-text'
          }`}
        >
          Todas ({dueCount(active)})
        </button>
        {discs.map(disc => {
          const count = dueCount(active.filter(c => c.disciplina === disc))
          return (
            <button
              key={disc}
              onClick={() => onChange(disc)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                filters.disciplina === disc
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-transparent text-white'
                  : 'border-border text-muted hover:border-amber-400 hover:text-text'
              }`}
            >
              {disc.split(' ').slice(0, 2).join(' ')} ({count})
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Filtro de Matéria ─────────────────────────────────────────────────────────

function MateriaFilter({
  all, filters, onChange,
}: {
  all: RankCard[]
  filters: Filters
  onChange: (materia: string) => void
}) {
  const active = all.filter(c => !c.ignored && c.disciplina === filters.disciplina)
  const mats = [...new Set(active.map(c => c.materia))].filter(Boolean).sort()
  if (mats.length === 0) return null

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Matéria</span>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onChange('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
            filters.materia === 'all'
              ? 'bg-surface3 border-border text-text'
              : 'border-border text-muted hover:text-text'
          }`}
        >
          Todas ({dueCount(active)})
        </button>
        {mats.map(mat => {
          const count = dueCount(active.filter(c => c.materia === mat))
          return (
            <button
              key={mat}
              onClick={() => onChange(mat)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                filters.materia === mat
                  ? 'bg-surface3 border-border text-text'
                  : 'border-border text-muted hover:text-text'
              }`}
            >
              {mat} ({count})
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Filtro de Elo (secundário) ────────────────────────────────────────────────

function EloFilter({
  all, filters, onChange,
}: {
  all: RankCard[]
  filters: Filters
  onChange: (elo: string) => void
}) {
  let active = all.filter(c => !c.ignored)
  if (filters.disciplina !== 'all') active = active.filter(c => c.disciplina === filters.disciplina)
  if (filters.materia    !== 'all') active = active.filter(c => c.materia    === filters.materia)

  const presentElos = ELO_ORDER.filter(elo => active.some(c => c.elo === elo))
  if (presentElos.length <= 1) return null

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Elo</span>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onChange('all')}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
            filters.elo === 'all'
              ? 'border-border bg-surface3 text-text'
              : 'border-border text-muted hover:text-text'
          }`}
        >
          Todos
        </button>
        {presentElos.map(elo => (
          <button
            key={elo}
            onClick={() => onChange(elo)}
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
              filters.elo === elo ? ELO_STYLE[elo] : 'border-border text-muted hover:text-text'
            }`}
          >
            {elo}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── CardView ──────────────────────────────────────────────────────────────────

function CardView({ card, onRate }: { card: RankCard; onRate: (r: 1 | 2 | 3) => void }) {
  const [flipped, setFlipped] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editQ,   setEditQ]   = useState(card.q)
  const [editA,   setEditA]   = useState(card.a)
  const updateRankCard = useStore(s => s.updateRankCard)

  function saveEdit() {
    const q = editQ.trim(); const a = editA.trim()
    if (!q || !a) return
    updateRankCard(card.id, { q, a })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="bg-surface2 border border-border rounded-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Editar EloCard</span>
          <button onClick={() => setEditing(false)} className="text-muted hover:text-text text-[13px]">✕</button>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Pergunta</label>
          <textarea value={editQ} onChange={e => setEditQ(e.target.value)} rows={5}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[12px] text-text resize-y outline-none focus:border-amber-400/60"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Resposta</label>
          <textarea value={editA} onChange={e => setEditA(e.target.value)} rows={3}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[12px] text-text resize-y outline-none focus:border-amber-400/60"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="flex-1 py-2 rounded-sm text-[11px] text-muted border border-border hover:text-text">Cancelar</button>
          <button onClick={saveEdit} disabled={!editQ.trim() || !editA.trim()}
            className="flex-1 py-2 rounded-sm text-[11px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white disabled:opacity-40"
          >Salvar</button>
        </div>
      </div>
    )
  }

  const ec = ELO_CARD[card.elo]

  return (
    <div className="space-y-4">
      <div className="relative">
        <button
          onClick={() => { setEditQ(card.q); setEditA(card.a); setEditing(true) }}
          className="absolute top-2 right-2 z-20 w-7 h-7 flex items-center justify-center rounded text-[12px] text-muted opacity-40 hover:opacity-100 hover:bg-surface3 transition-all"
        >✏</button>
        <div className="cursor-pointer select-none" style={{ perspective: '1000px' }} onClick={() => setFlipped(f => !f)}>
          <div className="relative w-full transition-all duration-500"
            style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: '240px' }}
          >
            {/* Frente */}
            <div
              className={`absolute inset-0 ${ec.frontBg} border rounded-card flex flex-col overflow-hidden`}
              style={{ backfaceVisibility: 'hidden', boxShadow: ec.glow, borderColor: 'transparent' }}
            >
              <div className={`h-1 w-full shrink-0 ${ec.stripe}`} />
              <div className="flex flex-col flex-1 justify-between p-6">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <EloBadge elo={card.elo} large />
                    <span className="text-[10px] text-muted">{card.disciplina}{card.materia ? ` › ${card.materia}` : ''}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ELO_STYLE[card.elo]}`}>
                    {card.incidencia}x em provas
                  </span>
                </div>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 text-center ${ec.label}`}>
                    {card.bloco_tematico}
                  </div>
                  <div className="text-text text-[15px] leading-relaxed font-medium text-center px-2 whitespace-pre-wrap">
                    {card.q}
                  </div>
                </div>
                <div className="text-[11px] text-muted text-center">Clique para revelar a resposta</div>
              </div>
            </div>

            {/* Verso */}
            <div
              className={`absolute inset-0 bg-surface2 border ${ec.backBorder} rounded-card flex flex-col overflow-hidden`}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: ec.backGlow }}
            >
              <div className={`h-1 w-full shrink-0 ${ec.stripe}`} />
              <div className="flex flex-col flex-1 justify-between p-6">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${ec.label}`}>
                    {ec.icon} Resposta
                  </span>
                  <div className="flex items-center gap-2">
                    <EloBadge elo={card.elo} />
                    <span className="text-[10px] text-dim">{card.bloco_tematico}</span>
                  </div>
                </div>
                <div className="text-text text-[14px] leading-relaxed text-center px-2 whitespace-pre-wrap">{card.a}</div>
                <div className="text-[11px] text-muted text-center">Como você se saiu?</div>
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
            <button key={rating} onClick={e => { e.stopPropagation(); onRate(rating) }}
              className={`py-3 rounded-card border font-bold text-sm transition-all ${color}`}
            >{label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

type ReviewMode = 'srs' | 'dominio'

function filterPool(filters: Filters, source: RankCard[]): RankCard[] {
  let list = source.filter(c => !c.ignored)
  if (filters.disciplina !== 'all') list = list.filter(c => c.disciplina === filters.disciplina)
  if (filters.materia    !== 'all') list = list.filter(c => c.materia    === filters.materia)
  if (filters.elo        !== 'all') list = list.filter(c => c.elo        === filters.elo)
  return list
}

function buildMasteryQueue(filters: Filters, source: RankCard[]): RankCard[] {
  return filterPool(filters, source)
    .filter(c => !c.mastered)
    .sort((a, b) => {
      const eloA = ELO_ORDER.indexOf(a.elo)
      const eloB = ELO_ORDER.indexOf(b.elo)
      if (eloA !== eloB) return eloA - eloB
      return a.prioridade - b.prioridade
    })
}

// ── MasteryCardView ───────────────────────────────────────────────────────────

type MasteryRating = 'facil' | 'medio' | 'dificil'

function MasteryCardView({ card, onRate }: { card: RankCard; onRate: (r: MasteryRating) => void }) {
  const [flipped, setFlipped] = useState(false)
  const ec = ELO_CARD[card.elo]

  return (
    <div className="space-y-4">
      <div
        className="cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div className="relative w-full transition-all duration-500"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', minHeight: '240px' }}
        >
          {/* Frente */}
          <div
            className={`absolute inset-0 ${ec.frontBg} border rounded-card flex flex-col overflow-hidden`}
            style={{ backfaceVisibility: 'hidden', boxShadow: ec.glow, borderColor: 'transparent' }}
          >
            <div className={`h-1 w-full shrink-0 ${ec.stripe}`} />
            <div className="flex flex-col flex-1 justify-between p-6">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <EloBadge elo={card.elo} large />
                  <span className="text-[10px] text-muted">{card.disciplina}{card.materia ? ` › ${card.materia}` : ''}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ELO_STYLE[card.elo]}`}>
                  {card.incidencia}x em provas
                </span>
              </div>
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 text-center ${ec.label}`}>
                  {card.bloco_tematico}
                </div>
                <div className="text-text text-[15px] leading-relaxed font-medium text-center px-2 whitespace-pre-wrap">
                  {card.q}
                </div>
              </div>
              <div className="text-[11px] text-muted text-center">Clique para revelar a resposta</div>
            </div>
          </div>

          {/* Verso */}
          <div
            className={`absolute inset-0 bg-surface2 border ${ec.backBorder} rounded-card flex flex-col overflow-hidden`}
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: ec.backGlow }}
          >
            <div className={`h-1 w-full shrink-0 ${ec.stripe}`} />
            <div className="flex flex-col flex-1 justify-between p-6">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-widest ${ec.label}`}>
                  {ec.icon} Resposta
                </span>
                <div className="flex items-center gap-2">
                  <EloBadge elo={card.elo} />
                  <span className="text-[10px] text-dim">{card.bloco_tematico}</span>
                </div>
              </div>
              <div className="text-text text-[14px] leading-relaxed text-center px-2 whitespace-pre-wrap">{card.a}</div>
              <div className="text-[11px] text-muted text-center">Você sabia?</div>
            </div>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={e => { e.stopPropagation(); onRate('dificil') }}
            className="py-3 rounded-card border border-danger/50 hover:bg-danger/10 text-danger font-bold text-sm transition-all"
          >
            😓 Difícil
            <div className="text-[10px] font-normal opacity-70 mt-0.5">Volta pra fila</div>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRate('medio') }}
            className="py-3 rounded-card border border-warning/50 hover:bg-warning/10 text-warning font-bold text-sm transition-all"
          >
            😐 Médio
            <div className="text-[10px] font-normal opacity-70 mt-0.5">Volta pra fila</div>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onRate('facil') }}
            className="py-3 rounded-card border border-success/60 hover:bg-success/15 text-success font-bold text-sm transition-all"
          >
            ✅ Fácil
            <div className="text-[10px] font-normal opacity-70 mt-0.5">Eliminado!</div>
          </button>
        </div>
      )}
    </div>
  )
}

// ── RankCardReview (principal) ────────────────────────────────────────────────

export function RankCardReview() {
  const cards = useStore(s => s.rankCards)
  const updateRankCard = useStore(s => s.updateRankCard)

  const [mode,    setMode]    = useState<ReviewMode>('dominio')
  const [filters, setFilters] = useState<Filters>({ disciplina: 'all', materia: 'all', elo: 'all' })
  const [started, setStarted] = useState(false)
  const [domNumSlices, setDomNumSlices] = useState(1)
  const [srsNumSlices, setSrsNumSlices] = useState(1)
  const [sessionSliceSize, setSessionSliceSize] = useState(0)

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (started) {
      setElapsed(0)
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [started])

  function formatTime(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // SRS state
  const [srsQueue,       setSrsQueue]       = useState<RankCard[]>([])
  const [srsTotal,       setSrsTotal]       = useState(0)
  const [srsCount,       setSrsCount]       = useState(0)
  const [pendingSRSQueue, setPendingSRSQueue] = useState<RankCard[]>([])
  const [srsTotalSlices, setSrsTotalSlices] = useState(1)
  const [srsSliceNum,    setSrsSliceNum]    = useState(1)

  // Domínio state
  const [domQueue,      setDomQueue]      = useState<RankCard[]>([])
  const [domTotal,      setDomTotal]      = useState(0)
  const [domElimCount,  setDomElimCount]  = useState(0)
  const [finalTime,     setFinalTime]     = useState(0)
  const [pendingDomQueue, setPendingDomQueue] = useState<RankCard[]>([])
  const [domTotalSlices, setDomTotalSlices] = useState(1)
  const [domSliceNum,   setDomSliceNum]   = useState(1)

  type CardAttempt = { medio: number; dificil: number; q: string; elo: RankCardElo; bloco_tematico: string }
  const [cardAttempts, setCardAttempts] = useState<Record<string, CardAttempt>>({})

  // keep a ref so handleDominioRate can check without stale closure
  const pendingDomRef = useRef<RankCard[]>([])
  pendingDomRef.current = pendingDomQueue

  function sliceArr<T>(arr: T[], size: number): [T[], T[]] {
    if (size === 0) return [arr, []]
    return [arr.slice(0, size), arr.slice(size)]
  }

  function applyFilters(next: Filters) {
    setFilters(next)
    setStarted(false)
  }

  function setDisc(disciplina: string) { applyFilters({ disciplina, materia: 'all', elo: 'all' }) }
  function setMat(materia: string)     { applyFilters({ ...filters, materia, elo: 'all' }) }
  function setElo(elo: string)         { applyFilters({ ...filters, elo }) }

  function switchMode(m: ReviewMode) {
    setMode(m)
    setStarted(false)
  }

  function startSRS() {
    const q = buildQueue(filters, cards)
    const sSize = srsNumSlices <= 1 ? 0 : Math.ceil(q.length / srsNumSlices)
    setSessionSliceSize(sSize)
    const [first, pending] = sliceArr(q, sSize)
    setSrsQueue(first)
    setSrsTotal(first.length)
    setSrsCount(0)
    setPendingSRSQueue(pending)
    setSrsTotalSlices(sSize === 0 ? 1 : Math.ceil(q.length / sSize))
    setSrsSliceNum(1)
    setStarted(true)
  }

  function nextSRSSlice() {
    const [next, rem] = sliceArr(pendingSRSQueue, sessionSliceSize)
    setSrsQueue(next)
    setSrsTotal(next.length)
    setSrsCount(0)
    setPendingSRSQueue(rem)
    setSrsSliceNum(n => n + 1)
  }

  function startDominio() {
    const q = buildMasteryQueue(filters, cards)
    const sSize = domNumSlices <= 1 ? 0 : Math.ceil(q.length / domNumSlices)
    // DEBUG — remover depois
    console.log('[startDominio]', { domNumSlices, totalCards: q.length, sSize, firstSlice: sSize === 0 ? q.length : Math.min(sSize, q.length), pendingCards: sSize === 0 ? 0 : q.length - Math.min(sSize, q.length) })
    setSessionSliceSize(sSize)
    const [first, pending] = sliceArr(q, sSize)
    const attempts: Record<string, CardAttempt> = {}
    q.forEach(c => { attempts[c.id] = { medio: 0, dificil: 0, q: c.q, elo: c.elo, bloco_tematico: c.bloco_tematico } })
    setCardAttempts(attempts)
    setDomQueue(first)
    setDomTotal(first.length)
    setDomElimCount(0)
    setFinalTime(0)
    setPendingDomQueue(pending)
    setDomTotalSlices(sSize === 0 ? 1 : Math.ceil(q.length / sSize))
    setDomSliceNum(1)
    setStarted(true)
  }

  function nextDomSlice() {
    const [next, rem] = sliceArr(pendingDomQueue, sessionSliceSize)
    setDomQueue(next)
    setDomTotal(next.length)
    setPendingDomQueue(rem)
    setDomSliceNum(n => n + 1)
  }

  function handleSrsRate(rating: 1 | 2 | 3) {
    const current = srsQueue[0]
    if (!current) return
    const nextDue = calcNextDue(current.reviews, rating)
    updateRankCard(current.id, { reviews: [...current.reviews, { ts: Date.now(), rating, nextDue }] })
    setSrsCount(n => n + 1)
    setSrsQueue(q => q.slice(1))
  }

  function handleDominioRate(rating: MasteryRating) {
    const current = domQueue[0]
    if (!current) return
    if (rating === 'facil') {
      updateRankCard(current.id, { mastered: true })
      setDomElimCount(n => n + 1)
      const newQueue = domQueue.slice(1)
      setDomQueue(newQueue)
      if (newQueue.length === 0 && pendingDomRef.current.length === 0) {
        setFinalTime(elapsed)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    } else {
      setCardAttempts(prev => ({
        ...prev,
        [current.id]: {
          ...(prev[current.id] ?? { medio: 0, dificil: 0, q: current.q, elo: current.elo, bloco_tematico: current.bloco_tematico }),
          [rating]: (prev[current.id]?.[rating as 'medio' | 'dificil'] ?? 0) + 1,
        },
      }))
      setDomQueue(q => [...q.slice(1), current])
    }
  }

  function resetMastery() {
    const pool = filterPool(filters, cards)
    pool.filter(c => c.mastered).forEach(c => updateRankCard(c.id, { mastered: false }))
    setStarted(false)
  }

  const pool = useMemo(() => filterPool(filters, cards), [cards, filters])
  const masteredInPool   = pool.filter(c => c.mastered).length
  const unmasteredInPool = pool.filter(c => !c.mastered).length
  const dueInPool        = dueCount(pool)

  const filterPanel = (
    <div className="space-y-3 bg-surface border border-border rounded-card p-4">
      <DisciplinaFilter all={cards} filters={filters} onChange={setDisc} />
      {filters.disciplina !== 'all' && (
        <MateriaFilter all={cards} filters={filters} onChange={setMat} />
      )}
      <EloFilter all={cards} filters={filters} onChange={setElo} />
    </div>
  )

  const modeTabs = (
    <div className="flex gap-1">
      <button
        onClick={() => switchMode('dominio')}
        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
          mode === 'dominio'
            ? 'bg-success/15 text-success border border-success/30'
            : 'text-muted hover:text-text border border-transparent'
        }`}
      >
        🎯 Modo Domínio
      </button>
      <button
        onClick={() => switchMode('srs')}
        className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
          mode === 'srs'
            ? 'bg-primary/15 text-primary border border-primary/30'
            : 'text-muted hover:text-text border border-transparent'
        }`}
      >
        🔄 Revisão SRS
      </button>
    </div>
  )

  // ══════════════════════════════════════════════════════════════════════
  // MODO DOMÍNIO
  // ══════════════════════════════════════════════════════════════════════

  if (mode === 'dominio') {
    if (!started) {
      const masteryPct = pool.length > 0 ? Math.round((masteredInPool / pool.length) * 100) : 0

      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          {modeTabs}
          {filterPanel}

          {unmasteredInPool > 0 ? (
            <>
              <div className="bg-surface border border-amber-500/25 rounded-card p-5 space-y-4">
                <SlicePicker total={unmasteredInPool} value={domNumSlices} onChange={setDomNumSlices} />
                <button
                  onClick={() => startDominio()}
                  className="w-full py-3 bg-gradient-to-r from-success to-emerald-500 text-white font-bold rounded-card hover:opacity-90 transition-opacity text-[14px]"
                >
                  {domNumSlices <= 1
                    ? `Iniciar Domínio (${unmasteredInPool} cards) →`
                    : `Iniciar bloco 1 de ${domNumSlices} (~${Math.ceil(unmasteredInPool / domNumSlices)} cards) →`}
                </button>
              </div>

              {pool.length > 0 && (
                <div className="bg-surface border border-border rounded-card p-4 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted">Progresso do deck</span>
                      <span className="font-bold text-success">{masteredInPool} / {pool.length} dominados</span>
                    </div>
                    <div className="bg-surface3 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-500"
                        style={{ width: `${masteryPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-[11px] text-muted">
                    Classifique como <span className="text-success font-bold">Fácil</span> para eliminar.{' '}
                    <span className="text-warning font-bold">Médio</span> ou{' '}
                    <span className="text-danger font-bold">Difícil</span> volta pra fila do bloco.
                  </div>
                  {masteredInPool > 0 && (
                    <button
                      onClick={resetMastery}
                      className="text-muted text-[11px] hover:text-danger transition-colors underline underline-offset-2"
                    >
                      Resetar progresso
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface border border-border rounded-card p-6 text-center space-y-3">
              <div className="text-4xl">🏆</div>
              <div className="text-xl font-bold text-text">Deck dominado!</div>
              <div className="text-sm text-success font-semibold">Você memorizou todos os cards deste filtro!</div>
              {masteredInPool > 0 && (
                <button
                  onClick={resetMastery}
                  className="px-4 py-2 border border-border text-muted text-xs rounded-sm hover:text-danger hover:border-danger/40 transition-all"
                >
                  Resetar progresso
                </button>
              )}
            </div>
          )}
        </div>
      )
    }

    // Domínio — fatia concluída, mais fatias a seguir
    if (domQueue.length === 0 && pendingDomQueue.length > 0) {
      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          {modeTabs}
          <div className="bg-surface border border-border rounded-card p-8 text-center space-y-4">
            <div className="text-3xl">🏅</div>
            <div className="text-lg font-bold text-text">
              Bloco {domSliceNum} de {domTotalSlices} concluído!
            </div>
            <div className="text-sm text-muted">
              {domElimCount} eliminados até agora · {pendingDomQueue.length} cards restantes
            </div>
            <div className="font-mono text-xs text-dim bg-surface2 border border-border px-3 py-1 rounded-sm inline-block">
              ⏱ {formatTime(elapsed)}
            </div>
            <button
              onClick={nextDomSlice}
              className="w-full py-3 bg-gradient-to-r from-success to-emerald-500 text-white font-bold rounded-card text-sm"
            >
              Próximo bloco ({pendingDomQueue.length} cards restantes) →
            </button>
            <button
              onClick={() => setStarted(false)}
              className="text-muted text-xs hover:text-text transition-colors underline underline-offset-2"
            >
              Parar por aqui
            </button>
          </div>
        </div>
      )
    }

    // Domínio — relatório final (todas as fatias concluídas)
    if (domQueue.length === 0 && pendingDomQueue.length === 0 && domElimCount > 0) {
      const totalMedio   = Object.values(cardAttempts).reduce((s, c) => s + c.medio,   0)
      const totalDificil = Object.values(cardAttempts).reduce((s, c) => s + c.dificil, 0)
      const totalRetries = totalMedio + totalDificil
      const top5 = Object.values(cardAttempts)
        .map(c => ({ ...c, retries: c.medio + c.dificil }))
        .filter(c => c.retries > 0)
        .sort((a, b) => b.retries - a.retries)
        .slice(0, 5)

      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          {modeTabs}

          <div className="bg-surface border border-border rounded-card p-6 text-center space-y-2">
            <div className="text-4xl">🏆</div>
            <div className="text-xl font-bold text-text">Deck dominado!</div>
            <div className="text-sm text-muted">Todos os {domElimCount} cards foram eliminados</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-border rounded-card p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Tempo total</div>
              <div className="text-2xl font-black font-mono text-text">⏱ {formatTime(finalTime)}</div>
            </div>
            <div className="bg-surface border border-warning/30 rounded-card p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Médio</div>
              <div className="text-2xl font-black text-warning">{totalMedio}</div>
              <div className="text-[10px] text-dim">classificações</div>
            </div>
            <div className="bg-surface border border-danger/30 rounded-card p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Difícil</div>
              <div className="text-2xl font-black text-danger">{totalDificil}</div>
              <div className="text-[10px] text-dim">classificações</div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-card px-4 py-3 flex items-center justify-between">
            <span className="text-[12px] text-muted">Média de repetições por card</span>
            <span className="text-[13px] font-bold text-text">
              {domElimCount > 0 ? (totalRetries / domElimCount).toFixed(1) : '0'} voltas
            </span>
          </div>

          {top5.length > 0 && (
            <div className="bg-surface border border-border rounded-card p-4 space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted">
                🔥 Top {top5.length} — Mais repetiram antes de virar Fácil
              </div>
              <div className="space-y-2">
                {top5.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 bg-surface2 rounded-sm px-3 py-2">
                    <span className="text-[13px] font-black text-muted shrink-0 w-4">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ELO_STYLE[c.elo]}`}>
                          {ELO_CARD[c.elo].icon} {c.elo}
                        </span>
                        <span className="text-[10px] text-dim truncate">{c.bloco_tematico}</span>
                      </div>
                      <div className="text-[12px] text-text line-clamp-2">{c.q}</div>
                    </div>
                    <div className="shrink-0 text-right space-y-0.5">
                      <div className="text-[13px] font-black text-text">{c.retries}x</div>
                      <div className="text-[9px] text-warning">{c.medio}M</div>
                      <div className="text-[9px] text-danger">{c.dificil}D</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap pb-2">
            <button
              onClick={() => setStarted(false)}
              className="px-5 py-2 border border-border text-muted text-sm rounded-sm hover:text-text transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={resetMastery}
              className="px-5 py-2 border border-danger/30 text-danger text-sm rounded-sm hover:bg-danger/10 transition-all"
            >
              Recomeçar do zero
            </button>
          </div>
        </div>
      )
    }

    // Domínio — em andamento
    const domRemaining = domQueue.length
    const domProgress  = domTotal > 0 ? Math.max(0, ((domTotal - domRemaining) / domTotal)) * 100 : 0

    const domFacilCount = domTotal - domRemaining

    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {modeTabs}

        {domTotalSlices > 1 && (
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-sm px-4 py-2.5">
            <div>
              <span className="text-[13px] font-black text-amber-400">Bloco {domSliceNum} de {domTotalSlices}</span>
              <span className="text-[11px] text-amber-300/70 ml-2">· {domTotal} cards neste bloco</span>
              {pendingDomQueue.length > 0 && (
                <span className="text-[11px] text-muted ml-2">· {pendingDomQueue.length} aguardando nos próximos blocos</span>
              )}
            </div>
            <span className="text-[12px] font-bold text-amber-400">{domFacilCount}/{domTotal} ✓</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button onClick={() => setStarted(false)} className="text-[11px] text-muted hover:text-text transition-colors">
            ← Filtros
          </button>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="font-mono font-bold text-text bg-surface2 border border-border px-2 py-0.5 rounded-sm">
              ⏱ {formatTime(elapsed)}
            </span>
            <span className="text-success font-bold">{domElimCount} eliminados</span>
          </div>
        </div>

        <div className="space-y-1">
          <div className="bg-surface3 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-success to-emerald-400 transition-all duration-300"
              style={{ width: `${domProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-dim">
            <span>{domFacilCount} de {domTotal} fácil neste bloco</span>
            <span className="text-success">{Math.round(domProgress)}%</span>
          </div>
        </div>

        <MasteryCardView key={domQueue[0].id} card={domQueue[0]} onRate={handleDominioRate} />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════
  // MODO SRS
  // ══════════════════════════════════════════════════════════════════════

  if (!started) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {modeTabs}
        {filterPanel}

        {dueInPool > 0 ? (
          <>
            <div className="bg-surface border border-amber-500/25 rounded-card p-5 space-y-4">
              <SlicePicker total={dueInPool} value={srsNumSlices} onChange={setSrsNumSlices} />
              <button
                onClick={() => startSRS()}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-card hover:opacity-90 transition-opacity text-[14px]"
              >
                {srsNumSlices <= 1
                  ? `Iniciar Revisão SRS (${dueInPool} cards) →`
                  : `Iniciar bloco 1 de ${srsNumSlices} (~${Math.ceil(dueInPool / srsNumSlices)} cards) →`}
              </button>
            </div>
          </>
        ) : (
          <div className="bg-surface border border-border rounded-card p-10 text-center space-y-3">
            <div className="text-4xl">😴</div>
            <div className="text-xl font-bold text-text">Nenhum card pendente</div>
            <div className="text-sm text-muted">Volte mais tarde.</div>
          </div>
        )}
      </div>
    )
  }

  // SRS — fatia concluída, mais fatias a seguir
  if (srsQueue.length === 0 && pendingSRSQueue.length > 0) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {modeTabs}
        <div className="bg-surface border border-border rounded-card p-8 text-center space-y-4">
          <div className="text-3xl">✓</div>
          <div className="text-lg font-bold text-text">
            Bloco {srsSliceNum} de {srsTotalSlices} concluído!
          </div>
          <div className="text-sm text-muted">
            {srsCount} revisados · {pendingSRSQueue.length} cards restantes
          </div>
          <button
            onClick={nextSRSSlice}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-card text-sm"
          >
            Próximo bloco ({pendingSRSQueue.length} cards restantes) →
          </button>
          <button
            onClick={() => setStarted(false)}
            className="text-muted text-xs hover:text-text transition-colors underline underline-offset-2"
          >
            Parar por aqui
          </button>
        </div>
      </div>
    )
  }

  // SRS — tudo revisado
  if (srsQueue.length === 0) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto">
        {modeTabs}
        {filterPanel}
        <div className="bg-surface border border-border rounded-card p-12 text-center space-y-3">
          <div className="text-5xl">{srsCount > 0 ? '🎉' : '😴'}</div>
          <div className="text-xl font-bold text-text">
            {srsCount > 0 ? `${srsCount} card${srsCount !== 1 ? 's' : ''} revisado${srsCount !== 1 ? 's' : ''}!` : 'Nenhum card pendente'}
          </div>
          <div className="text-sm text-muted">
            {srsCount > 0 ? 'Ótimo trabalho! Continue revisando amanhã.' : 'Volte mais tarde.'}
          </div>
          <button onClick={() => setStarted(false)} className="px-5 py-2 border border-border text-muted text-sm rounded-sm hover:text-text transition-colors">
            ← Voltar aos filtros
          </button>
        </div>
      </div>
    )
  }

  const srsRemaining = srsQueue.length
  const srsProgress  = srsTotal > 0 ? ((srsTotal - srsRemaining) / srsTotal) * 100 : 0

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {modeTabs}
      <div className="flex items-center justify-between">
        <button onClick={() => setStarted(false)} className="text-[11px] text-muted hover:text-text transition-colors">← Filtros</button>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="font-mono font-bold text-text bg-surface2 border border-border px-2 py-0.5 rounded-sm">
            ⏱ {formatTime(elapsed)}
          </span>
          <div className="flex items-center gap-2">
            {srsTotalSlices > 1 && (
              <span className="px-2 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold rounded-sm">
                Bloco {srsSliceNum}/{srsTotalSlices}
              </span>
            )}
            <span>{srsTotal - srsRemaining + 1} de {srsTotal} · {srsCount} revisados</span>
          </div>
        </div>
      </div>
      <div className="bg-surface3 rounded-full h-1 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300" style={{ width: `${srsProgress}%` }} />
      </div>
      <CardView key={srsQueue[0].id} card={srsQueue[0]} onRate={handleSrsRate} />
    </div>
  )
}
