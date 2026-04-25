import { useMemo } from 'react'
import { useStore } from '@/store'

// ── Medal tiers ───────────────────────────────────────────────────────────────

export interface MedalDef {
  id:     string
  label:  string
  desc:   string
  minTaxa: number
  minQ:    number
  icon:   string
  color:  string
  bg:     string
  border: string
}

export const MEDAL_DEFS: MedalDef[] = [
  {
    id: 'mencao', label: 'Menção Honrosa', desc: 'Destaque operacional',
    minTaxa: 70, minQ: 15,
    icon: '🎖️', color: '#cd7f32',
    bg: 'rgba(205,127,50,0.08)', border: 'rgba(205,127,50,0.28)',
  },
  {
    id: 'merito', label: 'Medalha de Mérito', desc: 'Distinção em combate',
    minTaxa: 80, minQ: 25,
    icon: '🥈', color: '#7a8fa6',
    bg: 'rgba(122,143,166,0.08)', border: 'rgba(122,143,166,0.28)',
  },
  {
    id: 'cruz', label: 'Cruz de Guerra', desc: 'Excelência operacional',
    minTaxa: 90, minQ: 40,
    icon: '✦', color: '#d4a017',
    bg: 'rgba(212,160,23,0.10)', border: 'rgba(212,160,23,0.35)',
  },
]

// ── useMedals ─────────────────────────────────────────────────────────────────

export interface MatMedal {
  mat:   string
  disc:  string
  taxa:  number
  total: number
  medal: MedalDef
}

export function useMedals(): MatMedal[] {
  const sessionStats = useStore(s => s.sessionStats)

  return useMemo(() => {
    const map = new Map<string, { disc: string; total: number; correct: number }>()
    for (const s of sessionStats) {
      const cur = map.get(s.mat) ?? { disc: s.disc, total: 0, correct: 0 }
      map.set(s.mat, { disc: cur.disc, total: cur.total + s.total, correct: cur.correct + s.correct })
    }

    const results: MatMedal[] = []
    for (const [mat, v] of map) {
      const taxa = v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0
      // highest tier earned
      let best: MedalDef | null = null
      for (let i = MEDAL_DEFS.length - 1; i >= 0; i--) {
        const m = MEDAL_DEFS[i]
        if (taxa >= m.minTaxa && v.total >= m.minQ) { best = m; break }
      }
      if (best) results.push({ mat, disc: v.disc, taxa, total: v.total, medal: best })
    }

    return results.sort((a, b) => {
      const ai = MEDAL_DEFS.indexOf(a.medal)
      const bi = MEDAL_DEFS.indexOf(b.medal)
      return bi !== ai ? bi - ai : b.taxa - a.taxa
    })
  }, [sessionStats])
}

// ── useEliteDays ──────────────────────────────────────────────────────────────

export interface EliteDay {
  date:  string
  total: number
  taxa:  number
}

export const ELITE_TAXA = 80
export const ELITE_MIN_Q = 10

export function useEliteDays(minTaxa = ELITE_TAXA, minQ = ELITE_MIN_Q): EliteDay[] {
  const sessionStats = useStore(s => s.sessionStats)

  return useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>()
    for (const s of sessionStats) {
      const cur = map.get(s.date) ?? { total: 0, correct: 0 }
      map.set(s.date, { total: cur.total + s.total, correct: cur.correct + s.correct })
    }

    return [...map.entries()]
      .map(([date, v]) => ({
        date,
        total: v.total,
        taxa:  v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      }))
      .filter(d => d.total >= minQ && d.taxa >= minTaxa)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [sessionStats, minTaxa, minQ])
}

export function calcEliteStreak(days: EliteDay[]): number {
  if (days.length === 0) return 0
  const set  = new Set(days.map(d => d.date))
  let streak = 0
  const d    = new Date()
  while (true) {
    const key = d.toISOString().slice(0, 10)
    if (!set.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
