import { useStore } from '@/store'
import { SKILL_FOREST } from '@/lib/skillTreeData'
import { FamilyTree } from './FamilyTree'

// ── SkillTree Export ───────────────────────────────────────────────────────────

export function SkillTree() {
  const sessions = useStore(s => s.sessionStats)

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-text">Árvore de Habilidades</div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {SKILL_FOREST.map(root => (
          <FamilyTree key={root.id} root={root} sessions={sessions} />
        ))}
      </div>
    </div>
  )
}
