import { type StateCreator } from 'zustand'
import type { AppState } from '../types'

export type UiSlice = Pick<AppState, 'loading'>

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = () => ({
  loading: true,
})
