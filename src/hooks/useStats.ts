import { useMemo } from 'react'
import { useStore } from '@/store'
import type { SessionStat } from '@/types'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function calcStreak(stats: SessionStat[]) {
  const days = new Set(stats.map(s => s.date))
  let streak = 0
  const d = new Date()
  while (true) {
    const key = d.toISOString().slice(0, 10)
    if (!days.has(key)) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function calcBestStreak(stats: SessionStat[]) {
  if (stats.length < 2) {
    return stats.length
  }

  // Obtém datas únicas e as ordena para garantir a sequência correta.
  const uniqueDays = [...new Set(stats.map(s => s.date))].sort()

  let bestStreak = 1
  let currentStreak = 1
  const oneDayInMs = 86400000 // milissegundos em um dia

  for (let i = 1; i < uniqueDays.length; i++) {
    const day1 = new Date(uniqueDays[i - 1]).getTime()
    const day2 = new Date(uniqueDays[i]).getTime()

    currentStreak = (day2 - day1) === oneDayInMs ? currentStreak + 1 : 1
    if (currentStreak > bestStreak) bestStreak = currentStreak
  }
  return bestStreak
}

export function useStats() {
  // sessionStats = all-time, lightweight (6 colunas) — para totais, streak, acc
  // sessions     = 500 recentes, completo — para daily/weekly/monthly
  const sessionStats = useStore(s => s.sessionStats)
  const sessions     = useStore(s => s.sessions)
  const config       = useStore(s => s.config)

  return useMemo(() => {
    const total   = sessionStats.reduce((s, r) => s + r.total, 0)
    const correct = sessionStats.reduce((s, r) => s + r.correct, 0)
    const errors  = total - correct
    const acc     = total > 0 ? Math.round((correct / total) * 100) : 0

    const today        = todayStr()
    const todayTotal   = sessions.filter(s => s.date === today)
                                 .reduce((s, r) => s + r.total, 0)

    const weekStart    = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    const weekTotal    = sessions
      .filter(s => s.date >= weekStart.toISOString().slice(0, 10))
      .reduce((s, r) => s + r.total, 0)

    const monthStart   = new Date()
    monthStart.setDate(1)
    const monthTotal   = sessions
      .filter(s => s.date >= monthStart.toISOString().slice(0, 10))
      .reduce((s, r) => s + r.total, 0)

    const streak     = calcStreak(sessionStats)
    const bestStreak = calcBestStreak(sessionStats)
    const goalPct    = Math.min(100, Math.round((total / config.big_goal) * 100))
    const dailyPct   = Math.min(100, Math.round((todayTotal / config.daily) * 100))

    return {
      total, correct, errors, acc,
      todayTotal, weekTotal, monthTotal,
      streak, bestStreak,
      goalPct, dailyPct,
    }
  }, [sessionStats, sessions, config])
}
