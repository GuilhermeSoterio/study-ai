import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { AppState } from '../types'
import type { PurgeRecord, SessionStat } from '@/types'
import { toast } from '../toastStore'

export type PurgeSlice = Pick<AppState, 'purgeRecords' | 'executePurge'>

export const createPurgeSlice: StateCreator<AppState, [], [], PurgeSlice> = (set, get) => ({
  purgeRecords: [],

  executePurge: async ({ disc, mat, errorsCleared, challengeCorrect }) => {
    const { userId } = get()
    if (!userId) return

    const purgeId   = crypto.randomUUID()
    const sessionId = crypto.randomUUID()
    const now       = new Date()
    const date      = now.toISOString().split('T')[0]
    const ts        = now.getTime()

    // Persist purge record
    const { error: purgeErr } = await supabase.from('purge_records').insert({
      id: purgeId, user_id: userId, disc, mat,
      errors_cleared: errorsCleared, purged_at: date,
    })
    if (purgeErr) {
      toast.error('Erro ao registrar Protocolo de Limpeza.')
      return
    }

    // Insert challenge as a real session so it counts in daily/all-time stats
    supabase.from('sessions').insert({
      id: sessionId, user_id: userId, ts, date, disc, mat,
      total: 5, correct: challengeCorrect,
      banca: 'Protocolo de Limpeza', source: 'purge',
    }).then(() => {})

    // Update local state
    const record: PurgeRecord = { id: purgeId, disc, mat, errors_cleared: errorsCleared, purged_at: date }
    const stat: SessionStat   = { id: sessionId, date, total: 5, correct: challengeCorrect, disc, mat }

    set(s => ({
      purgeRecords: [...s.purgeRecords, record],
      sessionStats: [...s.sessionStats, stat],
    }))
  },
})
