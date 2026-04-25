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

export function Dashboard() {
  const { total, correct, errors, streak, bestStreak, weekTotal, monthTotal } = useStats()
  const tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length]

  return (
    <div className="space-y-3">
      {/* Operação do Dia */}
      <OperationMode />

      {/* Tip */}
      <div className="bg-surface2 border border-border rounded-card px-4 py-2.5 text-[12px] text-muted flex gap-2 items-start">
        <span>💡</span>
        <span>{tip}</span>
      </div>

      {/* Big goal */}
      <GoalCard />

      {/* Row 1: streak + daily + erros + accuracy */}
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

      {/* KPIs por matéria */}
      <KpiPanel />

      {/* Mapa de Frentes */}
      <BattleMap />

      {/* Vulnerabilidades: banca × matéria */}
      <VulnAlert />

      {/* Row 2: daily ring + daily chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <DailyRing />
        <div className="md:col-span-2">
          <DailyChart />
        </div>
      </div>

      {/* Row 3: heatmap */}
      <Heatmap />

      {/* Row 4: top subjects + disc chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TopSubjects />
        <DiscChart />
      </div>

      {/* Análise por banca */}
      <BancaPanel />

      {/* Conquistas + Medalhas + Força de Elite */}
      <AchievementGallery />
    </div>
  )
}
