import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { AppState } from '../types'

export type AuthSlice = Pick<AppState,
  'userId' | 'userEmail' | 'signIn' | 'signOut'
>

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set) => ({
  userId:    null,
  userEmail: null,

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ userId: null, userEmail: null, sessions: [], flashcards: [] })
  },
})
