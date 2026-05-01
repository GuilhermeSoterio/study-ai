import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session } from '@/types'
import type { AppState } from '../types'
import { toast } from '../toastStore'

export type SessionsSlice = Pick<AppState,
  'sessions' | 'sessionStats' | 'addSession' | 'updateSession' | 'removeSession'
>

export const createSessionsSlice: StateCreator<AppState, [], [], SessionsSlice> = (set, get) => ({
  sessions:     [],
  sessionStats: [],

  addSession: (session: Session) => {
    const stat = { id: session.id, date: session.date, total: session.total,
                   correct: session.correct, disc: session.disc, mat: session.mat }
    set(s => ({
      sessions:     [session, ...s.sessions],
      sessionStats: [stat, ...s.sessionStats],
    }))
    const { userId } = get()
    if (userId) {
      supabase.from('sessions').insert({ ...session, user_id: userId }).then(({ error }) => {
        if (error) {
          set(s => ({
            sessions:     s.sessions.filter(x => x.id !== session.id),
            sessionStats: s.sessionStats.filter(x => x.id !== session.id),
          }))
          toast.error('Erro ao registrar sessão. Verifique sua conexão.')
        }
      })
    }
  },

  updateSession: (id, updates) => {
    const prev     = get().sessions
    const prevStat = get().sessionStats
    set(s => ({
      sessions:     s.sessions.map(x => x.id === id ? { ...x, ...updates } : x),
      sessionStats: s.sessionStats.map(x => x.id === id ? { ...x, ...updates } : x),
    }))
    supabase.from('sessions').update(updates).eq('id', id).then(({ error }) => {
      if (error) {
        set({ sessions: prev, sessionStats: prevStat })
        toast.error('Erro ao atualizar sessão.')
      }
    })
  },

  removeSession: (id: string) => {
    const prev     = get().sessions
    const prevStat = get().sessionStats
    set(s => ({
      sessions:     s.sessions.filter(x => x.id !== id),
      sessionStats: s.sessionStats.filter(x => x.id !== id),
    }))
    supabase.from('sessions').delete().eq('id', id).then(({ error }) => {
      if (error) {
        set({ sessions: prev, sessionStats: prevStat })
        toast.error('Erro ao remover sessão.')
      }
    })
  },
})
