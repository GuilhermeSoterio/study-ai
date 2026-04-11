import { type StateCreator } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { UserConfig } from '@/types'
import type { AppState } from '../types'
import { DEFAULT_CONFIG, DEFAULT_DISC, DEFAULT_BANCAS } from '../defaults'
import { toast } from '../toastStore'

export type ConfigSlice = Pick<AppState,
  'config' | 'bancas' | 'disc' | 'saveConfig'
>

export const createConfigSlice: StateCreator<AppState, [], [], ConfigSlice> = (set, get) => ({
  config: DEFAULT_CONFIG,
  bancas: DEFAULT_BANCAS,
  disc:   DEFAULT_DISC,

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
})
