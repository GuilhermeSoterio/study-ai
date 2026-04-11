import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Flashcard } from '@/types'
import type { AppState } from '../types'
import { toast } from '../toastStore'

export type FlashcardsSlice = Pick<AppState,
  | 'flashcards' | 'verbConjugations' | 'verbSessions'
  | 'addFlashcard' | 'updateFlashcard' | 'removeFlashcard'
>

export const createFlashcardsSlice: StateCreator<AppState, [], [], FlashcardsSlice> = (set, get) => ({
  flashcards:       [],
  verbConjugations: [],
  verbSessions:     [],

  addFlashcard: (card: Flashcard) => {
    set(s => ({ flashcards: [card, ...s.flashcards] }))
    const { userId } = get()
    if (userId) {
      supabase.from('flashcards').insert({ ...card, user_id: userId }).then(({ error }) => {
        if (error) {
          set(s => ({ flashcards: s.flashcards.filter(x => x.id !== card.id) }))
          toast.error('Erro ao criar flashcard. Tente novamente.')
        }
      })
    }
  },

  updateFlashcard: (id: string, updates: Partial<Flashcard>) => {
    const prev = get().flashcards
    set(s => ({
      flashcards: s.flashcards.map(c => c.id === id ? { ...c, ...updates } : c),
    }))
    supabase.from('flashcards').update(updates).eq('id', id).then(({ error }) => {
      if (error) {
        set({ flashcards: prev })
        toast.error('Erro ao atualizar flashcard.')
      }
    })
  },

  removeFlashcard: (id: string) => {
    const prev = get().flashcards
    set(s => ({ flashcards: s.flashcards.filter(c => c.id !== id) }))
    supabase.from('flashcards').delete().eq('id', id).then(({ error }) => {
      if (error) {
        set({ flashcards: prev })
        toast.error('Erro ao excluir flashcard.')
      }
    })
  },
})
