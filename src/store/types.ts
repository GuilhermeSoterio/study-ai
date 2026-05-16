import type { Session, SessionStat, Flashcard, Conceito, UserConfig, VerbConjugation, VerbSession, CharacterData, PurgeRecord, Questao, RankCard } from '@/types'
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
  hasMoreSessions: boolean
  addSession:       (session: Session) => void
  updateSession:    (id: string, updates: Partial<Pick<Session, 'correct' | 'total' | 'disc' | 'mat' | 'banca' | 'date' | 'tema' | 'error_type'>>) => void
  refreshSinceTs:   (since: number) => Promise<void>
  loadMoreSessions: () => Promise<void>

  // ── Questões individuais ──────────────────────────────────────────────
  questoes:      Questao[]
  addQuestao:    (q: Questao) => void
  updateQuestao: (id: string, updates: Partial<Questao>) => void
  removeQuestao: (id: string) => void
  removeSession: (id: string) => void

  // ── Flashcards ────────────────────────────────────────────────────────
  flashcards:       Flashcard[]
  verbConjugations: VerbConjugation[]
  verbSessions:     VerbSession[]
  addFlashcard:     (card: Flashcard) => void
  updateFlashcard:  (id: string, updates: Partial<Flashcard>) => void
  removeFlashcard:  (id: string) => void

  // ── RankCards ─────────────────────────────────────────────────────────
  rankCards:        RankCard[]
  addRankCard:      (card: RankCard) => void
  addRankCards:     (cards: RankCard[]) => void
  updateRankCard:   (id: string, updates: Partial<RankCard>) => void
  removeRankCard:   (id: string) => void

  // ── Conceitos ─────────────────────────────────────────────────────────
  conceitos:      Conceito[]
  addConceito:    (c: Conceito) => void
  updateConceito: (id: string, updates: Partial<Conceito>) => void
  removeConceito: (id: string) => void

  // ── Config ────────────────────────────────────────────────────────────
  config:    UserConfig
  bancas:    string[]
  disc:      Record<string, string[]>
  skillTree: TNode[]
  character: CharacterData | null
  saveConfig: (cfg: Partial<UserConfig>) => Promise<void>
  saveDisc:   (disc: Record<string, string[]>) => Promise<void>

  // ── Purge ─────────────────────────────────────────────────────────────
  purgeRecords: PurgeRecord[]
  executePurge: (p: {
    disc:             string
    mat:              string
    errorsCleared:    number
    challengeCorrect: number
  }) => Promise<void>

  // ── UI ────────────────────────────────────────────────────────────────
  loading: boolean
  loaded:  boolean
  loadAll: () => Promise<void>
}
