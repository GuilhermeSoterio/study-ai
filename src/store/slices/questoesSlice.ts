import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Questao } from '@/types'
import type { AppState } from '../types'
import { toast } from '../toastStore'

export type QuestoesSlice = Pick<AppState, 'questoes' | 'addQuestao' | 'updateQuestao' | 'removeQuestao'>

export const createQuestoesSlice: StateCreator<AppState, [], [], QuestoesSlice> = (set, get) => ({
  questoes: [],

  addQuestao: (questao: Questao) => {
    set(s => ({ questoes: [questao, ...s.questoes] }))
    const { userId } = get()
    if (userId) {
      supabase.from('questoes').insert({ ...questao, user_id: userId }).then(({ error }) => {
        if (error) {
          set(s => ({ questoes: s.questoes.filter(x => x.id !== questao.id) }))
          toast.error('Erro ao registrar questão. Verifique sua conexão.')
        }
      })
    }
  },

  updateQuestao: (id, updates) => {
    const prev = get().questoes
    set(s => ({ questoes: s.questoes.map(x => x.id === id ? { ...x, ...updates } : x) }))
    supabase.from('questoes').update(updates).eq('id', id).then(({ error }) => {
      if (error) {
        set({ questoes: prev })
        toast.error('Erro ao atualizar questão.')
      }
    })
  },

  removeQuestao: (id: string) => {
    const prev = get().questoes
    set(s => ({ questoes: s.questoes.filter(x => x.id !== id) }))
    supabase.from('questoes').delete().eq('id', id).then(({ error }) => {
      if (error) {
        set({ questoes: prev })
        toast.error('Erro ao remover questão.')
      }
    })
  },
})
