import { useMemo } from 'react'
import { useStore } from '@/store'
import { FamilyTree } from './FamilyTree'
import type { TNode } from './types'

function slug(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
}

function discToForest(disc: Record<string, string[]>): TNode[] {
  return Object.entries(disc).map(([discName, mats]) => ({
    id: `disc-${slug(discName)}`,
    label: discName,
    disc: discName,
    icon: '📚',
    children: mats.map(mat => ({
      id: `mat-${slug(discName)}-${slug(mat)}`,
      label: mat,
      disc: discName,
      mat,
    })),
  }))
}

export function SkillTree() {
  const sessions = useStore(s => s.sessionStats)
  const disc     = useStore(s => s.disc)

  const forest = useMemo(() => discToForest(disc), [disc])

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-text">Árvore de Habilidades</div>
      {forest.length === 0 && (
        <p className="text-[12px] text-muted">
          Nenhuma disciplina configurada. Adicione matérias na aba <strong>Matérias em Evolução</strong>.
        </p>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {forest.map(root => (
          <FamilyTree key={root.id} root={root} sessions={sessions} />
        ))}
      </div>
    </div>
  )
}
