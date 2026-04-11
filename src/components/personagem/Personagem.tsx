import { useMemo } from 'react'
import { useStore } from '@/store'
import { useStats } from '@/hooks/useStats'
import { SkillTree } from './SkillTree'

// ── Level system ──────────────────────────────────────────────────────────────

const RANKS = [
  { min: 0,    title: 'Iniciante',   emoji: '🌱', color: 'text-muted',   bar: 'bg-muted' },
  { min: 50,   title: 'Estudante',   emoji: '📚', color: 'text-accent',  bar: 'bg-accent' },
  { min: 150,  title: 'Dedicado',    emoji: '⚡', color: 'text-primary', bar: 'bg-primary' },
  { min: 350,  title: 'Persistente', emoji: '🎯', color: 'text-success', bar: 'bg-success' },
  { min: 600,  title: 'Expert',      emoji: '🔥', color: 'text-warning', bar: 'bg-warning' },
  { min: 900,  title: 'Mestre',      emoji: '💎', color: 'text-warning', bar: 'bg-warning' },
  { min: 1200, title: 'Elite',       emoji: '👑', color: 'text-primary', bar: 'bg-primary' },
  { min: 1800, title: 'Lenda',       emoji: '🌟', color: 'text-accent',  bar: 'bg-accent' },
]

function getLevel(total: number) {
  let idx = 0
  for (let i = 0; i < RANKS.length; i++) {
    if (total >= RANKS[i].min) idx = i
  }
  const cur  = RANKS[idx]
  const next = RANKS[idx + 1]
  const xpIn   = total - cur.min
  const xpSpan = next ? next.min - cur.min : 500
  const pct    = Math.min(100, Math.round((xpIn / xpSpan) * 100))
  return { level: idx + 1, ...cur, xpIn, xpMax: next?.min ?? cur.min + 500, pct, nextTitle: next?.title ?? 'MAX' }
}

// ── Character Panel ───────────────────────────────────────────────────────────

function CharacterPanel() {
  const stats = useStats()
  const lv = getLevel(stats.total)

  return (
    <div className="bg-surface border border-border rounded-card p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center text-5xl select-none">
          {lv.emoji}
        </div>
        <div className={`absolute -bottom-2 -right-2 text-[11px] font-black px-2 py-0.5 rounded-full bg-surface border border-border ${lv.color}`}>
          Lv {lv.level}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
        <div>
          <div className={`text-xl font-black ${lv.color}`}>{lv.title}</div>
          <div className="text-sm text-muted mt-0.5">
            {lv.xpIn} / {lv.xpMax - RANKS[lv.level - 1].min} XP para {lv.nextTitle}
          </div>
        </div>

        {/* XP bar */}
        <div className="bg-surface3 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${lv.bar}`}
            style={{ width: `${lv.pct}%` }}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { label: 'Questões', value: stats.total.toLocaleString('pt-BR') },
            { label: 'Acertos',  value: `${stats.acc}%` },
            { label: 'Streak',   value: `${stats.streak}d 🔥` },
            { label: 'Melhor',   value: `${stats.bestStreak}d ⭐` },
          ].map(s => (
            <div key={s.label} className="bg-surface2 rounded-card p-2.5 text-center">
              <div className="text-[11px] text-muted uppercase tracking-wider">{s.label}</div>
              <div className="text-base font-bold text-text mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Conquistas ────────────────────────────────────────────────────────────────

interface Achievement {
  id: string
  emoji: string
  title: string
  desc: string
  check: (stats: ReturnType<typeof useStats>, studiedMats: number, totalMats: number, streak: number) => boolean
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first',    emoji: '🎉', title: 'Primeiro Passo',     desc: 'Resolva sua primeira questão',           check: s => s.total >= 1 },
  { id: 'q50',      emoji: '📖', title: 'Cinquenta Questões',  desc: 'Resolva 50 questões',                    check: s => s.total >= 50 },
  { id: 'q200',     emoji: '📚', title: 'Duzentas Questões',   desc: 'Resolva 200 questões',                   check: s => s.total >= 200 },
  { id: 'q500',     emoji: '🏆', title: 'Quinhentas Questões', desc: 'Resolva 500 questões',                   check: s => s.total >= 500 },
  { id: 'q1000',    emoji: '💎', title: 'Mil Questões',        desc: 'Resolva 1000 questões',                  check: s => s.total >= 1000 },
  { id: 'acc80',    emoji: '🎯', title: 'Mira Afiada',         desc: 'Alcance 80% de acerto (mín. 50 qq.)',    check: s => s.acc >= 80 && s.total >= 50 },
  { id: 'streak3',  emoji: '🔥', title: 'Em Chamas',           desc: 'Estude 3 dias seguidos',                 check: s => s.streak >= 3 },
  { id: 'streak7',  emoji: '⚡', title: 'Semana Perfeita',     desc: 'Estude 7 dias seguidos',                 check: s => s.streak >= 7 },
  { id: 'streak30', emoji: '🌟', title: 'Mês de Ouro',         desc: 'Estude 30 dias seguidos',                check: s => s.streak >= 30 },
  { id: 'mat5',     emoji: '🗺️', title: 'Explorador',          desc: 'Desbloqueie 5 matérias',                 check: (_, u) => u >= 5 },
  { id: 'mat20',    emoji: '🧭', title: 'Cartógrafo',           desc: 'Desbloqueie 20 matérias',                check: (_, u) => u >= 20 },
  { id: 'half',     emoji: '🏅', title: 'Meio Caminho',         desc: 'Desbloqueie metade das matérias',        check: (_, u, t) => u >= t / 2 },
  { id: 'all',      emoji: '👑', title: 'Mestre Completo',      desc: 'Desbloqueie todas as matérias',          check: (_, u, t) => u >= t && t > 0 },
]

function Achievements() {
  const stats = useStats()
  const disc  = useStore(s => s.disc)
  const sessions = useStore(s => s.sessionStats)

  const { studiedMats, totalMats } = useMemo(() => {
    const set = new Set<string>()
    for (const s of sessions) {
      if (s.disc && s.mat) set.add(`${s.disc}|${s.mat}`)
    }
    const total = Object.values(disc).reduce((a, mats) => a + mats.length, 0)
    return { studiedMats: set.size, totalMats: total }
  }, [sessions, disc])

  const earned = ACHIEVEMENTS.filter(a => a.check(stats, studiedMats, totalMats, stats.streak))
  const locked = ACHIEVEMENTS.filter(a => !a.check(stats, studiedMats, totalMats, stats.streak))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-text">Conquistas</div>
        <div className="text-[12px] text-muted">
          <span className="text-warning font-bold">{earned.length}</span>/{ACHIEVEMENTS.length} obtidas
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {[...earned, ...locked].map(a => {
          const isEarned = earned.includes(a)
          return (
            <div
              key={a.id}
              className={`rounded-card border p-3 flex items-start gap-2.5 transition-all ${
                isEarned
                  ? 'bg-warning/10 border-warning/30'
                  : 'bg-surface2 border-border opacity-40'
              }`}
            >
              <span className="text-xl shrink-0">{a.emoji}</span>
              <div className="min-w-0">
                <div className={`text-[12px] font-bold leading-tight ${isEarned ? 'text-warning' : 'text-muted'}`}>
                  {a.title}
                </div>
                <div className="text-[10px] text-dim leading-tight mt-0.5">{a.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function Personagem() {
  return (
    <div className="space-y-6">
      <CharacterPanel />
      <Achievements />
      <SkillTree />
    </div>
  )
}

