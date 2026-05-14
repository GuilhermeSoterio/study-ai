import { useMemo } from 'react'
import { useStore } from '@/store'
import { localDate } from '@/lib/utils'
import type { SessionStat } from '@/types'

function dateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localDate(d)
}

function questionsOnDate(stats: SessionStat[], date: string): number {
  return stats.filter(s => s.date === date).reduce((sum, s) => sum + s.total, 0)
}

export type DayStatus = 'good' | 'partial' | 'miss' | 'before-start'

export interface HistoryDay {
  date:   string
  q:      number
  status: DayStatus
}

export interface MoralInfo {
  score:           number      // 0–100
  status:          string      // label descritivo
  color:           string      // hex
  isCollapsed:     boolean     // score === 0
  consecutiveGood: number      // dias consecutivos cumprindo meta (de hoje para trás)
  todayMet:        boolean
  todayQ:          number
  history:         HistoryDay[] // últimos 13 dias completos, do mais antigo ao mais recente
}

const WINDOW = 13

export function useMoral(): MoralInfo {
  const sessionStats = useStore(s => s.sessionStats)
  const config       = useStore(s => s.config)

  return useMemo(() => {
    const daily = config.daily || 30

    // Primeira sessão do usuário — dias anteriores não contam como falta
    const firstDate = sessionStats.length > 0
      ? [...sessionStats].sort((a, b) => a.date.localeCompare(b.date))[0].date
      : null

    // Histórico: 13 dias completos do mais antigo ao mais recente (excluindo hoje)
    const history: HistoryDay[] = Array.from({ length: WINDOW }, (_, i) => {
      const date = dateNDaysAgo(WINDOW - i)
      if (firstDate && date < firstDate) return { date, q: 0, status: 'before-start' }
      const q      = questionsOnDate(sessionStats, date)
      const status: DayStatus = q >= daily ? 'good' : q > 0 ? 'partial' : 'miss'
      return { date, q, status }
    })

    // Pontuação: começa em 70 (neutro), aplica o histórico
    let score = 70
    for (const day of history) {
      if (day.status === 'before-start') continue
      if (day.status === 'good')         score = Math.min(100, score + 10)
      else if (day.status === 'partial') score = Math.max(0,   score - 5)
      else                               score = Math.max(0,   score - 20)
    }

    // Hoje: bônus se cumpriu, sem penalidade se ainda não cumpriu
    const todayQ   = questionsOnDate(sessionStats, dateNDaysAgo(0))
    const todayMet = todayQ >= daily
    if (todayMet) score = Math.min(100, score + 10)

    // Dias consecutivos com meta cumprida (de hoje para trás)
    let consecutiveGood = 0
    if (todayMet) {
      consecutiveGood = 1
      for (let i = 1; i <= WINDOW; i++) {
        if (questionsOnDate(sessionStats, dateNDaysAgo(i)) >= daily) consecutiveGood++
        else break
      }
    }

    const isCollapsed = score === 0
    let status: string
    let color: string

    if      (score === 0)  { status = 'REBAIXADO';        color = '#7f1d1d' }
    else if (score <= 19)  { status = 'Colapso Iminente'; color = '#c0392b' }
    else if (score <= 39)  { status = 'Crítico';          color = '#e07b39' }
    else if (score <= 59)  { status = 'Instável';         color = '#d4a017' }
    else if (score <= 79)  { status = 'Regular';          color = '#6b8e5a' }
    else                   { status = 'Operacional';      color = '#4a7c59' }

    return { score, status, color, isCollapsed, consecutiveGood, todayMet, todayQ, history }
  }, [sessionStats, config])
}
