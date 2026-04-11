import { useMemo } from 'react'
import { useStore } from '@/store'
import { Card, CardLabel } from '@/components/ui/Card'

export function TopSubjects() {
  const sessions = useStore(s => s.sessions)

  const subjects = useMemo(() => {
    const map: Record<string, { total: number; correct: number }> = {}
    sessions.forEach(s => {
      if (!map[s.mat]) map[s.mat] = { total: 0, correct: 0 }
      map[s.mat].total += s.total
      map[s.mat].correct += s.correct
    })
    return Object.entries(map)
      .map(([mat, v]) => ({ mat, ...v, pct: Math.round((v.correct / v.total) * 100) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  }, [sessions])

  const max = subjects[0]?.total ?? 1

  if (!subjects.length) {
    return (
      <Card>
        <CardLabel>Top Matérias</CardLabel>
        <p className="text-muted text-sm">Nenhuma sessão ainda.</p>
      </Card>
    )
  }

  return (
    <Card>
      <CardLabel>Top Matérias</CardLabel>
      <div className="space-y-0">
        {subjects.map(s => (
          <div key={s.mat} className="flex items-center gap-2.5 py-2 border-b border-border/50 last:border-0">
            <div className="text-[12px] font-semibold flex-1 truncate text-text">{s.mat}</div>
            <div className="w-24 bg-surface3 rounded-full h-1.5 shrink-0">
              <div
                className="h-1.5 rounded-full bg-primary transition-all"
                style={{ width: `${(s.total / max) * 100}%` }}
              />
            </div>
            <div
              className="text-[11px] font-bold w-9 text-right shrink-0"
              style={{ color: s.pct >= 70 ? '#10b981' : s.pct >= 50 ? '#f59e0b' : '#ef4444' }}
            >
              {s.pct}%
            </div>
            <div className="text-[10px] text-muted w-10 text-right shrink-0">{s.total}q</div>
          </div>
        ))}
      </div>
    </Card>
  )
}
