import { useStore } from '@/store'
import { FamilyTree } from './FamilyTree'
import type { TNode } from './types'
import type { CharacterData, SessionStat } from '@/types'

// XP mínimo por nível — espelha o backend
const LEVEL_MIN: Record<number, number> = {
  1: 0, 2: 100, 3: 300, 4: 600, 5: 1000,
  6: 1500, 7: 2500, 8: 4000, 9: 6000, 10: 10000,
}

function levelPct(xp: number, level: number, xpNextLevel: number): number {
  const min = LEVEL_MIN[level] ?? 0
  const span = xpNextLevel - min
  if (span <= 0) return 100
  return Math.min(100, Math.round(((xp - min) / span) * 100))
}

// ── Character Panel ───────────────────────────────────────────────────────────

function CharacterPanel({ char }: { char: CharacterData }) {
  const pct = levelPct(char.xp, char.level, char.xp_next_level)
  const xpIn = char.xp - (LEVEL_MIN[char.level] ?? 0)
  const xpSpan = char.xp_next_level - (LEVEL_MIN[char.level] ?? 0)

  return (
    <div className="bg-surface border border-border rounded-card p-6 flex flex-col sm:flex-row gap-6 items-center sm:items-start">
      <div className="relative shrink-0">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/30 flex items-center justify-center text-5xl select-none">
          {char.level_emoji}
        </div>
        <div className="absolute -bottom-2 -right-2 text-[11px] font-black px-2 py-0.5 rounded-full bg-surface border border-border text-primary">
          Lv {char.level}
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-3 text-center sm:text-left">
        <div>
          <div className="text-xl font-black text-primary">{char.level_title}</div>
          <div className="text-sm text-muted mt-0.5">
            {xpIn} / {xpSpan} XP para o próximo nível
          </div>
        </div>

        <div className="bg-surface3 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { label: 'Questões', value: char.stats.total_questions.toLocaleString('pt-BR') },
            { label: 'Acertos',  value: `${char.stats.accuracy.toFixed(0)}%` },
            { label: 'Streak',   value: `${char.stats.streak}d 🔥` },
            { label: 'Recorde',  value: `${char.stats.best_streak}d ⭐` },
          ].map(s => (
            <div key={s.label} className="bg-surface2 rounded-card p-2.5 text-center">
              <div className="text-[11px] text-muted uppercase tracking-wider">{s.label}</div>
              <div className="text-base font-bold text-text mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Conquistas ────────────────────────────────────────────────────────────────

function Achievements({ achievements }: { achievements: CharacterData['achievements'] }) {
  const earned = achievements.filter(a => a.unlocked)
  const locked = achievements.filter(a => !a.unlocked)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold text-text">Conquistas</div>
        <div className="text-[12px] text-muted">
          <span className="text-warning font-bold">{earned.length}</span>/{achievements.length} obtidas
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {[...earned, ...locked].map(a => (
          <div
            key={a.id}
            className={`rounded-card border p-3 flex items-start gap-2.5 transition-all ${
              a.unlocked
                ? 'bg-warning/10 border-warning/30'
                : 'bg-surface2 border-border opacity-40'
            }`}
          >
            <div className="min-w-0">
              <div className={`text-[12px] font-bold leading-tight ${a.unlocked ? 'text-warning' : 'text-muted'}`}>
                {a.label}
              </div>
              <div className="text-[10px] text-dim leading-tight mt-0.5">{a.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Skill Tree V2 ─────────────────────────────────────────────────────────────

function SkillTreeV2({ roots, sessions }: { roots: TNode[]; sessions: SessionStat[] }) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-text">Árvore de Habilidades</div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {roots.map(root => (
          <FamilyTree key={root.id} root={root} sessions={sessions} />
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function PersonagemV2() {
  // Fix #1 — lê do store, sem fetch local. Dados carregados uma vez no loadAll.
  const char     = useStore(s => s.character)
  const roots    = useStore(s => s.skillTree)
  const sessions = useStore(s => s.sessionStats)
  const loading  = useStore(s => s.loading)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted text-sm gap-2">
        <span className="animate-spin">⏳</span> Carregando personagem...
      </div>
    )
  }

  if (!char) {
    return (
      <div className="flex items-center justify-center h-64 text-muted text-sm gap-2">
        ⚠️ Dados do personagem não disponíveis.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-[11px] text-muted bg-surface2 border border-border rounded-card px-3 py-2">
        <span className="text-accent font-bold">v2</span>
        Dados consumidos do backend Go — <span className="font-mono">localhost:8080</span>
      </div>
      <CharacterPanel char={char} />
      <Achievements achievements={char.achievements} />
      <SkillTreeV2 roots={roots} sessions={sessions} />
    </div>
  )
}
