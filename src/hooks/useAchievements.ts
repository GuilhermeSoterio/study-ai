import { useMemo } from 'react'
import { useStore } from '@/store'
import { useEliteDays } from './useMedals'

// ── Types ──────────────────────────────────────────────────────────────────────

export type AchievementCategory =
  | 'volume'
  | 'precisao'
  | 'sequencia'
  | 'sessoes'
  | 'frentes'
  | 'ofensiva'
  | 'elite'

export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario'

export interface Achievement {
  id:       string
  category: AchievementCategory
  icon:     string
  label:    string
  desc:     string
  rarity:   Rarity
  unlocked: boolean
  progress: { current: number; target: number }
}

export interface ComputedStats {
  totalQ:        number
  totalCorrect:  number
  totalSessions: number
  overallTaxa:   number
  currentStreak: number
  bestStreak:    number
  uniqueMats:    number
  uniqueDiscs:   number
  bestDayQ:      number
  eliteDays:     number
}

// ── Display metadata ──────────────────────────────────────────────────────────

export const CATEGORY_META: Record<AchievementCategory, { icon: string; label: string }> = {
  volume:    { icon: '💣', label: 'Volume de Combate' },
  precisao:  { icon: '🎯', label: 'Precisão'          },
  sequencia: { icon: '🔥', label: 'Sequência'         },
  sessoes:   { icon: '📊', label: 'Sessões'            },
  frentes:   { icon: '🗺️',  label: 'Frentes'           },
  ofensiva:  { icon: '⚡', label: 'Ofensiva Diária'   },
  elite:     { icon: '⭐', label: 'Força de Elite'    },
}

export const RARITY_STYLES: Record<Rarity, { color: string; bg: string; border: string; label: string }> = {
  comum:    { color: '#64748b', bg: 'rgba(100,116,139,0.09)', border: 'rgba(100,116,139,0.25)', label: 'Comum'    },
  raro:     { color: '#4a7c59', bg: 'rgba(74,124,89,0.09)',   border: 'rgba(74,124,89,0.30)',   label: 'Raro'     },
  epico:    { color: '#7c3aed', bg: 'rgba(124,58,237,0.09)',  border: 'rgba(124,58,237,0.30)',  label: 'Épico'    },
  lendario: { color: '#d4a017', bg: 'rgba(212,160,23,0.11)',  border: 'rgba(212,160,23,0.38)',  label: 'Lendário' },
}

// ── Catalog ───────────────────────────────────────────────────────────────────

type CatalogEntry = Omit<Achievement, 'unlocked' | 'progress'> & {
  target:   number
  getValue: (s: ComputedStats) => number
  note?:    string  // shown when a secondary condition blocks progress
}

