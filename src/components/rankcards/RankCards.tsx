import { useState } from 'react'
import { useStore } from '@/store'
import { dueCount } from '@/lib/srs'
import { RankCardReview } from './RankCardReview'
import { RankCardCreate } from './RankCardCreate'
import { RankCardBank } from './RankCardBank'
import { RankCardImport } from './RankCardImport'

type Section = 'review' | 'create' | 'bank' | 'import'

export function RankCards() {
  const cards = useStore(s => s.rankCards)
  const [section, setSection] = useState<Section>('create')
  const active = cards.filter(c => !c.ignored)
  const due = dueCount(active)

  const tabs: { id: Section; label: string; badge?: number }[] = [
    { id: 'review', label: '🔄 Revisar', badge: due },
    { id: 'create', label: '＋ Criar' },
    { id: 'bank',   label: `🏅 Banco (${cards.length})` },
    { id: 'import', label: '📥 Importar' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div>
          <h2 className="text-base font-bold text-text">EloCards</h2>
          <p className="text-[11px] text-muted">Cards de alta incidência ranqueados por frequência em provas</p>
        </div>
      </div>

      {/* Sub-nav */}
      <div className="flex gap-2 border-b border-border pb-3 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSection(tab.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-sm text-[13px] font-semibold transition-all ${
              section === tab.id
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
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

      {section === 'review' && <RankCardReview />}
      {section === 'create' && <RankCardCreate />}
      {section === 'bank'   && <RankCardBank />}
      {section === 'import' && <RankCardImport onViewBank={() => setSection('bank')} />}
    </div>
  )
}
