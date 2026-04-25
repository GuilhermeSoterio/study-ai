import { useMemo } from 'react'
import { useStore } from '@/store'
import { useEliteDays, ELITE_TAXA, ELITE_MIN_Q } from '@/hooks/useMedals'

// ── Utils ─────────────────────────────────────────────────────────────────────

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

function dateRange(daysAgoStart: number, daysAgoEnd: number): { start: string; end: string } {
  const today = new Date()
  const end   = new Date(today); end.setDate(today.getDate() - daysAgoEnd)
  const start = new Date(today); start.setDate(today.getDate() - daysAgoStart)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

function deltaColor(d: number) {
  if (d > 0)  return 'text-success'
  if (d < 0)  return 'text-danger'
  return 'text-muted'
}
function deltaLabel(d: number, suffix = '') {
  if (d === 0) return '= igual'
  return `${d > 0 ? '▲' : '▼'} ${Math.abs(d)}${suffix}`
}
function taxaColor(t: number) {
  return t >= 75 ? 'text-success' : t >= 50 ? 'text-warning' : 'text-danger'
}

// ── useWeekStats ──────────────────────────────────────────────────────────────

interface MatWeek {
  mat:     string
  disc:    string
  total:   number
  correct: number
  taxa:    number
  sessions: number
}

interface DiscWeek {
  disc:    string
  total:   number
  correct: number
  taxa:    number
}

interface WeekStats {
  total:    number
  correct:  number
  taxa:     number
  sessions: number
  byMat:    MatWeek[]
  byDisc:   DiscWeek[]
  goalDays: number          // days that hit config.daily
  dates:    Set<string>
}

function useWeekStats(start: string, end: string): WeekStats {
  const sessionStats = useStore(s => s.sessionStats)
  const config       = useStore(s => s.config)

  return useMemo(() => {
    const inRange = sessionStats.filter(s => s.date >= start && s.date <= end)

    // per-day total for goal tracking
    const byDate = new Map<string, number>()
    for (const s of inRange) byDate.set(s.date, (byDate.get(s.date) ?? 0) + s.total)
    const goalDays = [...byDate.values()].filter(v => v >= config.daily).length

    const matMap  = new Map<string, { disc: string; total: number; correct: number; sessions: number }>()
    const discMap = new Map<string, { total: number; correct: number }>()

    for (const s of inRange) {
      const mc = matMap.get(s.mat) ?? { disc: s.disc, total: 0, correct: 0, sessions: 0 }
      matMap.set(s.mat, { disc: mc.disc, total: mc.total + s.total, correct: mc.correct + s.correct, sessions: mc.sessions + 1 })
      const dc = discMap.get(s.disc) ?? { total: 0, correct: 0 }
      discMap.set(s.disc, { total: dc.total + s.total, correct: dc.correct + s.correct })
    }

    const total   = inRange.reduce((s, r) => s + r.total, 0)
    const correct = inRange.reduce((s, r) => s + r.correct, 0)

    return {
      total,
      correct,
      taxa:     pct(correct, total),
      sessions: inRange.length,
      goalDays,
      dates:    new Set(inRange.map(s => s.date)),
      byMat:  [...matMap.entries()].map(([mat, v]) => ({ mat, ...v, taxa: pct(v.correct, v.total) }))
                .sort((a, b) => b.total - a.total),
      byDisc: [...discMap.entries()].map(([disc, v]) => ({ disc, ...v, taxa: pct(v.correct, v.total) }))
                .sort((a, b) => b.total - a.total),
    }
  }, [sessionStats, config, start, end])
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, delta, suffix = '', highlight = false }: {
  label: string; value: string | number; delta?: number; suffix?: string; highlight?: boolean
}) {
  return (
    <div className={`rounded-card px-4 py-3 text-center space-y-0.5 ${
      highlight
        ? 'bg-surface border-2 border-accent/40'
        : 'bg-surface border border-border'
    }`}>
      <div className={`text-[22px] font-black tabular-nums ${highlight ? 'text-accent' : 'text-text'}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted uppercase tracking-wider">{label}</div>
      {delta !== undefined && (
        <div className={`text-[10px] font-bold ${deltaColor(delta)}`}>
          {deltaLabel(delta, suffix)} vs sem. ant.
        </div>
      )}
    </div>
  )
}

// ── Frentes (mat comparison) ──────────────────────────────────────────────────

interface FrenteChange {
  mat:   string
  disc:  string
  now:   number
  prev:  number
  diff:  number
}

function FrenteRow({ f, dir }: { f: FrenteChange; dir: 'up' | 'down' }) {
  const up = dir === 'up'
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0 text-[12px]">
      <span className="text-base shrink-0">{up ? '✅' : '⚠️'}</span>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-text truncate">{f.mat}</div>
        <div className="text-[10px] text-muted">{f.disc}</div>
      </div>
      <div className="text-right shrink-0">
        <div className={`font-black tabular-nums ${taxaColor(f.now)}`}>{f.now}%</div>
        <div className={`text-[10px] font-bold ${up ? 'text-success' : 'text-danger'}`}>
          {up ? '▲' : '▼'} {Math.abs(f.diff)}pp
        </div>
      </div>
      <div className="w-24 shrink-0 space-y-0.5">
        <div className="flex items-center gap-1">
          <div className="flex-1 bg-surface3 h-1 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-muted/50" style={{ width: `${f.prev}%` }} />
          </div>
          <span className="text-[9px] text-muted w-6 text-right">{f.prev}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex-1 bg-surface3 h-1 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${f.now}%`, background: up ? '#4a7c59' : '#c0392b' }}
            />
          </div>
          <span className={`text-[9px] font-bold w-6 text-right ${up ? 'text-success' : 'text-danger'}`}>{f.now}%</span>
        </div>
      </div>
    </div>
  )
}

