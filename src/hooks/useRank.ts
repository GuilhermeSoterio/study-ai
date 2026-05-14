import { useMemo } from 'react'
import { useStore } from '@/store'

export interface RankInfo {
  name:         string
  insig:        string
  color:        string
  avatar:       string
  index:        number
  goalPct:      number
  withinPct:    number
  next:         { name: string; min: number } | null
  sub:          string
  total:        number
  subLevel:     'N1' | 'N2' | 'N3'
  subLabel:     string
  cardReq:      number
  totalReviews: number
}

export const RANKS = [
  { min: 0,   name: 'RECRUTA',  insig: '◦',        color: '#9a9485', avatar: '🪖',  cardReq: 0    },
  { min: 5,   name: 'CABO',     insig: '▲',         color: '#8b7355', avatar: '🎖️', cardReq: 30   },
  { min: 15,  name: 'SARGENTO', insig: '▲▲',        color: '#6b8e5a', avatar: '⚔️', cardReq: 100  },
  { min: 30,  name: 'TENENTE',  insig: '★',         color: '#4a7c59', avatar: '⭐', cardReq: 500  },
  { min: 50,  name: 'CAPITÃO',  insig: '★★',        color: '#3a6648', avatar: '🛡️', cardReq: 1000 },
  { min: 65,  name: 'MAJOR',    insig: '★★★',       color: '#d4a017', avatar: '🦅', cardReq: 2500 },
  { min: 80,  name: 'CORONEL',  insig: '✦✦✦✦',      color: '#c0392b', avatar: '🎯', cardReq: 3500 },
  { min: 100, name: 'GENERAL',  insig: '⭐⭐⭐⭐⭐', color: '#8b0000', avatar: '👑', cardReq: 5000 },
]

const RANK_SUBS: Record<string, string> = {
  RECRUTA:  'Todo general começou aqui. Sua campanha começa agora.',
  CABO:     'Primeiros pontos no mapa. Continue avançando.',
  SARGENTO: 'Você ganhou faixas. O pelotão reconhece seu esforço.',
  TENENTE:  'Estrela no ombro. Você comanda sua própria disciplina.',
  CAPITÃO:  'Duas estrelas. Metade do campo é seu.',
  MAJOR:    'Três estrelas. A vitória está próxima, Major.',
  CORONEL:  'Quatro insígnias. Você lidera pelo exemplo.',
  GENERAL:  'Meta conquistada. A missão está cumprida, General.',
}

function calcSubLevel(pct: number): { subLevel: 'N1' | 'N2' | 'N3'; subLabel: string } {
  if (pct >= 90) return { subLevel: 'N3', subLabel: 'Elite'    }
  if (pct >= 50) return { subLevel: 'N2', subLabel: 'Veterano' }
  return              { subLevel: 'N1', subLabel: 'Operador' }
}

export function useRank(): RankInfo {
  const sessionStats = useStore(s => s.sessionStats)
  const flashcards   = useStore(s => s.flashcards)
  const config       = useStore(s => s.config)

  return useMemo(() => {
    const total   = sessionStats.reduce((s, r) => s + r.total, 0)
    const goalPct = config.big_goal > 0
      ? Math.min(100, Math.round((total / config.big_goal) * 100))
      : 0

    const totalReviews = flashcards.reduce((sum, c) => sum + (c.reviews?.length ?? 0), 0)

    let rankIdx = 0
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (goalPct >= RANKS[i].min) { rankIdx = i; break }
    }

    const current = RANKS[rankIdx]
    const next    = RANKS[rankIdx + 1] ?? null

    const withinPct = next
      ? Math.min(100, Math.round(((goalPct - current.min) / (next.min - current.min)) * 100))
      : 100

    const { subLevel, subLabel } = calcSubLevel(withinPct)

    return {
      ...current,
      index:    rankIdx,
      goalPct,
      withinPct,
      next,
      sub:          RANK_SUBS[current.name] ?? '',
      total,
      subLevel,
      subLabel,
      totalReviews,
    }
  }, [sessionStats, flashcards, config])
}
