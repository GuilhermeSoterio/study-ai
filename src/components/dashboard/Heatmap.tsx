import { useMemo } from 'react'
import { useStore } from '@/store'
import { useEliteDays, ELITE_TAXA, ELITE_MIN_Q } from '@/hooks/useMedals'
import { Card, CardLabel } from '@/components/ui/Card'

function volumeLevel(count: number) {
  if (count === 0) return 0
  if (count < 10) return 1
  if (count < 20) return 2
  if (count < 40) return 3
  return 4
}

const LEVEL_COLORS = [
  '#e2e8f0',           // 0 – nenhuma atividade
  'rgba(74,124,89,0.25)',
  'rgba(74,124,89,0.50)',
  'rgba(74,124,89,0.75)',
  '#4a7c59',           // 4 – alta atividade
]

const ELITE_COLOR  = '#d4a017'
const ELITE_BORDER = '#b8860b'

export function Heatmap() {
  const sessionStats = useStore(s => s.sessionStats)
  const eliteDays    = useEliteDays(ELITE_TAXA, ELITE_MIN_Q)
  const eliteSet     = useMemo(() => new Set(eliteDays.map(d => d.date)), [eliteDays])

  const weeks = useMemo(() => {
    const map: Record<string, number> = {}
    sessionStats.forEach(s => { map[s.date] = (map[s.date] ?? 0) + s.total })

    const today = new Date()
    const cells: { date: string; count: number; level: number; elite: boolean }[] = []
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key   = d.toISOString().slice(0, 10)
      const count = map[key] ?? 0
      cells.push({ date: key, count, level: volumeLevel(count), elite: eliteSet.has(key) })
    }

    const weeks: typeof cells[] = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
    return weeks
  }, [sessionStats, eliteSet])

  return (
    <Card>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <CardLabel>Atividade — últimos 12 meses</CardLabel>
        <div className="flex items-center gap-3 text-[10px] text-muted">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-[2px]" style={{ background: LEVEL_COLORS[4] }} />
            Volume
          </div>
          <div className="flex items-center gap-1">
            <div
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ background: ELITE_COLOR, border: `1px solid ${ELITE_BORDER}` }}
            />
            Elite ≥{ELITE_TAXA}% · ≥{ELITE_MIN_Q}q
          </div>
        </div>
      </div>

      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(cell => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count}q${cell.elite ? ` · ⭐ Elite` : ''}`}
                className="w-2.5 h-2.5 rounded-[2px] hover:scale-150 transition-transform cursor-default"
                style={
                  cell.elite
                    ? { background: ELITE_COLOR, border: `1px solid ${ELITE_BORDER}` }
                    : { background: LEVEL_COLORS[cell.level] }
                }
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
