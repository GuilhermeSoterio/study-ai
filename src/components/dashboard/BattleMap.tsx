import { useMemo, useState } from 'react'
import { useStore } from '@/store'

// ── Status ────────────────────────────────────────────────────────────────────

type Status = 'consolidada' | 'instavel' | 'pressao'

const STATUS: Record<Status, { label: string; sublabel: string; color: string; border: string; bg: string }> = {
  consolidada: { label: 'Consolidada', sublabel: '> 70%',   color: '#4a7c59', border: '#3a6648', bg: 'rgba(74,124,89,0.08)'  },
  instavel:    { label: 'Instável',    sublabel: '50–70%',  color: '#d4a017', border: '#b8860b', bg: 'rgba(212,160,23,0.08)' },
  pressao:     { label: 'Sob Pressão', sublabel: '< 50%',   color: '#c0392b', border: '#a93226', bg: 'rgba(192,57,43,0.08)'  },
}

function getStatus(taxa: number): Status {
  if (taxa > 70) return 'consolidada'
  if (taxa >= 50) return 'instavel'
  return 'pressao'
}

// ── Data ──────────────────────────────────────────────────────────────────────

interface MatNode {
  mat:    string
  total:  number
  correct: number
  taxa:   number
  status: Status
}

interface DiscZone {
  disc:   string
  mats:   MatNode[]
  total:  number
  taxa:   number
  status: Status
}

function useBattleMap(): DiscZone[] {
  const sessions = useStore(s => s.sessionStats)

  return useMemo(() => {
    // disc → mat → { total, correct }
    const discMap = new Map<string, Map<string, { total: number; correct: number }>>()

    for (const s of sessions) {
      if (!discMap.has(s.disc)) discMap.set(s.disc, new Map())
      const inner = discMap.get(s.disc)!
      const cur   = inner.get(s.mat) ?? { total: 0, correct: 0 }
      inner.set(s.mat, { total: cur.total + s.total, correct: cur.correct + s.correct })
    }

    const zones: DiscZone[] = []
    for (const [disc, matMap] of discMap) {
      const mats: MatNode[] = [...matMap.entries()]
        .map(([mat, v]) => {
          const taxa = v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0
          return { mat, ...v, taxa, status: getStatus(taxa) }
        })
        .sort((a, b) => b.total - a.total)

      const total   = mats.reduce((s, m) => s + m.total, 0)
      const correct = mats.reduce((s, m) => s + m.correct, 0)
      const taxa    = total > 0 ? Math.round((correct / total) * 100) : 0

      zones.push({ disc, mats, total, taxa, status: getStatus(taxa) })
    }

    return zones.sort((a, b) => {
    // pressão → instável → consolidada
    const order: Record<Status, number> = { pressao: 0, instavel: 1, consolidada: 2 }
    return order[a.status] - order[b.status]
  })
  }, [sessions])
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function MatBlock({ node }: { node: MatNode }) {
  const [hover, setHover] = useState(false)
  const cfg   = STATUS[node.status]
  const size  = Math.max(56, Math.round(Math.sqrt(node.total) * 9))

  return (
    <div
      className="relative rounded-sm cursor-default transition-transform hover:scale-105"
      style={{
        width: size,
        height: size,
        background: cfg.color,
        border: `2px solid ${cfg.border}`,
        flexShrink: 0,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Content */}
      <div className="absolute inset-0 p-1 flex flex-col justify-between overflow-hidden">
        <div className="text-[9px] font-bold text-white/90 leading-tight line-clamp-2">
          {node.mat}
        </div>
        <div className="text-[13px] font-black text-white tabular-nums leading-none">
          {node.taxa}%
        </div>
      </div>

      {/* Tooltip */}
      {hover && (
        <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap">
          <div className="bg-text text-surface text-[11px] font-semibold rounded px-2.5 py-1.5 shadow-lg leading-snug">
            <div className="font-black">{node.mat}</div>
            <div className="text-white/70">{cfg.label} · {node.taxa}%</div>
            <div className="text-white/50">{node.correct}/{node.total} questões</div>
          </div>
          <div className="w-2 h-2 bg-text rotate-45 mx-auto -mt-1" />
        </div>
      )}
    </div>
  )
}

// ── Disc Zone ─────────────────────────────────────────────────────────────────

function DiscZoneCard({ zone }: { zone: DiscZone }) {
  const cfg = STATUS[zone.status]

  return (
    <div
      className="rounded-card p-3 space-y-2"
      style={{
        background:  cfg.bg,
        border:      `1px solid ${cfg.border}55`,
        borderLeft:  `4px solid ${cfg.color}`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] font-black text-text truncate">{zone.disc}</div>
          <div className="text-[10px] font-semibold" style={{ color: cfg.color }}>
            {cfg.label} · {zone.total}q
          </div>
        </div>
        <div className="text-[20px] font-black tabular-nums shrink-0" style={{ color: cfg.color }}>
          {zone.taxa}%
        </div>
      </div>

      {/* Mat blocks */}
      <div className="flex flex-wrap gap-1.5">
        {zone.mats.map(m => (
          <MatBlock key={m.mat} node={m} />
        ))}
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {(Object.entries(STATUS) as [Status, typeof STATUS[Status]][]).map(([key, cfg]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.color }} />
          <span className="text-[10px] text-muted">
            <span className="font-bold">{cfg.label}</span> {cfg.sublabel}
          </span>
        </div>
      ))}
      <span className="text-[10px] text-dim">· bloco ∝ volume</span>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function BattleMap() {
  const zones = useBattleMap()

  if (zones.length === 0) return null

  const emPressao    = zones.filter(z => z.status === 'pressao').length
  const consolidadas = zones.filter(z => z.status === 'consolidada').length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-bold text-text">🗺️ Mapa de Frentes</span>
          {emPressao > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/30">
              {emPressao} sob pressão
            </span>
          )}
          {consolidadas > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/30">
              {consolidadas} consolidada{consolidadas > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <Legend />
      </div>

      {/* Grid de zonas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {zones.map(z => (
          <DiscZoneCard key={z.disc} zone={z} />
        ))}
      </div>
    </div>
  )
}
