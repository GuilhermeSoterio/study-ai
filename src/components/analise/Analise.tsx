import { useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Filler,
} from 'chart.js'
import { useStore } from '@/store'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

interface Point { date: string; taxa: number; total: number; correct: number }

function useEvolucao(mat: string): Point[] {
  const sessions = useStore(s => s.sessionStats)
  return useMemo(() => {
    if (!mat) return []
    const filtered = sessions
      .filter(s => s.mat === mat)
      .sort((a, b) => a.date.localeCompare(b.date))

    // Agrupa por data (pode ter múltiplas sessões no mesmo dia)
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

function taxaColor(t: number) {
  return t >= 75 ? '#4a7c59' : t >= 50 ? '#d4a017' : '#c0392b'
}

const LINE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#ffffff',
      borderColor: '#cbd5e1',
      borderWidth: 1,
      titleColor: '#0f172a',
      bodyColor: '#64748b',
      callbacks: {
        label: (ctx: { raw: unknown; dataset: { label?: string } }) =>
          ` ${ctx.dataset.label}: ${ctx.raw}%`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: '#cbd5e144' },
      ticks: { color: '#64748b', font: { size: 10 }, maxTicksLimit: 12 },
    },
    y: {
      min: 0, max: 100,
      grid: { color: '#cbd5e144' },
      ticks: {
        color: '#64748b', font: { size: 10 },
        callback: (v: unknown) => `${v}%`,
      },
    },
  },
} as const

function EvolucaoChart({ points, mat }: { points: Point[]; mat: string }) {
  const last = points[points.length - 1]
  const first = points[0]
  const trend = points.length >= 2 ? last.taxa - first.taxa : null
  const avg   = points.length ? Math.round(points.reduce((s, p) => s + p.taxa, 0) / points.length) : 0
  const color = taxaColor(last?.taxa ?? 0)

  const chartData = {
    labels: points.map(p => p.date.slice(5)), // MM-DD
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
      // Linha de referência 75%
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
    ],
  }

  return (
    <div className="space-y-3">
      {/* Mini stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-surface border border-border rounded-card px-3 py-2.5 text-center">
          <div className={`text-[18px] font-black tabular-nums`} style={{ color }}>
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

      {/* Gráfico */}
      <div className="bg-surface border border-border rounded-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12px] font-bold text-text">{mat}</div>
          <div className="text-[10px] text-muted">linha tracejada = meta 75%</div>
        </div>
        <div className="h-56">
          <Line data={chartData} options={LINE_OPTIONS} />
        </div>
      </div>

      {/* Tabela de sessões */}
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
  const points = useEvolucao(activeMat)

  return (
    <div className="space-y-3">
      <div className="text-[13px] font-bold text-text">Curva de Evolução</div>

      {/* Seletor de matéria */}
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

      {/* Gráfico + stats */}
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
