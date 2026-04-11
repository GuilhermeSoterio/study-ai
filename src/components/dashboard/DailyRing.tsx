import { useStats } from '@/hooks/useStats'
import { useStore } from '@/store'
import { Card, CardLabel } from '@/components/ui/Card'

export function DailyRing() {
  const { todayTotal, dailyPct } = useStats()
  const config = useStore(s => s.config)

  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (dailyPct / 100) * circ

  return (
    <Card>
      <CardLabel>Hoje</CardLabel>
      <div className="flex items-center gap-3">
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={r} fill="none" stroke="#1e1e35" strokeWidth="5" />
            <circle
              cx="28" cy="28" r={r} fill="none"
              stroke="#06b6d4" strokeWidth="5"
              strokeDasharray={`${dash} ${circ}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray .6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-accent">
            {dailyPct}%
          </div>
        </div>
        <div>
          <div className="text-[26px] font-black leading-none">{todayTotal}</div>
          <div className="text-[12px] text-muted mt-0.5">
            de {config.daily} questões
          </div>
        </div>
      </div>
    </Card>
  )
}
