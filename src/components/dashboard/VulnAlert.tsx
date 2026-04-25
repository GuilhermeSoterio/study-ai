import { useMemo, useState } from 'react'
import { useStore } from '@/store'

// ── Thresholds (configuráveis via UI) ─────────────────────────────────────────

const MIN_QUESTIONS = 5

// ── Types ─────────────────────────────────────────────────────────────────────

type Trigger = 'accuracy' | 'inactive'

interface VulnEntry {
  mat:       string
  disc:      string
  taxa:      number
  total:     number
  lastDate:  string
  daysSince: number
  triggers:  Trigger[]
}

// ── Hook ──────────────────────────────────────────────────────────────────────

function useVulnerabilities(accuracyThreshold: number, inactivityDays: number): VulnEntry[] {
  const sessionStats = useStore(s => s.sessionStats)

  return useMemo(() => {
    const statsMap = new Map<string, {
      disc: string; total: number; correct: number; lastDate: string
    }>()

    for (const s of sessionStats) {
      const cur = statsMap.get(s.mat) ?? { disc: s.disc, total: 0, correct: 0, lastDate: s.date }
      statsMap.set(s.mat, {
        disc:     cur.disc,
        total:    cur.total + s.total,
        correct:  cur.correct + s.correct,
        lastDate: s.date > cur.lastDate ? s.date : cur.lastDate,
      })
    }

    const today   = new Date()
    const entries: VulnEntry[] = []

    for (const [mat, v] of statsMap) {
      if (v.total < MIN_QUESTIONS) continue

      const taxa     = Math.round((v.correct / v.total) * 100)
      const last     = new Date(v.lastDate + 'T00:00:00')
      const daysSince = Math.floor((today.getTime() - last.getTime()) / 86400000)
      const triggers: Trigger[] = []

      if (taxa < accuracyThreshold)   triggers.push('accuracy')
      if (daysSince >= inactivityDays) triggers.push('inactive')

      if (triggers.length === 0) continue

      entries.push({ mat, disc: v.disc, taxa, total: v.total, lastDate: v.lastDate, daysSince, triggers })
    }

    // duplo trigger primeiro, depois por taxa crescente
    return entries.sort((a, b) => {
      if (b.triggers.length !== a.triggers.length) return b.triggers.length - a.triggers.length
      return a.taxa - b.taxa
    })
  }, [sessionStats, accuracyThreshold, inactivityDays])
}

// ── Entry row ─────────────────────────────────────────────────────────────────

function TriggerBadge({ type, taxa, days }: { type: Trigger; taxa: number; days: number }) {
  if (type === 'accuracy') {
    return (
      <span className="text-[9px] font-black px-1.5 py-0.5 rounded border bg-danger/10 text-danger border-danger/30 whitespace-nowrap">
        ⚠ {taxa}% acerto
      </span>
    )
  }
  return (
    <span className="text-[9px] font-black px-1.5 py-0.5 rounded border bg-warning/10 text-warning border-warning/30 whitespace-nowrap">
      💤 {days}d sem sessão
    </span>
  )
}

function VulnRow({ entry }: { entry: VulnEntry }) {
  const both = entry.triggers.length === 2
  return (
    <div className={`flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0 ${both ? 'bg-danger/[0.03] -mx-4 px-4 rounded-sm' : ''}`}>
      {/* Mat info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] font-semibold text-text">{entry.mat}</span>
          {entry.triggers.map(t => (
            <TriggerBadge key={t} type={t} taxa={entry.taxa} days={entry.daysSince} />
          ))}
        </div>
        <div className="text-[10px] text-muted mt-0.5">{entry.disc}</div>
      </div>

      {/* Bar + metrics */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 bg-surface3 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${entry.taxa}%`,
              background: entry.taxa < 40 ? '#c0392b' : entry.taxa < 60 ? '#d4a017' : '#4a7c59',
            }}
          />
        </div>
        <span className="text-[11px] font-black tabular-nums w-8 text-right"
          style={{ color: entry.taxa < 40 ? '#c0392b' : entry.taxa < 60 ? '#d4a017' : '#4a7c59' }}>
          {entry.taxa}%
        </span>
        <span className="text-[10px] text-muted w-7 text-right tabular-nums">{entry.total}q</span>
      </div>
    </div>
  )
}

// ── Config row ────────────────────────────────────────────────────────────────

function ThresholdConfig({
  accuracy, setAccuracy, days, setDays,
}: {
  accuracy: number; setAccuracy: (v: number) => void
  days: number;     setDays:     (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3 text-[10px] text-muted flex-wrap">
      <span className="font-bold">Gatilhos:</span>
      <label className="flex items-center gap-1">
        acerto &lt;
        <input
          type="number" min={10} max={90} value={accuracy}
          onChange={e => setAccuracy(Number(e.target.value) || 50)}
          className="w-10 text-center bg-surface2 border border-border rounded px-1 py-0.5 text-[10px] text-text outline-none focus:border-primary"
        />
        %
      </label>
      <span className="text-dim">·</span>
      <label className="flex items-center gap-1">
        inativo &gt;
        <input
          type="number" min={1} max={60} value={days}
          onChange={e => setDays(Number(e.target.value) || 7)}
          className="w-10 text-center bg-surface2 border border-border rounded px-1 py-0.5 text-[10px] text-text outline-none focus:border-primary"
        />
        dias
      </label>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function VulnAlert() {
  const [accuracy, setAccuracy] = useState(50)
  const [days,     setDays]     = useState(7)
  const [showAll,  setShowAll]  = useState(false)
  const [showCfg,  setShowCfg]  = useState(false)

  const vulns  = useVulnerabilities(accuracy, days)
  const dual   = vulns.filter(v => v.triggers.length === 2).length
  const visible = showAll ? vulns : vulns.slice(0, 5)

  if (vulns.length === 0) return null

  return (
    <div className="bg-surface border border-danger/25 rounded-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Pulsing badge */}
          <span
            className="vuln-pulse inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full text-white"
            style={{ background: '#c0392b' }}
          >
            ● FRENTE VULNERÁVEL
          </span>
          <span className="text-[13px] font-bold text-text">
            {vulns.length} matéria{vulns.length > 1 ? 's' : ''} em alerta
          </span>
          {dual > 0 && (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30">
              {dual} duplo
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCfg(v => !v)}
          className="text-[10px] text-muted hover:text-text transition-colors"
        >
          {showCfg ? '▲ fechar' : '⚙ ajustar gatilhos'}
        </button>
      </div>

      {showCfg && (
        <ThresholdConfig
          accuracy={accuracy} setAccuracy={setAccuracy}
          days={days}         setDays={setDays}
        />
      )}

      {/* Entries */}
      <div>
        {visible.map(v => <VulnRow key={v.mat} entry={v} />)}
      </div>

      {vulns.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full text-[11px] text-muted hover:text-text py-1 border border-border/50 rounded-sm hover:border-border transition-colors"
        >
          {showAll ? '▲ Mostrar menos' : `▼ Ver todos (${vulns.length - 5} ocultos)`}
        </button>
      )}
    </div>
  )
}
