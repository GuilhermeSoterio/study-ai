import { useStore } from '@/store'
import { useStats } from '@/hooks/useStats'
import { RankBadge } from './RankBadge'

const MILESTONES = [100, 250, 500, 750, 1000]

export function GoalCard() {
  const config = useStore(s => s.config)
  const { total, goalPct } = useStats()

  const daysLeft = (() => {
    const now = new Date()
    const end = new Date(now.getFullYear(), 11, 31)
    return Math.ceil((end.getTime() - now.getTime()) / 86400000)
  })()
  const pace = daysLeft > 0 ? Math.ceil((config.big_goal - total) / daysLeft) : 0

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/25 rounded-card p-5 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[52px] font-black leading-none tracking-tight gradient-text">
            {total.toLocaleString()}
          </div>
          <div className="text-[13px] text-muted mt-1">
            de {config.big_goal.toLocaleString()} questões
          </div>
          <div className="mt-2">
            <RankBadge />
          </div>
          {pace > 0 && (
            <div className="text-[11px] text-muted mt-1">
              {pace}q/dia para atingir a meta
            </div>
          )}
        </div>
        <div className="text-[30px] font-black text-accent text-right leading-none">
          {goalPct}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-surface3 rounded-full h-2.5 overflow-hidden mb-2">
        <div
          className="pbar-fill h-full rounded-full relative"
          style={{ width: `${goalPct}%` }}
        />
      </div>

      {/* Milestones */}
      <div className="flex justify-between">
        {MILESTONES.map(m => (
          <span
            key={m}
            className={`text-[10px] font-semibold ${total >= m ? 'text-success' : 'text-dim'}`}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}
