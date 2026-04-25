import { useState } from 'react'
import {
  useAchievements,
  useDiscAchievements,
  RARITY_STYLES,
  ACHIEVEMENT_TOTAL,
  type Achievement,
  type AchievementCategory,
  type ComputedStats,
  type DiscTierSlot,
  type DiscPrecisaoSlot,
  type DiscAchievementRow,
  type VolumeTier,
  type PrecisaoTier,
} from '@/hooks/useAchievements'
import { useMedals, useEliteDays, calcEliteStreak, MEDAL_DEFS, type MatMedal } from '@/hooks/useMedals'

// ── Achievement Card ──────────────────────────────────────────────────────────

function AchievementCard({ a }: { a: Achievement }) {
  const rs  = RARITY_STYLES[a.rarity]
  const pct = a.progress.target > 0
    ? Math.round((a.progress.current / a.progress.target) * 100)
    : 0

  return (
    <div
      title={a.desc}
      className="relative rounded-card p-3 flex flex-col gap-2 select-none transition-all"
      style={
        a.unlocked
          ? { background: rs.bg, border: `1.5px solid ${rs.border}` }
          : { background: '#f8fafc', border: '1.5px dashed #cbd5e1' }
      }
    >
      {/* Unlocked check */}
      {a.unlocked && (
        <span
          className="absolute top-2 right-2 text-[9px] font-black px-1.5 py-0.5 rounded-full"
          style={{ background: rs.border, color: '#fff' }}
        >
          ✓
        </span>
      )}

      {/* Icon */}
      <div
        className="text-[26px] leading-none"
        style={{ opacity: a.unlocked ? 1 : 0.28 }}
      >
        {a.icon}
      </div>

      {/* Label + desc */}
      <div>
        <div
          className="text-[12px] font-bold leading-tight"
          style={{ color: a.unlocked ? rs.color : '#94a3b8' }}
        >
          {a.label}
        </div>
        <div className="text-[10px] text-muted mt-0.5 leading-snug">
          {a.desc}
        </div>
      </div>

      {/* Progress bar (locked only) */}
      {!a.unlocked && (
        <div className="space-y-0.5 mt-auto">
          <div className="h-1 rounded-full bg-surface3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct > 0 ? '#4a7c59' : 'transparent',
              }}
            />
          </div>
          <div className="text-[9px] text-muted text-right tabular-nums">
            {a.progress.current} / {a.progress.target}
          </div>
        </div>
      )}

      {/* Rarity badge */}
      <div
        className="text-[8px] font-black tracking-widest uppercase mt-auto"
        style={{ color: a.unlocked ? rs.color : '#94a3b8' }}
      >
        {RARITY_STYLES[a.rarity].label}
      </div>
    </div>
  )
}

// ── Achievement Grid ──────────────────────────────────────────────────────────

function AchievementGrid({
  achievements,
  category,
  onlyUnlocked,
}: {
  achievements: Achievement[]
  category: AchievementCategory | 'todas'
  onlyUnlocked: boolean
}) {
  const filtered = achievements
    .filter(a => category === 'todas' || a.category === category)
    .filter(a => !onlyUnlocked || a.unlocked)
    .sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      const pctA = a.progress.current / a.progress.target
      const pctB = b.progress.current / b.progress.target
      return pctB - pctA
    })

  if (filtered.length === 0) {
    return (
      <div className="text-center text-muted text-sm py-6">
        Nenhuma conquista encontrada.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {filtered.map(a => <AchievementCard key={a.id} a={a} />)}
    </div>
  )
}

// ── Subject Medal Card ────────────────────────────────────────────────────────

