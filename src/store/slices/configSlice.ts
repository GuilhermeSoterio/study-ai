import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import { backendApi } from '@/lib/backendApi'
import type { UserConfig } from '@/types'
import type { AppState } from '../types'
import { DEFAULT_CONFIG, DEFAULT_DISC, DEFAULT_BANCAS } from '../defaults'
import { toast } from '../toastStore'

export type ConfigSlice = Pick<AppState,
  'config' | 'bancas' | 'disc' | 'skillTree' | 'character' | 'saveConfig' | 'saveDisc'
>

export const createConfigSlice: StateCreator<AppState, [], [], ConfigSlice> = (set, get) => ({
  config:    DEFAULT_CONFIG,
  bancas:    DEFAULT_BANCAS,
  disc:      DEFAULT_DISC,
  skillTree: [],
  character: null,

  saveConfig: async (cfg: Partial<UserConfig>) => {
    const { userId, config } = get()
    const updated = { ...config, ...cfg }
    set({ config: updated })
    if (userId) {
      const { error } = await supabase.from('user_config').upsert({ ...updated, user_id: userId })
      if (error) {
        set({ config })
        toast.error('Erro ao salvar configurações.')
      }
    }
  },

  saveDisc: async (newDisc: Record<string, string[]>) => {
    const prev = get().disc
    set({ disc: newDisc })
    try {
      await backendApi.put('/v1/disciplines', { disciplines: newDisc })
    } catch {
      set({ disc: prev })
      toast.error('Erro ao salvar disciplinas.')
    }
  },
})
