import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import { useMedals, type MatMedal } from '@/hooks/useMedals'

const DEFAULT_TARGET = 75
const LS_KEY = 'studybi_kpi_targets'

function loadTargets(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} }
}
function saveTargets(t: Record<string, number>) {
  localStorage.setItem(LS_KEY, JSON.stringify(t))
}

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

interface MatKpi {
  mat:      string
  disc:     string
  total:    number
  correct:  number
  taxa:     number
  lastTaxa: number | null  // taxa da sessão mais recente para essa matéria
}

function TrendBadge({ current, last }: { current: number; last: number | null }) {
  if (last === null) return <span className="text-[10px] text-muted">—</span>
  const diff = current - last
  if (Math.abs(diff) < 2) return <span className="text-[10px] text-muted">= estável</span>
  return diff > 0
    ? <span className="text-[10px] text-success font-bold">↑ +{diff}%</span>
    : <span className="text-[10px] text-danger font-bold">↓ {diff}%</span>
}

function KpiCard({ kpi, target, onSetTarget, medal }: {
  kpi: MatKpi
  target: number
  onSetTarget: (mat: string, val: number) => void
  medal?: MatMedal
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(String(target))

  const gap      = target - kpi.taxa
  const reached  = kpi.taxa >= target
  const barColor = reached ? 'bg-success' : kpi.taxa >= 50 ? 'bg-warning' : 'bg-danger'
  const taxaColor = reached ? 'text-success' : kpi.taxa >= 50 ? 'text-warning' : 'text-danger'

  function commit() {
    const v = Math.min(100, Math.max(1, parseInt(draft) || DEFAULT_TARGET))
    onSetTarget(kpi.mat, v)
    setDraft(String(v))
    setEditing(false)
  }

  return (
    <div
      className="bg-surface rounded-card px-4 py-3 space-y-2"
      style={medal
        ? { border: `1px solid ${medal.medal.border}`, borderTop: `3px solid ${medal.medal.color}` }
        : { border: '1px solid var(--tw-border-color, #cbd5e1)' }
      }
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="text-[13px] font-bold text-text truncate">{kpi.mat}</div>
            {medal && (
              <span
                title={`${medal.medal.label} — ${medal.medal.desc}`}
                className="text-[14px] leading-none shrink-0 cursor-help"
              >
                {medal.medal.icon}
              </span>
            )}
          </div>
          <div className="text-[10px] text-muted truncate">{kpi.disc}</div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <TrendBadge current={kpi.taxa} last={kpi.lastTaxa} />
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px]">
          <span className={`font-black text-[15px] tabular-nums ${taxaColor}`}>{kpi.taxa}%</span>
          <div className="flex items-center gap-1 text-muted">
            {editing ? (
              <div className="flex items-center gap-1">
                <span>Meta:</span>
                <input
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onBlur={commit}
                  onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
                  className="w-10 text-center bg-surface2 border border-primary rounded text-[11px] text-text outline-none px-1 py-0.5"
                />
                <span>%</span>
              </div>
            ) : (
              <button onClick={() => { setDraft(String(target)); setEditing(true) }}
                className="hover:text-text transition-colors"
                title="Editar meta"
              >
                Meta: <span className="font-bold text-text">{target}%</span> ✎
              </button>
            )}
          </div>
        </div>

        {/* Track com marcador de meta */}
        <div className="relative h-2 bg-surface3 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, kpi.taxa)}%` }}
          />
          {/* Linha da meta */}
          <div className="absolute top-0 h-full w-px bg-white/40"
            style={{ left: `${Math.min(100, target)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-muted">
          <span>{kpi.correct}/{kpi.total} questões</span>
          <span className={reached ? 'text-success font-bold' : 'text-muted'}>
            {reached ? '✓ Meta atingida' : `faltam ${gap}pp`}
          </span>
        </div>
      </div>
    </div>
  )
}

export function KpiPanel() {
  const sessionStats = useStore(s => s.sessionStats)
  const sessions     = useStore(s => s.sessions)
  const [targets, setTargets] = useState<Record<string, number>>(loadTargets)
  const [showAll, setShowAll] = useState(false)
  const medals       = useMedals()
  const medalByMat   = useMemo(() => new Map(medals.map(m => [m.mat, m])), [medals])

  const kpis = useMemo((): MatKpi[] => {
    // Agrupa sessionStats por mat
    const map = new Map<string, { disc: string; total: number; correct: number }>()
    for (const s of sessionStats) {
      const key = s.mat
      const cur = map.get(key) ?? { disc: s.disc, total: 0, correct: 0 }
      map.set(key, { disc: cur.disc, total: cur.total + s.total, correct: cur.correct + s.correct })
    }

    // Taxa da sessão mais recente por matéria (usa sessions recentes)
    const lastByMat = new Map<string, number>()
    const sorted = [...sessions].sort((a, b) => b.ts - a.ts)
    for (const s of sorted) {
      if (!lastByMat.has(s.mat)) lastByMat.set(s.mat, pct(s.correct, s.total))
    }

    return [...map.entries()]
      .map(([mat, v]) => ({
        mat,
        disc:     v.disc,
        total:    v.total,
        correct:  v.correct,
        taxa:     pct(v.correct, v.total),
        lastTaxa: lastByMat.get(mat) ?? null,
      }))
      .sort((a, b) => b.total - a.total) // mais estudadas primeiro
  }, [sessionStats, sessions])

  function handleSetTarget(mat: string, val: number) {
    setTargets(prev => {
      const next = { ...prev, [mat]: val }
      saveTargets(next)
      return next
    })
  }

  const visible = showAll ? kpis : kpis.slice(0, 6)
  const belowTarget = kpis.filter(k => k.taxa < (targets[k.mat] ?? DEFAULT_TARGET)).length

  if (kpis.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-text">KPIs por Matéria</span>
          {belowTarget > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/20 text-danger border border-danger/30">
              {belowTarget} abaixo da meta
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted">clique na meta para editar</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {visible.map(k => (
          <KpiCard
            key={k.mat}
            kpi={k}
            target={targets[k.mat] ?? DEFAULT_TARGET}
            onSetTarget={handleSetTarget}
            medal={medalByMat.get(k.mat)}
          />
        ))}
      </div>

      {kpis.length > 6 && (
        <button onClick={() => setShowAll(v => !v)}
          className="w-full text-[11px] text-muted hover:text-text py-1.5 border border-border/50 rounded-card hover:border-border transition-colors"
        >
          {showAll ? `▲ Mostrar menos` : `▼ Ver todas (${kpis.length - 6} matérias ocultas)`}
        </button>
      )}
    </div>
  )
}