const CATALOG: CatalogEntry[] = [
  // ── Volume de Combate ─────────────────────────────────────────────────────
  { id:'v1', category:'volume', rarity:'comum',    icon:'🎯', label:'Primeira Missão',      desc:'Resolva a primeira questão',             target:1,    getValue: s => s.totalQ },
  { id:'v2', category:'volume', rarity:'comum',    icon:'⚔️', label:'Recruta em Ação',      desc:'50 questões resolvidas',                target:50,   getValue: s => s.totalQ },
  { id:'v3', category:'volume', rarity:'comum',    icon:'🔫', label:'Soldado de Linha',     desc:'100 questões resolvidas',               target:100,  getValue: s => s.totalQ },
  { id:'v4', category:'volume', rarity:'raro',     icon:'💣', label:'Cabo Operacional',     desc:'250 questões resolvidas',               target:250,  getValue: s => s.totalQ },
  { id:'v5', category:'volume', rarity:'raro',     icon:'🎖️', label:'Sargento de Combate',  desc:'500 questões resolvidas',               target:500,  getValue: s => s.totalQ },
  { id:'v6', category:'volume', rarity:'epico',    icon:'⭐', label:'Oficial de Campo',     desc:'1.000 questões resolvidas',             target:1000, getValue: s => s.totalQ },
  { id:'v7', category:'volume', rarity:'epico',    icon:'🏆', label:'Comandante Supremo',   desc:'2.500 questões resolvidas',             target:2500, getValue: s => s.totalQ },
  { id:'v8', category:'volume', rarity:'lendario', icon:'💫', label:'General das Armas',    desc:'5.000 questões resolvidas',             target:5000, getValue: s => s.totalQ },

  // ── Precisão ──────────────────────────────────────────────────────────────
  // getValue returns taxa only when question threshold is met; otherwise 0 (blocks progress display)
  { id:'p1', category:'precisao', rarity:'comum',    icon:'🎯', label:'Atirador Calibrado',  desc:'70%+ acerto global (mín. 50 questões)',  target:70, getValue: s => s.totalQ >= 50  ? s.overallTaxa : 0, note:'Precisa de mín. 50 questões'  },
  { id:'p2', category:'precisao', rarity:'raro',     icon:'🔭', label:'Franco-Atirador',     desc:'80%+ acerto global (mín. 100 questões)', target:80, getValue: s => s.totalQ >= 100 ? s.overallTaxa : 0, note:'Precisa de mín. 100 questões' },
  { id:'p3', category:'precisao', rarity:'epico',    icon:'🥊', label:'Sniper de Elite',     desc:'85%+ acerto global (mín. 200 questões)', target:85, getValue: s => s.totalQ >= 200 ? s.overallTaxa : 0, note:'Precisa de mín. 200 questões' },
  { id:'p4', category:'precisao', rarity:'lendario', icon:'💫', label:'Perfeição Tática',    desc:'90%+ acerto global (mín. 300 questões)', target:90, getValue: s => s.totalQ >= 300 ? s.overallTaxa : 0, note:'Precisa de mín. 300 questões' },

  // ── Sequência ─────────────────────────────────────────────────────────────
  { id:'s1', category:'sequencia', rarity:'comum',    icon:'📅', label:'Presença Confirmada', desc:'3 dias de estudo consecutivos',          target:3,  getValue: s => s.bestStreak },
  { id:'s2', category:'sequencia', rarity:'raro',     icon:'🔥', label:'Semana de Ferro',     desc:'7 dias de estudo consecutivos',          target:7,  getValue: s => s.bestStreak },
  { id:'s3', category:'sequencia', rarity:'epico',    icon:'💪', label:'Resistência Máxima',  desc:'14 dias de estudo consecutivos',         target:14, getValue: s => s.bestStreak },
  { id:'s4', category:'sequencia', rarity:'lendario', icon:'🌟', label:'Inquebrável',         desc:'30 dias de estudo consecutivos',         target:30, getValue: s => s.bestStreak },

  // ── Sessões ───────────────────────────────────────────────────────────────
  { id:'e1', category:'sessoes', rarity:'comum',    icon:'🚀', label:'Primeiro Contato',     desc:'Registre a primeira sessão de estudo',   target:1,   getValue: s => s.totalSessions },
  { id:'e2', category:'sessoes', rarity:'comum',    icon:'📊', label:'Recorrente',           desc:'10 sessões de estudo registradas',        target:10,  getValue: s => s.totalSessions },
  { id:'e3', category:'sessoes', rarity:'raro',     icon:'🗺️', label:'Veterano',             desc:'25 sessões de estudo registradas',        target:25,  getValue: s => s.totalSessions },
  { id:'e4', category:'sessoes', rarity:'raro',     icon:'🎯', label:'Oficial Operacional',  desc:'50 sessões de estudo registradas',        target:50,  getValue: s => s.totalSessions },
  { id:'e5', category:'sessoes', rarity:'epico',    icon:'👑', label:'Grande Estrategista',  desc:'100 sessões de estudo registradas',       target:100, getValue: s => s.totalSessions },
  { id:'e6', category:'sessoes', rarity:'lendario', icon:'🏅', label:'Lenda Operacional',    desc:'250 sessões de estudo registradas',       target:250, getValue: s => s.totalSessions },

  // ── Frentes ───────────────────────────────────────────────────────────────
  { id:'f1', category:'frentes', rarity:'comum',    icon:'🗺️', label:'Explorador',           desc:'3 matérias distintas estudadas',          target:3,  getValue: s => s.uniqueMats  },
  { id:'f2', category:'frentes', rarity:'raro',     icon:'🌐', label:'Polivalente',          desc:'6 matérias distintas estudadas',          target:6,  getValue: s => s.uniqueMats  },
  { id:'f3', category:'frentes', rarity:'epico',    icon:'⚔️', label:'Mestre das Frentes',   desc:'10 matérias distintas estudadas',         target:10, getValue: s => s.uniqueMats  },
  { id:'f4', category:'frentes', rarity:'lendario', icon:'🏆', label:'Senhor da Batalha',    desc:'15 matérias distintas estudadas',         target:15, getValue: s => s.uniqueMats  },
  { id:'f5', category:'frentes', rarity:'raro',     icon:'🌟', label:'Teatro de Operações',  desc:'3 disciplinas distintas estudadas',       target:3,  getValue: s => s.uniqueDiscs },
  { id:'f6', category:'frentes', rarity:'epico',    icon:'🏅', label:'General Polivalente',  desc:'5 disciplinas distintas estudadas',       target:5,  getValue: s => s.uniqueDiscs },

  // ── Ofensiva Diária ───────────────────────────────────────────────────────
  { id:'o1', category:'ofensiva', rarity:'comum',    icon:'💥', label:'Dia de Ataque',        desc:'20 questões em um único dia',             target:20,  getValue: s => s.bestDayQ },
  { id:'o2', category:'ofensiva', rarity:'raro',     icon:'🔥', label:'Barragem',             desc:'40 questões em um único dia',             target:40,  getValue: s => s.bestDayQ },
  { id:'o3', category:'ofensiva', rarity:'epico',    icon:'💣', label:'Bombardeio Total',     desc:'60 questões em um único dia',             target:60,  getValue: s => s.bestDayQ },
  { id:'o4', category:'ofensiva', rarity:'lendario', icon:'⚡', label:'Operação Relâmpago',   desc:'100 questões em um único dia',            target:100, getValue: s => s.bestDayQ },

  // ── Força de Elite ────────────────────────────────────────────────────────
  { id:'el1', category:'elite', rarity:'comum',    icon:'⭐', label:'Batismo de Fogo',       desc:'1 dia de elite (≥80% acerto e ≥10q)',     target:1,  getValue: s => s.eliteDays },
  { id:'el2', category:'elite', rarity:'raro',     icon:'✦',  label:'Força de Choque',       desc:'5 dias de elite',                         target:5,  getValue: s => s.eliteDays },
  { id:'el3', category:'elite', rarity:'epico',    icon:'💎', label:'Unidade de Elite',      desc:'10 dias de elite',                        target:10, getValue: s => s.eliteDays },
  { id:'el4', category:'elite', rarity:'lendario', icon:'🏆', label:'Legião Imortal',        desc:'25 dias de elite',                        target:25, getValue: s => s.eliteDays },
]

