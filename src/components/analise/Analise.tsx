import { useMemo, useState } from 'react'
import { Line, Chart as MixedChart } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Tooltip, Filler,
} from 'chart.js'
import { useStore } from '@/store'
import { localDate } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import type { SessionStat } from '@/types'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler)

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

interface Point { date: string; taxa: number; total: number; correct: number }

// ─── Semana atual vs anterior ─────────────────────────────────────────────────

function isoMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

interface WeekDay { label: string; date: string; total: number; correct: number; acc: number | null }

function buildWeek(monday: Date, stats: SessionStat[]): WeekDay[] {
  return DAY_LABELS.map((label, i) => {
    const d    = new Date(monday)
    d.setDate(d.getDate() + i)
    const date = localDate(d)
    const rows = stats.filter(s => s.date === date)
    const total   = rows.reduce((s, r) => s + r.total,   0)
    const correct = rows.reduce((s, r) => s + r.correct, 0)
    return { label, date, total, correct, acc: total > 0 ? pct(correct, total) : null }
  })
}

function WeekCompareSection() {
  const stats   = useStore(s => s.sessionStats)
  const { dark } = useTheme()

  const { curr, prev } = useMemo(() => {
    const mon     = isoMonday(new Date())
    const prevMon = new Date(mon)
    prevMon.setDate(prevMon.getDate() - 7)
    return { curr: buildWeek(mon, stats), prev: buildWeek(prevMon, stats) }
  }, [stats])

  const sumQ   = (days: WeekDay[]) => days.reduce((s, d) => s + d.total,   0)
  const sumC   = (days: WeekDay[]) => days.reduce((s, d) => s + d.correct, 0)
  const accOf  = (q: number, c: number) => q > 0 ? Math.round((c / q) * 100) : 0

  const currQ   = sumQ(curr);  const currC = sumC(curr);  const currAcc = accOf(currQ, currC)
  const prevQ   = sumQ(prev);  const prevC = sumC(prev);  const prevAcc = accOf(prevQ, prevC)
  const deltaQ   = currQ - prevQ
  const deltaAcc = currAcc - prevAcc
  const hasPrev  = prevQ > 0

  if (currQ === 0 && !hasPrev) return null

  const chartData = {
    labels: DAY_LABELS,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Sem. anterior',
        data:            prev.map(d => d.total),
        backgroundColor: '#94a3b828',
        borderColor:     '#94a3b855',
        borderWidth: 1,
        borderRadius: 3,
        yAxisID: 'y',
        order: 3,
      },
      {
        type: 'bar' as const,
        label: 'Esta semana',
        data:            curr.map(d => d.total),
        backgroundColor: '#4a7c5988',
        borderColor:     '#4a7c59',
        borderWidth: 1,
        borderRadius: 3,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Acurácia (atual)',
        data:         curr.map(d => d.acc),
        borderColor:  '#d4a017',
        borderWidth:  2,
        pointRadius:  curr.map(d => d.total > 0 ? 4 : 0),
        pointBackgroundColor: curr.map(d => d.acc !== null ? taxaColor(d.acc) : 'transparent'),
        pointBorderColor: 'transparent',
        backgroundColor: 'transparent',
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
        spanGaps: false,
      },
      {
        type: 'line' as const,
        label: 'Acurácia (anterior)',
        data:         prev.map(d => d.acc),
        borderColor:  '#94a3b870',
        borderWidth:  1.5,
        borderDash:   [4, 4],
        pointRadius:  prev.map(d => d.total > 0 ? 3 : 0),
        pointBackgroundColor: '#94a3b8',
        pointBorderColor: 'transparent',
        backgroundColor: 'transparent',
        tension: 0.3,
        yAxisID: 'y1',
        order: 1,
        spanGaps: false,
      },
    ],
  }

  const tooltipBg  = dark ? '#161b22' : '#ffffff'
  const tooltipBdr = dark ? '#30363d' : '#cbd5e1'
  const titleClr   = dark ? '#e6edf3' : '#0f172a'
  const bodyClr    = dark ? '#8b949e' : '#64748b'
  const gridClr    = dark ? 'rgba(48,54,61,0.4)' : '#cbd5e122'
  const tickClr    = dark ? '#8b949e' : '#64748b'

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: tooltipBdr,
        borderWidth: 1,
        titleColor: titleClr,
        bodyColor:  bodyClr,
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => {
            if (ctx.raw === null || ctx.raw === 0) return null
            const isAcc = (ctx.dataset.label as string).includes('Acurácia')
            return ` ${ctx.dataset.label}: ${ctx.raw}${isAcc ? '%' : 'q'}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridClr },
        ticks: { color: tickClr, font: { size: 10 } },
      },
      y: {
        position: 'left' as const,
        beginAtZero: true,
        grid: { color: gridClr },
        ticks: { color: tickClr, font: { size: 10 } },
      },
      y1: {
        position: 'right' as const,
        min: 0, max: 100,
        grid: { drawOnChartArea: false },
        ticks: {
          color: tickClr,
          font: { size: 10 },
          callback: (v: unknown) => `${v}%`,
        },
      },
    },
  }

  const deltaQColor  = deltaQ  > 0 ? 'text-success' : deltaQ  < 0 ? 'text-danger' : 'text-muted'
  const deltaAccColor = deltaAcc > 0 ? 'text-success' : deltaAcc < 0 ? 'text-danger' : 'text-muted'
  const accColor = (a: number) => a >= 75 ? 'text-success' : a >= 50 ? 'text-warning' : 'text-danger'

  return (
    <div className="bg-surface border border-border rounded-card p-4 space-y-3">
      {/* Header + legenda */}
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-bold text-text">Semana Atual vs Anterior</div>
        <div className="flex items-center gap-3 text-[9px] text-muted">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#4a7c5988', border: '1px solid #4a7c59' }} />
            Esta semana
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#94a3b828', border: '1px solid #94a3b855' }} />
            Semana anterior
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="#d4a017" strokeWidth="2" /></svg>
            Acurácia
          </span>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface2 border border-border rounded-card px-3 py-2.5 text-center">
          <div className="text-[20px] font-black text-text tabular-nums">{currQ}q</div>
          <div className={`text-[13px] font-bold tabular-nums ${currQ > 0 ? accColor(currAcc) : 'text-muted'}`}>
            {currQ > 0 ? `${currAcc}%` : '—'}
          </div>
          <div className="text-[9px] text-muted mt-0.5 uppercase tracking-wide">Esta semana</div>
        </div>

        <div className="bg-surface2 border border-border rounded-card px-3 py-2.5 text-center flex flex-col items-center justify-center gap-0.5">
          {hasPrev ? (
            <>
              <div className={`text-[14px] font-black tabular-nums ${deltaQColor}`}>
                {deltaQ > 0 ? `↑ +${deltaQ}` : deltaQ < 0 ? `↓ ${deltaQ}` : '= 0'}q
              </div>
              <div className={`text-[12px] font-bold tabular-nums ${deltaAccColor}`}>
                {deltaAcc > 0 ? `↑ +${deltaAcc}` : deltaAcc < 0 ? `↓ ${deltaAcc}` : '= 0'}pp
              </div>
              <div className="text-[9px] text-muted uppercase tracking-wide">Variação</div>
            </>
          ) : (
            <div className="text-[10px] text-muted text-center">Sem dados anteriores</div>
          )}
        </div>

        <div className="bg-surface2 border border-border rounded-card px-3 py-2.5 text-center opacity-60">
          <div className="text-[20px] font-black text-muted tabular-nums">{prevQ}q</div>
          <div className={`text-[13px] font-bold tabular-nums ${prevQ > 0 ? accColor(prevAcc) : 'text-muted'}`}>
            {prevQ > 0 ? `${prevAcc}%` : '—'}
          </div>
          <div className="text-[9px] text-muted mt-0.5 uppercase tracking-wide">Semana anterior</div>
        </div>
      </div>

      {/* Gráfico misto */}
      <div className="h-48">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <MixedChart type="bar" data={chartData as any} options={chartOpts} />
      </div>
    </div>
  )
}

// ─── Ghost helpers ────────────────────────────────────────────────────────────

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return localDate(d)
}

function getDayOfWeek(dateStr: string): number {
  return (new Date(dateStr + 'T12:00:00').getDay() + 6) % 7 // 0=Seg … 6=Dom
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T12:00:00')
  const end   = new Date(weekStart + 'T12:00:00')
  end.setDate(end.getDate() + 6)
  const fmt = (d: Date) =>
    `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  return `${fmt(start)} – ${fmt(end)}/${end.getFullYear()}`
}

