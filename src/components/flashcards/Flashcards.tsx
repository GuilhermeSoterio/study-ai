import { useState } from 'react'
import { useStore } from '@/store'
import { dueCount } from '@/lib/srs'
import { FlashcardReview } from './FlashcardReview'
import { FlashcardCreate } from './FlashcardCreate'
import { FlashcardBank } from './FlashcardBank'

type Section = 'review' | 'create' | 'bank'

export function Flashcards() {
  const cards = useStore(s => s.flashcards)
  const [section, setSection] = useState<Section>('review')
  const due = dueCount(cards)

  const tabs: { id: Section; label: string; badge?: number }[] = [
    { id: 'review', label: '🔄 Revisar', badge: due },
    { id: 'create', label: '＋ Criar' },
    { id: 'bank',   label: `📦 Banco (${cards.length})` },
  ]

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className="flex gap-2 border-b border-border pb-3">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-sm text-[13px] font-semibold transition-all ${
              section === tab.id
                ? 'bg-gradient-to-r from-primary to-cyan-600 text-white'
                : 'text-muted hover:bg-surface2 hover:text-text'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                section === tab.id ? 'bg-white/20' : 'bg-warning/20 text-warning'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {section === 'review' && <FlashcardReview />}
      {section === 'create' && <FlashcardCreate />}
      {section === 'bank'   && <FlashcardBank />}
    </div>
  )
}