export const ACHIEVEMENT_TOTAL = CATALOG.length

// ── Shared tier tables (reused for per-disc achievements) ─────────────────────

export interface VolumeTier { target: number; rarity: Rarity; icon: string; label: string }
export interface PrecisaoTier { taxa: number; minQ: number; rarity: Rarity; icon: string; label: string }

export const VOLUME_TIERS: VolumeTier[] = [
  { target: 1,    rarity: 'comum',    icon: '🎯', label: 'Primeira Missão'    },
  { target: 50,   rarity: 'comum',    icon: '⚔️', label: 'Recruta em Ação'    },
  { target: 100,  rarity: 'comum',    icon: '🔫', label: 'Soldado de Linha'   },
  { target: 250,  rarity: 'raro',     icon: '💣', label: 'Cabo Operacional'   },
  { target: 500,  rarity: 'raro',     icon: '🎖️', label: 'Sargento de Combate' },
  { target: 1000, rarity: 'epico',    icon: '⭐', label: 'Oficial de Campo'   },
  { target: 2500, rarity: 'epico',    icon: '🏆', label: 'Comandante Supremo' },
  { target: 5000, rarity: 'lendario', icon: '💫', label: 'General das Armas'  },
]

export const PRECISAO_TIERS: PrecisaoTier[] = [
  { taxa: 70, minQ: 50,  rarity: 'comum',    icon: '🎯', label: 'Atirador Calibrado' },
  { taxa: 80, minQ: 100, rarity: 'raro',     icon: '🔭', label: 'Franco-Atirador'    },
  { taxa: 85, minQ: 200, rarity: 'epico',    icon: '🥊', label: 'Sniper de Elite'    },
  { taxa: 90, minQ: 300, rarity: 'lendario', icon: '💫', label: 'Perfeição Tática'   },
]