// ── Daily goal strip ──────────────────────────────────────────────────────────

function GoalStrip({ thisWeek, lastWeek, eliteDates }: {
  thisWeek: WeekStats; lastWeek: WeekStats; eliteDates: Set<string>
}) {
  const config = useStore(s => s.config)
  const days   = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  const byDate = useMemo(() => {
    const map = new Map<string, number>()
    ;[...thisWeek.dates].forEach(date => {
      // count questions from dates set
    })
    return map
  }, [thisWeek])

  // rebuild per-day totals from sessionStats for strip
  const sessionStats = useStore(s => s.sessionStats)
  const dailyTotals  = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of sessionStats) map.set(s.date, (map.get(s.date) ?? 0) + s.total)
    return map
  }, [sessionStats])

  return (
    <div className="bg-surface border border-border rounded-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-text">Meta diária — últimos 7 dias</span>
        <span className="text-[11px] text-muted">{config.daily}q/dia</span>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(date => {
          const count   = dailyTotals.get(date) ?? 0
          const hitGoal = count >= config.daily
          const isElite = eliteDates.has(date)
          const label   = date.slice(5)

          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm py-2 flex flex-col items-center justify-center transition-colors"
                style={{
                  background: isElite
                    ? 'rgba(212,160,23,0.15)'
                    : hitGoal
                    ? 'rgba(74,124,89,0.12)'
                    : count > 0
                    ? 'rgba(74,124,89,0.05)'
                    : '#f1f5f9',
                  border: isElite
                    ? '1.5px solid rgba(212,160,23,0.5)'
                    : hitGoal
                    ? '1px solid rgba(74,124,89,0.3)'
                    : '1px solid #e2e8f0',
                }}
                title={`${date}: ${count}q${isElite ? ' · ⭐ Elite' : ''}`}
              >
                <span className="text-[10px] font-mono text-muted">{label}</span>
                <span className={`text-[13px] font-black tabular-nums ${
                  isElite ? 'text-accent' : hitGoal ? 'text-success' : count > 0 ? 'text-muted' : 'text-dim'
                }`}>
                  {count > 0 ? count : '—'}
                </span>
                {isElite && <span className="text-[9px]">⭐</span>}
                {!isElite && hitGoal && <span className="text-[9px] text-success">✓</span>}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex gap-4 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#4a7c59', opacity: 0.5 }} />
          Meta atingida
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: '#d4a017', opacity: 0.6 }} />
          Dia de elite ≥{ELITE_TAXA}%
        </span>
      </div>
    </div>
  )
}

// ── Disc table ────────────────────────────────────────────────────────────────

