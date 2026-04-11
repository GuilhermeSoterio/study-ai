import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { DEFAULT_CONFIG, DEFAULT_DISC, DEFAULT_BANCAS } from './defaults'
import { createAuthSlice }       from './slices/authSlice'
import { createSessionsSlice }   from './slices/sessionsSlice'
import { createFlashcardsSlice } from './slices/flashcardsSlice'
import { createConfigSlice }     from './slices/configSlice'
import { createUiSlice }         from './slices/uiSlice'
import type { AppState } from './types'

export { type AppState }

export const useStore = create<AppState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createSessionsSlice(...a),
  ...createFlashcardsSlice(...a),
  ...createConfigSlice(...a),
  ...createUiSlice(...a),

  // loadAll toca todos os slices — fica na composição
  loadAll: async () => {
    const [set] = a
    set({ loading: true })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    set({ userId: user.id, userEmail: user.email ?? null })

    const [sr, ssR, cr, cfgR, bancasR, discR] = await Promise.all([
      // 500 rows mais recentes (full) — para UI, heatmap, gráficos
      supabase.from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('ts', { ascending: false })
        .limit(500),
      // Todas as sessions mas só 6 colunas — para stats all-time e skill tree
      supabase.from('sessions')
        .select('id,date,total,correct,disc,mat')
        .eq('user_id', user.id),
      supabase.from('flashcards').select('*').eq('user_id', user.id).limit(2000),
      supabase.from('user_config').select('*').eq('user_id', user.id).single(),
      supabase.from('bancas').select('*').eq('user_id', user.id).single(),
      supabase.from('disciplines').select('*').eq('user_id', user.id).single(),
    ])

    set({
      sessions:     sr.data ?? [],
      sessionStats: ssR.data ?? [],
      flashcards:   (cr.data ?? []).map(c => ({ ...c, reviews: c.reviews ?? [] })),
      config:    cfgR.data ?? { ...DEFAULT_CONFIG, user_id: user.id },
      bancas:    bancasR.data?.data ?? DEFAULT_BANCAS,
      disc:      (discR.data?.data && Object.keys(discR.data.data).length > 0)
                   ? discR.data.data
                   : DEFAULT_DISC,
      loading:   false,
    })
  },
}))
