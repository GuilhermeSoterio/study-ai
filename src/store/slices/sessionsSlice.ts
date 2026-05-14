import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Session } from '@/types'
import type { AppState } from '../types'
import { toast } from '../toastStore'

export type SessionsSlice = Pick<AppState,
  'sessions' | 'sessionStats' | 'hasMoreSessions' |
  'addSession' | 'updateSession' | 'removeSession' | 'refreshSinceTs' | 'loadMoreSessions'
>

const PAGE = 500

export const createSessionsSlice: StateCreator<AppState, [], [], SessionsSlice> = (set, get) => ({
  sessions:        [],
  sessionStats:    [],
  hasMoreSessions: false,

  addSession: (session: Session) => {
    // Canonicaliza disc/mat para evitar duplicatas por capitalização
    const discMap = get().disc
    const discKey = Object.keys(discMap).find(
      k => k.toLowerCase().trim() === session.disc.toLowerCase().trim()
    ) ?? session.disc
    const mats = discMap[discKey] ?? []
    const matKey = mats.find(
      m => m.toLowerCase().trim() === session.mat.toLowerCase().trim()
    ) ?? session.mat
    const canonSession = { ...session, disc: discKey, mat: matKey }

    const stat = { id: canonSession.id, date: canonSession.date, total: canonSession.total,
                   correct: canonSession.correct, disc: canonSession.disc, mat: canonSession.mat, tema: canonSession.tema }
    set(s => ({
      sessions:     [canonSession, ...s.sessions],
      sessionStats: [stat, ...s.sessionStats],
    }))
    const { userId } = get()
    if (userId) {
      supabase.from('sessions').insert({ ...canonSession, user_id: userId }).then(({ error }) => {
        if (error) {
          set(s => ({
            sessions:     s.sessions.filter(x => x.id !== canonSession.id),
            sessionStats: s.sessionStats.filter(x => x.id !== canonSession.id),
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

  refreshSinceTs: async (since: number) => {
    const { userId } = get()
    if (!userId) return
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gt('ts', since)
      .order('ts', { ascending: false })
    if (!data?.length) return
    const existing = new Set(get().sessions.map(s => s.id))
    const news = data.filter((s: Session) => !existing.has(s.id))
    if (!news.length) return
    const newStats = news.map((s: Session) => ({
      id: s.id, date: s.date, total: s.total,
      correct: s.correct, disc: s.disc, mat: s.mat, tema: s.tema,
    }))
    set(s => ({
      sessions:     [...news, ...s.sessions],
      sessionStats: [...newStats, ...s.sessionStats],
    }))
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

  loadMoreSessions: async () => {
    const { userId, sessions } = get()
    if (!userId || !sessions.length) return
    const oldestTs = Math.min(...sessions.map(s => s.ts))
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .lt('ts', oldestTs)
      .order('ts', { ascending: false })
      .limit(PAGE)
    if (!data?.length) { set({ hasMoreSessions: false }); return }
    const existing = new Set(sessions.map(s => s.id))
    const fresh = (data as Session[]).filter(s => !existing.has(s.id))
    const freshStats = fresh.map(s => ({
      id: s.id, date: s.date, total: s.total,
      correct: s.correct, disc: s.disc, mat: s.mat, tema: s.tema,
    }))
    set(s => ({
      sessions:        [...s.sessions, ...fresh],
      sessionStats:    [...s.sessionStats, ...freshStats],
      hasMoreSessions: data.length >= PAGE,
    }))
  },
})