interface GhostWeek {
  weekStart: string
  totalQ:    number
  avgAcc:    number
  byDow:     Map<number, number> // dayOfWeek → taxa
}

function findGhostWeek(points: Point[], currentWeekStart: string): GhostWeek | null {
  const byWeek = new Map<string, Point[]>()
  for (const p of points) {
    const ws = getWeekStart(p.date)
    if (ws === currentWeekStart) continue
    const arr = byWeek.get(ws) ?? []
    arr.push(p)
    byWeek.set(ws, arr)
  }
  if (byWeek.size === 0) return null

  let bestWeek: string | null = null
  let bestTotal = 0
  for (const [ws, pts] of byWeek.entries()) {
    const total = pts.reduce((acc, p) => acc + p.total, 0)
    if (total > bestTotal) { bestTotal = total; bestWeek = ws }
  }
  if (!bestWeek) return null

  const ghostPts = byWeek.get(bestWeek)!
  const totalQ  = ghostPts.reduce((acc, p) => acc + p.total, 0)
  const avgAcc  = Math.round(ghostPts.reduce((acc, p) => acc + p.taxa, 0) / ghostPts.length)
  const byDow   = new Map<number, number>()
  for (const p of ghostPts) byDow.set(getDayOfWeek(p.date), p.taxa)

  return { weekStart: bestWeek, totalQ, avgAcc, byDow }
}

