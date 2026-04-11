import type { FlashcardReview } from '@/types'

// Intervalos base por rating (em dias)
const INTERVALS: Record<1 | 2 | 3, number> = { 1: 1, 2: 3, 3: 7 }

export function calcNextDue(reviews: FlashcardReview[], rating: 1 | 2 | 3): number {
  const r = reviews ?? []
  const factor = Math.max(1, r.length * 0.5 + 1)
  const days = Math.round(INTERVALS[rating] * factor)
  return Date.now() + days * 86_400_000
}

export function isDue(reviews: FlashcardReview[] | null | undefined): boolean {
  const r = reviews ?? []
  if (!r.length) return true
  return r[r.length - 1].nextDue <= Date.now()
}

export function dueCount(cards: { reviews: FlashcardReview[] | null | undefined }[]): number {
  return cards.filter(c => isDue(c.reviews)).length
}