function SubjectMedalCard({ item }: { item: MatMedal }) {
  const m = item.medal
  return (
    <div
      className="rounded-card p-3 space-y-2 flex flex-col"
      style={{ background: m.bg, border: `1px solid ${m.border}` }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[20px] leading-none">{m.icon}</span>
        <span className="text-[14px] font-black tabular-nums" style={{ color: m.color }}>
          {item.taxa}%
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-text truncate leading-tight">{item.mat}</div>
        <div className="text-[10px] text-muted truncate">{item.disc}</div>
      </div>
      <div className="text-[9px] font-black tracking-wider uppercase" style={{ color: m.color }}>
        {m.label}
      </div>
      <div className="text-[10px] text-muted">{item.total}q · {m.desc}</div>
    </div>
  )
}

// ── Medal Section ─────────────────────────────────────────────────────────────

function MedalsSection({ medals }: { medals: MatMedal[] }) {
  const [open, setOpen] = useState(true)

  if (medals.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface p-4 text-center text-[12px] text-muted">
        Nenhuma medalha por matéria ainda — atinja os requisitos de volume e acerto em uma matéria específica.
      </div>
    )
  }

  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface2/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-text">🎖️ Medalhas por Matéria</span>
          <span className="text-[10px] text-muted">{medals.length} conquistada{medals.length > 1 ? 's' : ''}</span>
          <div className="flex items-center gap-1">
            {MEDAL_DEFS.slice().reverse().map(def => {
              const count = medals.filter(m => m.medal.id === def.id).length
              if (count === 0) return null
              return (
                <span
                  key={def.id}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: def.bg, color: def.color, border: `1px solid ${def.border}` }}
                >
                  {def.icon} {count}
                </span>
              )
            })}
          </div>
        </div>
        <span className="text-muted text-[11px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-3">
          {MEDAL_DEFS.slice().reverse().map(def => {
            const tier = medals.filter(m => m.medal.id === def.id)
            if (tier.length === 0) return null
            return (
              <div key={def.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>{def.icon}</span>
                  <span className="text-[11px] font-black" style={{ color: def.color }}>{def.label}</span>
                  <span className="text-[10px] text-muted">≥{def.minTaxa}% · ≥{def.minQ}q</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {tier.map(item => <SubjectMedalCard key={item.mat} item={item} />)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Elite Force Section ───────────────────────────────────────────────────────

function EliteSection() {
  const [minQ,    setMinQ]    = useState(10)
  const [minTaxa, setMinTaxa] = useState(80)
  const [showCfg, setShowCfg] = useState(false)
  const [open,    setOpen]    = useState(true)

  const days   = useEliteDays(minTaxa, minQ)
  const streak = calcEliteStreak(days)
  const best   = days.reduce((b, d) => Math.max(b, d.taxa), 0)

  return (
    <div
      className="rounded-card overflow-hidden"
      style={{ background: 'rgba(212,160,23,0.06)', border: '1.5px solid rgba(212,160,23,0.30)', borderLeft: '4px solid #d4a017' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-50/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black tracking-widest text-amber-600 uppercase">
            ⚡ Força de Elite
          </span>
          <span className="text-[10px] text-muted">≥{minTaxa}% acerto AND ≥{minQ}q/dia</span>
          {days.length > 0 && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(212,160,23,0.15)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.3)' }}
            >
              {days.length} dias
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); setShowCfg(v => !v) }}
            className="text-[10px] text-muted hover:text-text transition-colors"
          >
            ⚙
          </button>
          <span className="text-muted text-[11px]">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-amber-200/50 pt-3">
          {showCfg && (
            <div className="flex items-center gap-4 text-[10px] text-muted">
              <label className="flex items-center gap-1">
                acerto ≥
                <input
                  type="number" min={50} max={99} value={minTaxa}
                  onChange={e => setMinTaxa(Number(e.target.value) || 80)}
                  className="w-10 text-center bg-surface2 border border-border rounded px-1 py-0.5 text-[10px] text-text outline-none focus:border-primary"
                />
                %
              </label>
              <label className="flex items-center gap-1">
                mín.
                <input
                  type="number" min={1} max={200} value={minQ}
                  onChange={e => setMinQ(Number(e.target.value) || 10)}
                  className="w-12 text-center bg-surface2 border border-border rounded px-1 py-0.5 text-[10px] text-text outline-none focus:border-primary"
                />
                q/dia
              </label>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { v: days.length, label: 'dias de elite' },
              { v: streak,      label: 'streak atual'  },
              { v: best > 0 ? `${best}%` : '—', label: 'melhor taxa' },
            ].map(({ v, label }) => (
              <div key={label} className="text-center">
                <div className="text-[22px] font-black tabular-nums" style={{ color: '#d4a017' }}>{v}</div>
                <div className="text-[10px] text-muted mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {days.length === 0 ? (
            <div className="text-[11px] text-muted text-center py-1">
              Nenhum dia de elite ainda — bata {minTaxa}%+ com ≥{minQ} questões em um dia.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {days.slice(-40).map(d => (
                <div
                  key={d.date}
                  title={`${d.date} · ${d.taxa}% · ${d.total}q`}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(212,160,23,0.15)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.3)' }}
                >
                  {d.date.slice(5)} ✦
                </div>
              ))}
              {days.length > 40 && (
                <span className="text-[9px] text-muted self-center">+{days.length - 40} dias</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Summary Row ───────────────────────────────────────────────────────────────

function SummaryRow({
  unlocked,
  stats,
}: {
  unlocked: number
  stats: ComputedStats
}) {
  const pct = Math.round((unlocked / ACHIEVEMENT_TOTAL) * 100)

  return (
    <div className="rounded-card border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[14px] font-black text-text">🏅 Sala de Conquistas</span>
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(74,124,89,0.1)', color: '#4a7c59', border: '1px solid rgba(74,124,89,0.3)' }}
          >
            {unlocked} / {ACHIEVEMENT_TOTAL}
          </span>
        </div>
        <div className="text-[11px] text-muted">{pct}% desbloqueado</div>
      </div>

      {/* Overall progress bar */}
      <div className="h-2 rounded-full bg-surface3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #4a7c59, #d4a017)' }}
        />
      </div>

      {/* Key stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {[
          { icon: '💣', label: 'Questões',  value: stats.totalQ.toLocaleString('pt-BR') },
          { icon: '🎯', label: 'Acerto',    value: `${stats.overallTaxa}%`              },
          { icon: '🔥', label: 'Streak',    value: `${stats.currentStreak}d`            },
          { icon: '🗺️',  label: 'Matérias',  value: String(stats.uniqueMats)             },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="text-[14px]">{icon}</span>
            <div>
              <div className="text-[13px] font-black text-text tabular-nums">{value}</div>
              <div className="text-[9px] text-muted">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Disc Achievements Section ─────────────────────────────────────────────────

type AnyTier = VolumeTier | PrecisaoTier

function TierCell({
  slot,
  label,
}: {
  slot: DiscTierSlot | DiscPrecisaoSlot
  label: string
}) {
  const earned = slot.earned as AnyTier | null
  const next   = slot.next   as AnyTier | null
  const rs     = earned ? RARITY_STYLES[earned.rarity] : null
  const isPrecisao = 'taxa' in slot
  const blocked = isPrecisao ? (slot as DiscPrecisaoSlot).blockedByQ : null

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <div className="text-[9px] font-black uppercase tracking-wider text-muted">{label}</div>

      {/* Earned badge */}
      {earned ? (
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold w-fit"
          style={{ background: rs!.bg, border: `1px solid ${rs!.border}`, color: rs!.color }}
        >
          <span>{earned.icon}</span>
          <span className="truncate max-w-[120px]">{earned.label}</span>
        </div>
      ) : (
        <div className="text-[10px] text-muted italic">—</div>
      )}

      {/* Progress to next */}
      {next && (
        <div className="space-y-0.5">
          <div className="h-1 rounded-full bg-surface3 overflow-hidden w-full">
            <div
              className="h-full rounded-full"
              style={{ width: `${slot.pct}%`, background: '#4a7c59' }}
            />
          </div>
          <div className="text-[9px] text-muted tabular-nums">
            {blocked != null
              ? `${slot.current}/${blocked}q p/ desbloquear`
              : `${slot.current}/${slot.nextTarget}`}
            {' '}→ {next.icon} {next.label}
          </div>
        </div>
      )}

      {!next && earned && (
        <div className="text-[9px]" style={{ color: RARITY_STYLES[earned.rarity].color }}>
          ✦ Nível máximo
        </div>
      )}
    </div>
  )
}

function DiscRow({ row }: { row: DiscAchievementRow }) {
  const [open, setOpen] = useState(false)

  const tierCount = [row.volume.earned, row.precisao.earned, row.sessoes.earned]
    .filter(Boolean).length

  const highestRarity = [row.volume.earned, row.precisao.earned, row.sessoes.earned]
    .filter((t): t is AnyTier => t !== null)
    .reduce<'comum' | 'raro' | 'epico' | 'lendario' | null>((best, t) => {
      const order = ['comum', 'raro', 'epico', 'lendario'] as const
      if (!best) return t.rarity
      return order.indexOf(t.rarity) > order.indexOf(best) ? t.rarity : best
    }, null)

  const rs = highestRarity ? RARITY_STYLES[highestRarity] : null

  return (
    <div
      className="rounded-card overflow-hidden"
      style={{
        border: rs ? `1.5px solid ${rs.border}` : '1px solid #e2e8f0',
        background: rs ? rs.bg : '#ffffff',
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface2/40 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="font-bold text-[13px] text-text truncate">{row.disc}</div>
          <div className="flex items-center gap-1 shrink-0">
            {[row.volume.earned, row.precisao.earned, row.sessoes.earned]
              .filter((t): t is AnyTier => t !== null)
              .map((t, i) => (
                <span
                  key={i}
                  className="text-[11px]"
                  title={t.label}
                  style={{ opacity: 1 }}
                >
                  {t.icon}
                </span>
              ))}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-bold text-text tabular-nums">{row.totalQ}q</div>
            <div className="text-[10px] text-muted">{row.taxa}% acerto</div>
          </div>
          {tierCount > 0 && (
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: rs?.border, color: '#fff' }}
            >
              {tierCount}/3
            </span>
          )}
          <span className="text-muted text-[11px]">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-border/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TierCell slot={row.volume}   label="💣 Volume"   />
          <TierCell slot={row.precisao} label="🎯 Precisão" />
          <TierCell slot={row.sessoes}  label="📊 Sessões"  />
        </div>
      )}
    </div>
  )
}

function DiscSection() {
  const rows = useDiscAchievements()
  const [open, setOpen] = useState(true)

  const totalEarned = rows.reduce((acc, r) =>
    acc + [r.volume.earned, r.precisao.earned, r.sessoes.earned].filter(Boolean).length, 0
  )
  const totalSlots = rows.length * 3

  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface2/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-[12px] font-bold text-text">⚔️ Conquistas por Disciplina</span>
          <span className="text-[10px] text-muted">{rows.length} disciplinas · {totalEarned}/{totalSlots} slots</span>
        </div>
        <span className="text-muted text-[11px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-2">
          {rows.length === 0 ? (
            <div className="text-center text-muted text-[12px] py-4">
              Nenhuma disciplina estudada ainda.
            </div>
          ) : (
            rows.map(row => <DiscRow key={row.disc} row={row} />)
          )}
        </div>
      )}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

const CATEGORIES: { id: AchievementCategory | 'todas'; label: string }[] = [
  { id: 'todas',     label: 'Todas'             },
  { id: 'volume',    label: '💣 Volume'         },
  { id: 'precisao',  label: '🎯 Precisão'       },
  { id: 'sequencia', label: '🔥 Sequência'      },
  { id: 'sessoes',   label: '📊 Sessões'        },
  { id: 'frentes',   label: '🗺️ Frentes'        },
  { id: 'ofensiva',  label: '⚡ Ofensiva'       },
  { id: 'elite',     label: '⭐ Elite'          },
]

export function AchievementGallery() {
  const { achievements, stats } = useAchievements()
  const medals = useMedals()

  const [category,     setCategory]     = useState<AchievementCategory | 'todas'>('todas')
  const [onlyUnlocked, setOnlyUnlocked] = useState(false)

  const unlocked = achievements.filter(a => a.unlocked).length

  return (
    <div className="space-y-4">
      {/* Summary */}
      <SummaryRow unlocked={unlocked} stats={stats} />

      {/* Category pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap"
            style={
              category === c.id
                ? { background: '#4a7c59', color: '#fff' }
                : { background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }
            }
          >
            {c.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setOnlyUnlocked(v => !v)}
            className="px-3 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap"
            style={
              onlyUnlocked
                ? { background: '#d4a017', color: '#fff' }
                : { background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }
            }
          >
            {onlyUnlocked ? '✓ Obtidas' : 'Obtidas'}
          </button>
        </div>
      </div>

      {/* Achievement grid */}
      <AchievementGrid
        achievements={achievements}
        category={category}
        onlyUnlocked={onlyUnlocked}
      />

      {/* Per-discipline achievement progression */}
      {(category === 'todas' || category === 'volume' || category === 'precisao' || category === 'sessoes') && (
        <DiscSection />
      )}

      {/* Medals by subject */}
      {(category === 'todas' || !onlyUnlocked) && (
        <MedalsSection medals={medals} />
      )}

      {/* Elite force detail */}
      {(category === 'todas' || category === 'elite') && (
        <EliteSection />
      )}
    </div>
  )
}
