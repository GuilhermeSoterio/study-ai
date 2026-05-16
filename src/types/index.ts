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
  source?:     string
  error_type?: 'nao_sabia' | 'interpretacao' | 'distracao' | 'pegadinha' | 'tempo' | null
  tema?:       string | null
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
  correct?: boolean
  ignored?: boolean
  created_at?: string
}

export interface FlashcardReview {
  ts: number
  rating: 1 | 2 | 3
  nextDue: number
}

export interface Conceito {
  id: string
  user_id: string
  ts: number
  disc: string
  mat: string
  titulo: string
  conteudo: string
  reviews: FlashcardReview[]
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
  tema?:   string | null
}

export interface CharacterData {
  user_id:       string
  xp:            number
  level:         number
  level_title:   string
  level_emoji:   string
  xp_next_level: number
  stats: {
    total_questions:     number
    total_correct:       number
    accuracy:            number
    streak:              number
    best_streak:         number
    subjects_studied:    number
    disciplines_studied: number
  }
  achievements: {
    id:          string
    label:       string
    description: string
    unlocked:    boolean
    unlocked_at: string | null
  }[]
}

export interface DiaryEntry {
  id:         string
  user_id:    string
  date:       string
  atacou:     string
  resistiu:   string
  reforco:    string
  created_at?: string
  updated_at?: string
}

export interface PurgeRecord {
  id:             string
  disc:           string
  mat:            string
  errors_cleared: number
  purged_at:      string
  created_at?:    string
}

export interface Questao {
  id:          string
  user_id:     string
  ts:          number
  date:        string
  disc:        string
  mat:         string
  banca:       string
  enunciado?:  string | null
  correto:     boolean
  error_type?: 'nao_sabia' | 'interpretacao' | 'distracao' | 'pegadinha' | 'tempo' | null
  tema?:       string | null
  created_at?: string
}

export type RankCardElo = 'Platina' | 'Ouro' | 'Prata' | 'Bronze'

export interface RankCard {
  id: string
  user_id: string
  ts: number
  created_at?: string
  disciplina: string
  materia: string
  modalidade: string
  elo: RankCardElo
  bloco_tematico: string
  prioridade: number
  incidencia: number
  q: string
  a: string
  reviews: FlashcardReview[]
  ignored?:  boolean
  mastered?: boolean
}

export type TabName =
  | 'dashboard'
  | 'registrar'
  | 'analise'
  | 'historico'
  | 'flashcards'
  | 'rankcards'
  | 'materias'
  | 'verbos'
  | 'personagem'