function DiscTable({ discs }: { discs: DiscWeek[] }) {
  if (discs.length === 0) return null
  const max = discs[0].total

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="px-4 py-2.5 bg-surface2 border-b border-border text-[11px] font-bold text-text">
        Por disciplina
      </div>
      {discs.map(d => (
        <div key={d.disc} className="flex items-center gap-3 px-4 py-2.5 border-b border-border/40 last:border-0">
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-semibold text-text truncate">{d.disc}</div>
          </div>
          <div className="w-32 bg-surface3 rounded-full h-1.5 overflow-hidden shrink-0">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.total / max) * 100}%`, background: '#4a7c59', opacity: 0.6 }}
            />
          </div>
          <span className="text-[11px] text-muted tabular-nums w-8 text-right shrink-0">{d.total}q</span>
          <span className={`text-[12px] font-black tabular-nums w-10 text-right shrink-0 ${taxaColor(d.taxa)}`}>
            {d.taxa}%
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function WeeklyReport() {
  const thisW   = dateRange(6, 0)
  const lastW   = dateRange(13, 7)
  const thisWeek = useWeekStats(thisW.start, thisW.end)
  const lastWeek = useWeekStats(lastW.start, lastW.end)
  const eliteDays = useEliteDays(ELITE_TAXA, ELITE_MIN_Q)
  const eliteDates = useMemo(() => new Set(eliteDays.map(d => d.date)), [eliteDays])
  const eliteThisWeek = eliteDays.filter(d => d.date >= thisW.start && d.date <= thisW.end).length

  // Frente changes
  const frenteChanges = useMemo((): { up: FrenteChange[]; down: FrenteChange[] } => {
    const prevMap = new Map(lastWeek.byMat.map(m => [m.mat, m]))
    const up: FrenteChange[]   = []
    const down: FrenteChange[] = []

    for (const m of thisWeek.byMat) {
      const prev = prevMap.get(m.mat)
      if (!prev || prev.total < 3 || m.total < 3) continue
      const diff = m.taxa - prev.taxa
      if (Math.abs(diff) < 3) continue
      const entry: FrenteChange = { mat: m.mat, disc: m.disc, now: m.taxa, prev: prev.taxa, diff }
      if (diff > 0) up.push(entry)
      else          down.push(entry)
    }

    return {
      up:   up.sort((a, b) => b.diff - a.diff).slice(0, 5),
      down: down.sort((a, b) => a.diff - b.diff).slice(0, 5),
    }
  }, [thisWeek, lastWeek])

  // Top & bottom performers this week
  const performers = useMemo(() => {
    const valid = thisWeek.byMat.filter(m => m.total >= 5)
    const top  = [...valid].sort((a, b) => b.taxa - a.taxa).slice(0, 3)
    const bot  = [...valid].sort((a, b) => a.taxa - b.taxa).slice(0, 3)
    return { top, bot }
  }, [thisWeek])

  // Week number
  const weekNum = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
    const jan4 = new Date(d.getFullYear(), 0, 4)
    return 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7)
  }, [])

  if (thisWeek.total === 0 && lastWeek.total === 0) {
    return (
      <div className="py-20 text-center text-muted text-sm">
        Nenhuma sessão nos últimos 14 dias para gerar o relatório.
      </div>
    )
  }

  const taxaDelta = thisWeek.taxa - lastWeek.taxa

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-bold text-text">Relatório Semanal</div>
          <div className="text-[11px] text-muted">
            Semana {weekNum} · {thisW.start} → {thisW.end}
          </div>
        </div>
        {thisWeek.total === 0 && (
          <span className="text-[11px] text-warning font-bold">Nenhuma sessão esta semana</span>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Questões"
          value={thisWeek.total.toLocaleString('pt-BR')}
          delta={thisWeek.total - lastWeek.total}
          suffix="q"
        />
        <KpiCard
          label="Acerto médio"
          value={`${thisWeek.taxa}%`}
          delta={taxaDelta}
          suffix="pp"
          highlight={thisWeek.taxa >= 80}
        />
        <KpiCard
          label="Sessões"
          value={thisWeek.sessions}
          delta={thisWeek.sessions - lastWeek.sessions}
        />
        <KpiCard
          label="Dias de elite ⭐"
          value={eliteThisWeek}
          highlight={eliteThisWeek > 0}
        />
      </div>

      {/* Meta diária strip */}
      <GoalStrip thisWeek={thisWeek} lastWeek={lastWeek} eliteDates={eliteDates} />

      {/* Frentes */}
      {(frenteChanges.up.length > 0 || frenteChanges.down.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {frenteChanges.up.length > 0 && (
            <div className="bg-surface border border-success/25 rounded-card p-4">
              <div className="text-[11px] font-black text-success uppercase tracking-wider mb-2">
                ✅ Frentes recuperadas
              </div>
              {frenteChanges.up.map(f => <FrenteRow key={f.mat} f={f} dir="up" />)}
            </div>
          )}
          {frenteChanges.down.length > 0 && (
            <div className="bg-surface border border-danger/25 rounded-card p-4">
              <div className="text-[11px] font-black text-danger uppercase tracking-wider mb-2">
                ⚠️ Frentes afundando
              </div>
              {frenteChanges.down.map(f => <FrenteRow key={f.mat} f={f} dir="down" />)}
            </div>
          )}
        </div>
      )}

      {/* Top & bottom performers */}
      {(performers.top.length > 0 || performers.bot.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {performers.top.length > 0 && (
            <div className="bg-surface border border-border rounded-card p-4 space-y-2">
              <div className="text-[11px] font-black text-success uppercase tracking-wider">🏆 Melhor da semana</div>
              {performers.top.map((m, i) => (
                <div key={m.mat} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted w-4 shrink-0">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-text truncate">{m.mat}</div>
                    <div className="text-[10px] text-muted">{m.disc} · {m.total}q</div>
                  </div>
                  <span className={`text-[14px] font-black tabular-nums ${taxaColor(m.taxa)}`}>{m.taxa}%</span>
                </div>
              ))}
            </div>
          )}
          {performers.bot.length > 0 && (
            <div className="bg-surface border border-border rounded-card p-4 space-y-2">
              <div className="text-[11px] font-black text-danger uppercase tracking-wider">⚠️ Para reforçar</div>
              {performers.bot.map((m, i) => (
                <div key={m.mat} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted w-4 shrink-0">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12px] font-semibold text-text truncate">{m.mat}</div>
                    <div className="text-[10px] text-muted">{m.disc} · {m.total}q</div>
                  </div>
                  <span className={`text-[14px] font-black tabular-nums ${taxaColor(m.taxa)}`}>{m.taxa}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Por disciplina */}
      <DiscTable discs={thisWeek.byDisc} />
    </div>
  )
}