export const SESSOES_TIERS: VolumeTier[] = [
  { target: 1,   rarity: 'comum',    icon: '🚀', label: 'Primeiro Contato'    },
  { target: 10,  rarity: 'comum',    icon: '📊', label: 'Recorrente'          },
  { target: 25,  rarity: 'raro',     icon: '🗺️',  label: 'Veterano'            },
  { target: 50,  rarity: 'raro',     icon: '🎯', label: 'Oficial Operacional' },
  { target: 100, rarity: 'epico',    icon: '👑', label: 'Grande Estrategista' },
  { target: 250, rarity: 'lendario', icon: '🏅', label: 'Lenda Operacional'   },
]

// ── Streak helper ─────────────────────────────────────────────────────────────

function computeStreak(dates: Set<string>): { current: number; best: number } {
  const sorted = [...dates].sort()
  if (sorted.length === 0) return { current: 0, best: 0 }

  let best = 1, run = 1
  for (let i = 1; i < sorted.length; i++) {
    const diff = Math.round(
      (new Date(sorted[i] + 'T12:00:00').getTime() -
       new Date(sorted[i - 1] + 'T12:00:00').getTime()) / 86400000
    )
    run = diff === 1 ? run + 1 : 1
    if (run > best) best = run
  }

  let current = 0
  const d = new Date()
  while (dates.has(d.toISOString().slice(0, 10))) {
    current++
    d.setDate(d.getDate() - 1)
  }

  return { current, best: Math.max(best, current) }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAchievements(): { achievements: Achievement[]; stats: ComputedStats } {
  const sessionStats = useStore(s => s.sessionStats)
  const eliteDaysList = useEliteDays()

  return useMemo(() => {
    let totalQ = 0, totalCorrect = 0
    const dates  = new Set<string>()
    const mats   = new Set<string>()
    const discs  = new Set<string>()
    const dayMap = new Map<string, number>()

    for (const s of sessionStats) {
      totalQ       += s.total
      totalCorrect += s.correct
      dates.add(s.date)
      mats.add(s.mat)
      discs.add(s.disc)
      dayMap.set(s.date, (dayMap.get(s.date) ?? 0) + s.total)
    }

    const { current: currentStreak, best: bestStreak } = computeStreak(dates)

    const computed: ComputedStats = {
      totalQ,
      totalCorrect,
      totalSessions: sessionStats.length,
      overallTaxa:   totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0,
      currentStreak,
      bestStreak,
      uniqueMats:    mats.size,
      uniqueDiscs:   discs.size,
      bestDayQ:      dayMap.size > 0 ? Math.max(...dayMap.values()) : 0,
      eliteDays:     eliteDaysList.length,
    }

    const achievements: Achievement[] = CATALOG.map(def => {
      const raw      = def.getValue(computed)
      const current  = Math.min(raw, def.target)
      const unlocked = raw >= def.target
      return {
        id:       def.id,
        category: def.category,
        icon:     def.icon,
        label:    def.label,
        desc:     def.desc,
        rarity:   def.rarity,
        unlocked,
        progress: { current, target: def.target },
      }
    })

    return { achievements, stats: computed }
  }, [sessionStats, eliteDaysList])
}

// ── Per-discipline achievements ────────────────────────────────────────────────

export interface DiscTierSlot {
  earned:     VolumeTier | PrecisaoTier | null
  next:       VolumeTier | PrecisaoTier | null
  current:    number
  nextTarget: number
  pct:        number
}

export interface DiscPrecisaoSlot extends DiscTierSlot {
  taxa:        number
  blockedByQ:  number | null  // non-null when question count prevents unlock
}

export interface DiscAchievementRow {
  disc:     string
  totalQ:   number
  taxa:     number
  sessions: number
  volume:   DiscTierSlot
  precisao: DiscPrecisaoSlot
  sessoes:  DiscTierSlot
}

function resolveVolume(value: number, tiers: VolumeTier[]): DiscTierSlot {
  let earned: VolumeTier | null = null
  let next:   VolumeTier | null = null
  for (const t of tiers) {
    if (value >= t.target) earned = t
    else if (!next) next = t
  }
  const nextTarget = next?.target ?? earned?.target ?? 1
  return {
    earned,
    next,
    current:    value,
    nextTarget,
    pct: Math.round((Math.min(value, nextTarget) / nextTarget) * 100),
  }
}

function resolvePrecisao(taxa: number, totalQ: number, tiers: PrecisaoTier[]): DiscPrecisaoSlot {
  let earned: PrecisaoTier | null = null
  let next:   PrecisaoTier | null = null

  for (const t of tiers) {
    if (totalQ >= t.minQ && taxa >= t.taxa) earned = t
    else if (!next) next = t
  }

  // Determine what's blocking the next tier: questions or accuracy
  const blockedByQ = next && totalQ < next.minQ ? next.minQ : null
  const progressVal  = blockedByQ != null ? totalQ  : taxa
  const progressTgt  = blockedByQ != null ? next!.minQ : (next?.taxa ?? earned?.taxa ?? 100)

  return {
    earned,
    next,
    taxa,
    blockedByQ,
    current:    progressVal,
    nextTarget: progressTgt,
    pct: Math.round((Math.min(progressVal, progressTgt) / progressTgt) * 100),
  }
}

export function useDiscAchievements(): DiscAchievementRow[] {
  const sessionStats = useStore(s => s.sessionStats)

  return useMemo(() => {
    const map = new Map<string, { totalQ: number; totalCorrect: number; sessions: number }>()

    for (const s of sessionStats) {
      const cur = map.get(s.disc) ?? { totalQ: 0, totalCorrect: 0, sessions: 0 }
      map.set(s.disc, {
        totalQ:      cur.totalQ + s.total,
        totalCorrect: cur.totalCorrect + s.correct,
        sessions:    cur.sessions + 1,
      })
    }

    return [...map.entries()]
      .map(([disc, v]) => {
        const taxa = v.totalQ > 0 ? Math.round((v.totalCorrect / v.totalQ) * 100) : 0
        return {
          disc,
          totalQ:   v.totalQ,
          taxa,
          sessions: v.sessions,
          volume:   resolveVolume(v.totalQ,   VOLUME_TIERS),
          precisao: resolvePrecisao(taxa, v.totalQ, PRECISAO_TIERS),
          sessoes:  resolveVolume(v.sessions, SESSOES_TIERS),
        }
      })
      .sort((a, b) => b.totalQ - a.totalQ)
  }, [sessionStats])
}
