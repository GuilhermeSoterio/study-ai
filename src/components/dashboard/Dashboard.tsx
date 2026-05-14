import { useStats } from '@/hooks/useStats'
import { TIPS } from '@/lib/constants'
import { GoalCard } from './GoalCard'
import { DailyRing } from './DailyRing'
import { StatCard } from './StatCard'
import { Heatmap } from './Heatmap'
import { TopSubjects } from './TopSubjects'
import { DailyChart, DiscChart } from './DashboardCharts'
import { KpiPanel } from './KpiPanel'
import { BancaPanel } from './BancaPanel'
import { VulnAlert } from './VulnAlert'
import { BattleMap } from './BattleMap'
import { OperationMode } from './OperationMode'
import { AchievementGallery } from './AchievementGallery'
import { MoralBar } from './MoralBar'

export function Dashboard() {
  const { total, correct, errors, streak, bestStreak, weekTotal, monthTotal } = useStats()
  const tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length]

  return (
    <div className="space-y-3">

      {/* ── COCKPIT ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr_1fr] gap-3 items-start">

        {/* LEFT — Status do Personagem */}
        <div className="space-y-3">
          <div className="font-display font-bold text-muted uppercase px-0.5" style={{ fontSize: 11, letterSpacing: '0.22em' }}>
            ● Status do Personagem
          </div>
          <GoalCard />
          <MoralBar />
        </div>

        {/* CENTER — Mapa de Batalha */}
        <div className="space-y-3">
          <div className="font-display font-bold text-muted uppercase px-0.5" style={{ fontSize: 11, letterSpacing: '0.22em' }}>
            ● Mapa de Batalha
          </div>
          <OperationMode />
          <div className="bg-surface2 border border-border rounded-card px-4 py-2.5 text-[12px] text-muted flex gap-2 items-start">
            <span>💡</span>
            <span>{tip}</span>
          </div>
          <BattleMap />
        </div>

        {/* RIGHT — Próximos Alvos */}
        <div className="space-y-3">
          <div className="font-display font-bold text-muted uppercase px-0.5" style={{ fontSize: 11, letterSpacing: '0.22em' }}>
            ● Próximos Alvos
          </div>
          <VulnAlert />
        </div>

      </div>

      {/* ── STATS ROW ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="🔥 Streak"
          value={streak}
          sub={bestStreak > 0 ? `Recorde: ${bestStreak}d` : undefined}
          color="text-orange-400"
        />
        <StatCard
          label="❌ Erros total"
          value={errors}
          sub={total > 0 ? `${Math.round(((total - correct) / total) * 100)}% de erro` : undefined}
          color="text-danger"
        />
        <StatCard
          label="📅 Semana"
          value={weekTotal}
          color="text-accent"
        />
        <StatCard
          label="📆 Mês"
          value={monthTotal}
          color="text-success"
        />
      </div>

      {/* ── ANÁLISE ─────────────────────────────────────────────────────────── */}
      <KpiPanel />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DailyRing />
        <div className="md:col-span-2">
          <DailyChart />
        </div>
      </div>

      <Heatmap />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TopSubjects />
        <DiscChart />
      </div>

      <BancaPanel />

      <AchievementGallery />
    </div>
  )
}
