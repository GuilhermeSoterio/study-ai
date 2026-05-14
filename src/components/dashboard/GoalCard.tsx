import { useStore } from '@/store'
import { useStats } from '@/hooks/useStats'
import { useMoral } from '@/hooks/useMoral'
import { useRank } from '@/hooks/useRank'

const MILESTONES = [100, 250, 500, 750, 1000]

export function GoalCard() {
  const config = useStore(s => s.config)
  const { total, goalPct } = useStats()
  const moral = useMoral()
  const rank  = useRank()

  const daysLeft = (() => {
    const now = new Date()
    const end = new Date(now.getFullYear(), 11, 31)
    return Math.ceil((end.getTime() - now.getTime()) / 86400000)
  })()
  const pace = daysLeft > 0 ? Math.ceil((config.big_goal - total) / daysLeft) : 0

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/25 rounded-card p-5 space-y-4">

      {/* ── Identidade: Avatar + Patente ─────────────────────────── */}
      <div className="flex items-start gap-3">
        {/* Avatar dinâmico */}
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center text-[38px] leading-none select-none shrink-0 ${rank.subLevel === 'N3' ? 'n3-pulse' : ''}`}
          style={{ background: `${rank.color}18`, border: `2px solid ${rank.subLevel === 'N3' ? 'rgba(245,208,107,0.65)' : `${rank.color}45`}` }}
        >
          {rank.avatar}
        </div>

        {/* Nome da patente + insígnia + sub */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className="text-[13px] font-black tracking-widest"
              style={{ color: rank.color }}
            >
              {rank.insig}
            </span>
            {/* Sub-level badge */}
            <span
              className="font-display font-bold text-[8px] tracking-widest px-1.5 py-0.5 rounded-sm uppercase"
              style={{
                background: rank.subLevel === 'N3'
                  ? 'rgba(212,160,23,0.18)'
                  : rank.subLevel === 'N2'
                  ? 'rgba(74,124,89,0.15)'
                  : 'rgb(var(--color-surface3))',
                color: rank.subLevel === 'N3'
                  ? 'rgba(245,208,107,0.95)'
                  : rank.subLevel === 'N2'
                  ? 'rgba(106,180,120,0.9)'
                  : 'rgb(var(--color-dim))',
                border: `1px solid ${rank.subLevel === 'N3' ? 'rgba(212,160,23,0.35)' : rank.subLevel === 'N2' ? 'rgba(74,124,89,0.30)' : 'rgb(var(--color-border))'}`,
              }}
            >
              {rank.subLevel} · {rank.subLabel}
            </span>
            {moral.isCollapsed && (
              <span className="text-[9px] font-black text-danger bg-danger/10 border border-danger/30 px-1.5 py-0.5 rounded uppercase tracking-wide animate-pulse">
                ▼ Rebaixado
              </span>
            )}
          </div>

          <div
            className="text-[26px] font-black leading-none tracking-widest"
            style={{ color: rank.color }}
          >
            {rank.name}
          </div>

          <div className="text-[10px] text-muted mt-1 leading-snug">
            {rank.sub}
          </div>
        </div>

        {/* % meta — indicador secundário */}
        <div className="text-right shrink-0">
          <div className="text-[24px] font-black tabular-nums leading-none" style={{ color: rank.color }}>
            {goalPct}%
          </div>
          <div className="text-[9px] text-muted mt-0.5 uppercase tracking-wider">da meta</div>
        </div>
      </div>

      {/* ── Contador de questões — secundário ───────────────────── */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-[36px] font-black leading-none gradient-text tabular-nums">
          {total.toLocaleString()}
        </span>
        <span className="text-[12px] text-muted">
          de {config.big_goal.toLocaleString()} questões
        </span>
        {pace > 0 && (
          <span className="ml-auto text-[10px] text-muted shrink-0">
            {pace}q/dia
          </span>
        )}
      </div>

      {/* ── Barra de progresso total ─────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="bg-surface3 rounded-full h-2.5 overflow-hidden">
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

      {/* ── Progresso dentro da patente atual ───────────────────── */}
      {rank.next && (
        <div className="flex items-center gap-2 pt-0.5">
          <div className="flex-1 bg-surface3 rounded-full h-1 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${rank.withinPct}%`, background: rank.color }}
            />
          </div>
          <span className="text-[9px] text-muted shrink-0 tabular-nums">
            → {rank.next.name} em {rank.next.min - rank.goalPct}%
          </span>
        </div>
      )}

    </div>
  )
}
