export interface Session {
  id: string
  user_id: string
  ts: number
  date: string
  disc: string
  mat: string
  total: number
  correct: number
  banca: string
  source?: string
  created_at?: string
}

export interface Flashcard {
  id: string
  user_id: string
  ts: number
  disc: string
  mat: string
  q: string
  a: string
  banca: string
  reviews: FlashcardReview[]
  created_at?: string
}

export interface FlashcardReview {
  ts: number
  rating: 1 | 2 | 3
  nextDue: number
}

export interface UserConfig {
  user_id: string
  daily: number
  big_goal: number
  weekly: number
  monthly: number
}

export interface VerbConjugation {
  id: string
  user_id: string
  ts: number
  verbo: string
  tempo: string
  eu: string
  tu: string
  ele_ela: string
  nos: string
  vos: string
  eles_elas: string
}

export interface VerbSession {
  id: string
  user_id: string
  verb_id: string
  ts: number
  date: string
  score: number
  details: Record<string, unknown>
}

/** Versão leve de Session usada para estatísticas all-time (sem banca, source, ts). */
export interface SessionStat {
  id:      string
  date:    string
  total:   number
  correct: number
  disc:    string
  mat:     string
}

export type TabName =
  | 'dashboard'
  | 'registrar'
  | 'analise'
  | 'historico'
  | 'flashcards'
  | 'materias'
  | 'verbos'
  | 'personagem'
