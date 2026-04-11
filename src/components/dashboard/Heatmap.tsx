import { useMemo } from 'react'
import { useStore } from '@/store'
import { Card, CardLabel } from '@/components/ui/Card'

function getLevel(count: number) {
  if (count === 0) return 0
  if (count < 10) return 1
  if (count < 20) return 2
  if (count < 40) return 3
  return 4
}

const LEVEL_COLORS = [
  'bg-surface3',
  'bg-primary/35',
  'bg-primary/60',
  'bg-purple-400/80',
  'bg-purple-500',
]

export function Heatmap() {
  const sessions = useStore(s => s.sessions)

  const { weeks } = useMemo(() => {
    const map: Record<string, number> = {}
    sessions.forEach(s => {
      map[s.date] = (map[s.date] ?? 0) + s.total
    })

    const today = new Date()
    const cells: { date: string; count: number; level: number }[] = []
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const count = map[key] ?? 0
      cells.push({ date: key, count, level: getLevel(count) })
    }

    type Cell = { date: string; count: number; level: number }
    const weeks: Cell[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }
    return { weeks }
  }, [sessions])

  return (
    <Card>
      <CardLabel>Atividade — últimos 12 meses</CardLabel>
      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(cell => (
              <div
                key={cell.date}
                title={`${cell.date}: ${cell.count}q`}
                className={`w-2.5 h-2.5 rounded-[2px] ${LEVEL_COLORS[cell.level]} hover:scale-150 transition-transform cursor-default`}
              />
            ))}
          </div>
        ))}
      </div>
    </Card>
  )
}
