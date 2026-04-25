import type { Session, SessionStat, Flashcard, UserConfig, VerbConjugation, VerbSession, CharacterData } from '@/types'
import type { TNode } from '@/components/personagem/types'

export interface AppState {
  // ── Auth ──────────────────────────────────────────────────────────────
  userId:    string | null
  userEmail: string | null
  signIn:    (email: string, password: string) => Promise<string | null>
  signOut:   () => Promise<void>

  // ── Sessions ──────────────────────────────────────────────────────────
  /** 500 rows mais recentes — para UI (heatmap, gráficos, histórico). */
  sessions:      Session[]
  /** Todas as sessions, só 6 colunas — para stats all-time e skill tree. */
  sessionStats:  SessionStat[]
  addSession:    (session: Session) => void
  removeSession: (id: string) => void

  // ── Flashcards ────────────────────────────────────────────────────────
  flashcards:       Flashcard[]
  verbConjugations: VerbConjugation[]
  verbSessions:     VerbSession[]
  addFlashcard:     (card: Flashcard) => void
  updateFlashcard:  (id: string, updates: Partial<Flashcard>) => void
  removeFlashcard:  (id: string) => void

  // ── Config ────────────────────────────────────────────────────────────
  config:    UserConfig
  bancas:    string[]
  disc:      Record<string, string[]>
  skillTree: TNode[]
  character: CharacterData | null
  saveConfig: (cfg: Partial<UserConfig>) => Promise<void>
  saveDisc:   (disc: Record<string, string[]>) => Promise<void>

  // ── UI ────────────────────────────────────────────────────────────────
  loading: boolean
  loaded:  boolean
  loadAll: () => Promise<void>
}
