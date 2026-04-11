import { create } from 'zustand'

export type ToastType = 'error' | 'success' | 'info'

export interface Toast {
  id:      string
  message: string
  type:    ToastType
}

interface ToastStore {
  toasts:      Toast[]
  addToast:    (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (message, type = 'error') => {
    const id = crypto.randomUUID()
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, 4500)
  },

  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

/** Uso fora de componentes React (dentro dos slices do store) */
export const toast = {
  error:   (msg: string) => useToastStore.getState().addToast(msg, 'error'),
  success: (msg: string) => useToastStore.getState().addToast(msg, 'success'),
  info:    (msg: string) => useToastStore.getState().addToast(msg, 'info'),
}
