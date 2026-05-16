import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { RankCard } from '@/types'
import type { AppState } from '../types'
import { toast } from '../toastStore'

export type RankCardsSlice = Pick<AppState,
  | 'rankCards'
  | 'addRankCard' | 'addRankCards' | 'updateRankCard' | 'removeRankCard'
>

export const createRankCardsSlice: StateCreator<AppState, [], [], RankCardsSlice> = (set, get) => ({
  rankCards: [],

  addRankCards: (cards: RankCard[]) => {
    set(s => ({ rankCards: [...cards, ...s.rankCards] }))
    const { userId } = get()
    if (userId) {
      supabase.from('rank_cards')
        .insert(cards.map(c => ({ ...c, user_id: userId })))
        .then(({ error }) => {
          if (error) {
            const ids = new Set(cards.map(c => c.id))
            set(s => ({ rankCards: s.rankCards.filter(x => !ids.has(x.id)) }))
            toast.error('Erro ao importar EloCards.')
          }
        })
    }
  },

  addRankCard: (card: RankCard) => {
    set(s => ({ rankCards: [card, ...s.rankCards] }))
    const { userId } = get()
    if (userId) {
      supabase.from('rank_cards').insert({ ...card, user_id: userId }).then(({ error }) => {
        if (error) {
          set(s => ({ rankCards: s.rankCards.filter(x => x.id !== card.id) }))
          toast.error('Erro ao criar RankCard. Tente novamente.')
        }
      })
    }
  },

  updateRankCard: (id: string, updates: Partial<RankCard>) => {
    const prev = get().rankCards
    set(s => ({
      rankCards: s.rankCards.map(c => c.id === id ? { ...c, ...updates } : c),
    }))
    supabase.from('rank_cards').update(updates).eq('id', id).then(({ error }) => {
      if (error) {
        set({ rankCards: prev })
        toast.error('Erro ao atualizar RankCard.')
      }
    })
  },

  removeRankCard: (id: string) => {
    const prev = get().rankCards
    set(s => ({ rankCards: s.rankCards.filter(c => c.id !== id) }))
    supabase.from('rank_cards').delete().eq('id', id).then(({ error }) => {
      if (error) {
        set({ rankCards: prev })
        toast.error('Erro ao excluir RankCard.')
      }
    })
  },
})
