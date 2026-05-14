import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Conceito } from '@/types'
import type { AppState } from '../types'
import { toast } from '../toastStore'

export type ConceitosSlice = Pick<AppState,
  'conceitos' | 'addConceito' | 'updateConceito' | 'removeConceito'
>

export const createConceitosSlice: StateCreator<AppState, [], [], ConceitosSlice> = (set, get) => ({
  conceitos: [],

  addConceito: (c: Conceito) => {
    set(s => ({ conceitos: [c, ...s.conceitos] }))
    const { userId } = get()
    if (userId) {
      supabase.from('conceitos').insert({ ...c, user_id: userId }).then(({ error }) => {
        if (error) {
          set(s => ({ conceitos: s.conceitos.filter(x => x.id !== c.id) }))
          toast.error('Erro ao salvar conceito.')
        }
      })
    }
  },

  updateConceito: (id, updates) => {
    const prev = get().conceitos
    set(s => ({ conceitos: s.conceitos.map(c => c.id === id ? { ...c, ...updates } : c) }))
    supabase.from('conceitos').update(updates).eq('id', id).then(({ error }) => {
      if (error) {
        set({ conceitos: prev })
        toast.error('Erro ao atualizar conceito.')
      }
    })
  },

  removeConceito: (id) => {
    const prev = get().conceitos
    set(s => ({ conceitos: s.conceitos.filter(c => c.id !== id) }))
    supabase.from('conceitos').delete().eq('id', id).then(({ error }) => {
      if (error) {
        set({ conceitos: prev })
        toast.error('Erro ao remover conceito.')
      }
    })
  },
})
