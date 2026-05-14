import { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js'
import { useStore } from '@/store'
import { Card, CardLabel } from '@/components/ui/Card'
import { localDate } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

function makeChartOptions(dark: boolean) {
  const tooltipBg   = dark ? '#161b22' : '#ffffff'
  const tooltipBdr  = dark ? '#30363d' : '#cbd5e1'
  const titleColor  = dark ? '#e6edf3' : '#0f172a'
  const bodyColor   = dark ? '#8b949e' : '#64748b'
  const gridColor   = dark ? 'rgba(48,54,61,0.5)' : '#cbd5e133'
  const tickColor   = dark ? '#8b949e' : '#64748b'
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: tooltipBg,
      borderColor: tooltipBdr,
      borderWidth: 1,
      titleColor,
      bodyColor,
    }},
    scales: {
      x: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
      y: { grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 } } },
    },
  } as const
}

export function DailyChart() {
  const sessionStats = useStore(s => s.sessionStats)
  const { dark } = useTheme()

  const chartData = useMemo(() => {
    const map: Record<string, number> = {}
    sessionStats.forEach(s => { map[s.date] = (map[s.date] ?? 0) + s.total })
    const labels: string[] = []
    const values: number[] = []
    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = localDate(d)
      labels.push(key.slice(5))
      values.push(map[key] ?? 0)
    }
    return {
      labels,
      datasets: [{ data: values, backgroundColor: '#4a7c59', borderRadius: 4, hoverBackgroundColor: '#3a6648' }],
    }
  }, [sessionStats])

  return (
    <Card>
      <CardLabel>Questões por dia — 14 dias</CardLabel>
      <div className="h-36">
        <Bar data={chartData} options={makeChartOptions(dark)} />
      </div>
    </Card>
  )
}

export function DiscChart() {
  const sessionStats = useStore(s => s.sessionStats)
  const COLORS = ['#4a7c59','#d4a017','#c0392b','#3a6648','#8b7355','#6b8e5a','#9a9485','#8b0000']

  const data = useMemo(() => {
    const map: Record<string, number> = {}
    sessionStats.forEach(s => { map[s.disc] = (map[s.disc] ?? 0) + s.total })
    const total = Object.values(map).reduce((a, b) => a + b, 0) || 1
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([disc, count], i) => ({
        disc: disc.length > 22 ? disc.slice(0, 20) + '…' : disc,
        count,
        pct: Math.round((count / total) * 100),
        color: COLORS[i % COLORS.length],
      }))
  }, [sessionStats])

  if (!data.length) return null

  return (
    <Card>
      <CardLabel>Por disciplina</CardLabel>
      <div className="space-y-1.5 mt-1">
        {data.map(d => (
          <div key={d.disc} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <div className="text-[11px] flex-1 truncate text-muted">{d.disc}</div>
            <div className="text-[11px] font-bold">{d.count}q</div>
            <div className="w-16 bg-surface3 rounded-full h-1 shrink-0">
              <div className="h-1 rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