// ─── Análise por Tema ─────────────────────────────────────────────────────────

function TemaSection() {
  const stats = useStore(s => s.sessionStats)

  const temas = useMemo(() => {
    const map = new Map<string, { total: number; correct: number; sessions: number }>()
    for (const s of stats) {
      if (!s.tema) continue
      const cur = map.get(s.tema) ?? { total: 0, correct: 0, sessions: 0 }
      map.set(s.tema, {
        total:    cur.total    + s.total,
        correct:  cur.correct  + s.correct,
        sessions: cur.sessions + 1,
      })
    }
    return [...map.entries()]
      .map(([tema, v]) => ({ tema, ...v, acc: pct(v.correct, v.total) }))
      .sort((a, b) => b.total - a.total)
  }, [stats])

  if (temas.length === 0) return null

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <div className="text-[12px] font-bold text-text">Desempenho por Temática</div>
        <div className="text-[10px] text-muted mt-0.5">acurácia agrupada pelo tipo de problema praticado</div>
      </div>
      <div className="grid grid-cols-[1fr_56px_56px_56px] gap-2 px-4 py-2 bg-surface2 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider">
        <span>Tema</span>
        <span className="text-center">Questões</span>
        <span className="text-center">Sessões</span>
        <span className="text-center">Acerto</span>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
        {temas.map(t => (
          <div
            key={t.tema}
            className="grid grid-cols-[1fr_56px_56px_56px] gap-2 px-4 py-2.5 border-b border-border/40 last:border-0 text-[12px] items-center"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: taxaColor(t.acc) }}
              />
              <span className="text-text truncate font-medium">{t.tema}</span>
            </div>
            <span className="text-muted text-center tabular-nums">{t.total}</span>
            <span className="text-muted text-center tabular-nums">{t.sessions}</span>
            <span
              className="font-black text-center tabular-nums"
              style={{ color: taxaColor(t.acc) }}
            >
              {t.acc}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Evolution hook ───────────────────────────────────────────────────────────

function useEvolucao(mat: string): Point[] {
  const sessions = useStore(s => s.sessionStats)
  return useMemo(() => {
    if (!mat) return []
    const filtered = sessions
      .filter(s => s.mat === mat)
      .sort((a, b) => a.date.localeCompare(b.date))

    const byDate = new Map<string, { total: number; correct: number }>()
    for (const s of filtered) {
      const cur = byDate.get(s.date) ?? { total: 0, correct: 0 }
      byDate.set(s.date, { total: cur.total + s.total, correct: cur.correct + s.correct })
    }

    return [...byDate.entries()].map(([date, v]) => ({
      date,
      total:   v.total,
      correct: v.correct,
      taxa:    pct(v.correct, v.total),
    }))
  }, [sessions, mat])
}

// ─── Chart ────────────────────────────────────────────────────────────────────

function taxaColor(t: number) {
  return t >= 75 ? '#4a7c59' : t >= 50 ? '#d4a017' : '#c0392b'
}

function makeLineOptions(dark: boolean) {
  const tooltipBg  = dark ? '#161b22' : '#ffffff'
  const tooltipBdr = dark ? '#30363d' : '#cbd5e1'
  const titleClr   = dark ? '#e6edf3' : '#0f172a'
  const bodyClr    = dark ? '#8b949e' : '#64748b'
  const gridClr    = dark ? 'rgba(48,54,61,0.5)' : '#cbd5e144'
  const tickClr    = dark ? '#8b949e' : '#64748b'
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        borderColor: tooltipBdr,
        borderWidth: 1,
        titleColor: titleClr,
        bodyColor: bodyClr,
        callbacks: {
          label: (ctx: { raw: unknown; dataset: { label?: string } }) =>
            ` ${ctx.dataset.label}: ${ctx.raw}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridClr },
        ticks: { color: tickClr, font: { size: 10 }, maxTicksLimit: 12 },
      },
      y: {
        min: 0, max: 100,
        grid: { color: gridClr },
        ticks: {
          color: tickClr, font: { size: 10 },
          callback: (v: unknown) => `${v}%`,
        },
      },
    },
  } as const
}

function EvolucaoChart({ points, mat }: { points: Point[]; mat: string }) {
  const { dark }        = useTheme()
  const today           = localDate()
  const currentWeekStart = useMemo(() => getWeekStart(today), [today])

  const ghost = useMemo(() => findGhostWeek(points, currentWeekStart), [points, currentWeekStart])

  const currentWeekPoints = useMemo(
    () => points.filter(p => getWeekStart(p.date) === currentWeekStart),
    [points, currentWeekStart],
  )
  const currentWeekTotal = currentWeekPoints.reduce((acc, p) => acc + p.total, 0)
  const currentWeekAcc   = currentWeekPoints.length
    ? Math.round(currentWeekPoints.reduce((acc, p) => acc + p.taxa, 0) / currentWeekPoints.length)
    : null

  // Ghost data aligned to chart labels (non-current-week positions = null)
  const ghostData = useMemo(() => {
    if (!ghost) return null
    return points.map(p => {
      if (getWeekStart(p.date) !== currentWeekStart) return null
      return ghost.byDow.get(getDayOfWeek(p.date)) ?? null
    })
  }, [ghost, points, currentWeekStart])

  const ghostPoints = ghostData ? ghostData.filter((v): v is number => v !== null) : []

  // Pace-based winning: compare current total vs ghost's expected pace today
  const daysElapsed  = getDayOfWeek(today) + 1 // 1=Seg … 7=Dom
  const ghostPace    = ghost ? Math.ceil(ghost.totalQ * daysElapsed / 7) : 0
  const winning: boolean | null = ghost && currentWeekTotal > 0
    ? currentWeekTotal >= ghostPace
    : null

  const last  = points[points.length - 1]
  const first = points[0]
  const trend = points.length >= 2 ? last.taxa - first.taxa : null
  const avg   = points.length ? Math.round(points.reduce((s, p) => s + p.taxa, 0) / points.length) : 0
  const color = taxaColor(last?.taxa ?? 0)

  const chartData = {
    labels: points.map(p => p.date.slice(5)),
    datasets: [
      {
        label: 'Taxa de acerto',
        data:  points.map(p => p.taxa),
        borderColor: color,
        backgroundColor: `${color}18`,
        borderWidth: 2,
        pointRadius: points.length < 20 ? 4 : 2,
        pointHoverRadius: 6,
        pointBackgroundColor: points.map(p => taxaColor(p.taxa)),
        pointBorderColor: 'transparent',
        fill: true,
        tension: 0.35,
      },
      {
        label: 'Meta (75%)',
        data:  points.map(() => 75),
        borderColor: '#28283f',
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false,
        tension: 0,
      },
      ...(ghost && ghostData && ghostPoints.length > 0 ? [{
        label: 'Fantasma',
        data:  ghostData,
        borderColor: '#94a3b8',
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderDash: [5, 4],
        pointRadius: 5,
        pointBackgroundColor: '#e2e8f0',
        pointBorderColor: '#94a3b8',
        pointBorderWidth: 1.5,
        pointHoverRadius: 7,
        fill: false,
        tension: 0.35,
        spanGaps: false,
      }] : []),
    ],
  }

  return (
    <div className="space-y-3">
      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-card px-3 py-2.5 text-center">
          <div className="text-[18px] font-black tabular-nums" style={{ color }}>
            {last?.taxa ?? 0}%
          </div>
          <div className="text-[10px] text-muted mt-0.5">Última sessão</div>
        </div>
        <div className="bg-surface border border-border rounded-card px-3 py-2.5 text-center">
          <div className={`text-[18px] font-black tabular-nums ${avg >= 75 ? 'text-success' : avg >= 50 ? 'text-warning' : 'text-danger'}`}>
            {avg}%
          </div>
          <div className="text-[10px] text-muted mt-0.5">Média geral</div>
        </div>
        <div className="bg-surface border border-border rounded-card px-3 py-2.5 text-center">
          <div className={`text-[18px] font-black tabular-nums ${trend === null ? 'text-muted' : trend > 0 ? 'text-success' : trend < 0 ? 'text-danger' : 'text-muted'}`}>
            {trend === null ? '—' : trend > 0 ? `+${trend}pp` : `${trend}pp`}
          </div>
          <div className="text-[10px] text-muted mt-0.5">Evolução total</div>
        </div>
        <div className="bg-surface border border-border rounded-card px-3 py-2.5 text-center">
          <div className="text-[18px] font-black text-text tabular-nums">
            {points.reduce((s, p) => s + p.total, 0)}
          </div>
          <div className="text-[10px] text-muted mt-0.5">Questões totais</div>
        </div>
      </div>

      {/* Duelo de Fantasmas */}
      {ghost && (
        <div className={`border rounded-card px-4 py-3 flex items-center justify-between gap-4 ${
          winning === null
            ? 'bg-surface border-border'
            : winning
              ? 'bg-success/5 border-success/30'
              : 'bg-surface border-slate-500/20'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[22px] select-none">👻</span>
            <div className="min-w-0">
              <div className="text-[11px] font-black text-text uppercase tracking-wide">Duelo de Fantasmas</div>
              <div className="text-[10px] text-muted mt-0.5 truncate">
                Melhor semana: {formatWeekRange(ghost.weekStart)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            {/* Ghost */}
            <div className="text-center">
              <div className="text-[15px] font-black text-slate-400 tabular-nums">{ghost.totalQ}q</div>
              <div className="text-[10px] text-muted">{ghost.avgAcc}% méd.</div>
              <div className="text-[9px] text-muted/60 mt-0.5">fantasma</div>
            </div>

            <div className="text-[11px] font-black text-muted">VS</div>

            {/* Semana atual */}
            <div className="text-center">
              <div className={`text-[15px] font-black tabular-nums ${winning ? 'text-success' : 'text-text'}`}>
                {currentWeekTotal}q
              </div>
              <div className="text-[10px] text-muted">
                {currentWeekAcc !== null ? `${currentWeekAcc}% méd.` : '—'}
              </div>
              <div className="text-[9px] text-muted/60 mt-0.5">semana atual</div>
            </div>

            {/* Badge */}
            <div className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
              winning === null
                ? 'border-border text-muted bg-surface2'
                : winning
                  ? 'border-success/40 text-success bg-success/10'
                  : 'border-slate-500/30 text-slate-400 bg-surface2'
            }`}>
              {winning === null
                ? 'Iniciar'
                : winning
                  ? 'Vencendo'
                  : `Faltam ${ghostPace - currentWeekTotal}q`}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="bg-surface border border-border rounded-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12px] font-bold text-text">{mat}</div>
          <div className="flex items-center gap-3 text-[10px] text-muted">
            {ghost && ghostPoints.length > 0 && (
              <span className="flex items-center gap-1.5">
                <svg width="18" height="8" viewBox="0 0 18 8">
                  <line x1="0" y1="4" x2="18" y2="4" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="5 4" />
                </svg>
                fantasma
              </span>
            )}
            <span>tracejado escuro = meta 75%</span>
          </div>
        </div>
        <div className="h-56">
          <Line data={chartData} options={makeLineOptions(dark)} />
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-3 py-2 bg-surface2 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider">
          <span>Data</span>
          <span className="text-center text-success">Acertos</span>
          <span className="text-center text-danger">Erros</span>
          <span className="text-center">Taxa</span>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
          {[...points].reverse().map(p => (
            <div key={p.date} className="grid grid-cols-[1fr_60px_60px_60px] gap-2 px-3 py-2 border-b border-border/40 last:border-0 text-[12px] items-center">
              <span className="text-muted font-mono">{p.date}</span>
              <span className="text-success font-bold text-center tabular-nums">{p.correct}</span>
              <span className="text-danger font-bold text-center tabular-nums">{p.total - p.correct}</span>
              <span className={`font-bold text-center tabular-nums ${p.taxa >= 75 ? 'text-success' : p.taxa >= 50 ? 'text-warning' : 'text-danger'}`}>
                {p.taxa}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Analise() {
  const sessionStats = useStore(s => s.sessionStats)
  const [mat, setMat] = useState('')

  const mats = useMemo(() => {
    const map = new Map<string, { disc: string; total: number }>()
    for (const s of sessionStats) {
      const cur = map.get(s.mat) ?? { disc: s.disc, total: 0 }
      map.set(s.mat, { disc: cur.disc, total: cur.total + s.total })
    }
    return [...map.entries()]
      .map(([m, v]) => ({ mat: m, disc: v.disc, total: v.total }))
      .sort((a, b) => b.total - a.total)
  }, [sessionStats])

  const activeMat = mat || (mats[0]?.mat ?? '')
  const points    = useEvolucao(activeMat)

  return (
    <div className="space-y-3">
      <div className="text-[13px] font-bold text-text">Curva de Evolução</div>

      {/* Comparativo semanal — geral, sem filtro de matéria */}
      <WeekCompareSection />

      {/* Desempenho por temática */}
      <TemaSection />

      <div className="bg-surface border border-border rounded-card p-3 space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted">Selecione a matéria</div>
        <div className="flex flex-wrap gap-1.5">
          {mats.map(m => (
            <button
              key={m.mat}
              onClick={() => setMat(m.mat)}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-colors ${
                (mat === m.mat || (!mat && m.mat === mats[0]?.mat))
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface2 border-border text-muted hover:text-text'
              }`}
            >
              {m.mat}
              <span className="ml-1 opacity-50">{m.total}q</span>
            </button>
          ))}
        </div>
      </div>

      {activeMat && points.length > 0
        ? <EvolucaoChart points={points} mat={activeMat} />
        : activeMat
          ? <div className="bg-surface border border-border rounded-card p-12 text-center text-muted text-sm">
              Nenhuma sessão registrada para <strong>{activeMat}</strong>.
            </div>
          : <div className="bg-surface border border-border rounded-card p-12 text-center text-muted text-sm">
              Nenhuma sessão registrada ainda.
            </div>
      }
    </div>
  )
}
