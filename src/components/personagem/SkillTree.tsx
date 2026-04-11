import { useMemo, useState } from 'react'
import { useStore } from '@/store'
import type { SessionStat } from '@/types'

// ── Dimensions ────────────────────────────────────────────────────────────────
const W     = 134   // node width
const H     = 64    // node height
const GAP_X = 52    // horizontal gap between levels
const GAP_Y = 12    // vertical gap between siblings
const PAD   = 20    // canvas padding

// ── Tree Data ─────────────────────────────────────────────────────────────────
interface TNode {
  id:       string
  label:    string
  disc?:    string     // matches session.disc
  mat?:     string     // matches session.mat (absent = disc root)
  icon?:    string     // display icon/text
  children?: TNode[]
}

const SKILL_FOREST: TNode[] = [
  {
    id: 'fonetica', label: 'Fonética', disc: 'Fonética', icon: 'Aα',
    children: [
      { id: 'fonologia',  label: 'Fonologia',  disc: 'Fonética', mat: 'Fonologia' },
      { id: 'ortografia', label: 'Ortografia', disc: 'Fonética', mat: 'Ortografia' },
      { id: 'acentuacao', label: 'Acentuação', disc: 'Fonética', mat: 'Acentuação' },
    ],
  },
  {
    id: 'morfologia', label: 'Morfologia', disc: 'Morfologia', icon: '⚔️',
    children: [
      { id: 'estrutura-pal', label: 'Estrutura das Palavras', disc: 'Morfologia', mat: 'Estrutura das Palavras' },
      {
        id: 'classes-morf', label: 'Classes Morfológicas', disc: 'Morfologia', mat: 'Classes Morfológicas',
        children: [
          { id: 'substantivo', label: 'Substantivo',  disc: 'Morfologia', mat: 'Substantivo' },
          { id: 'adjetivo',    label: 'Adjetivo',     disc: 'Morfologia', mat: 'Adjetivo' },
          {
            id: 'verbo', label: 'Verbo', disc: 'Morfologia', mat: 'Verbo',
            children: [
              { id: 'tempos-modos', label: 'Tempos e Modos Verbais', disc: 'Morfologia', mat: 'Tempos e Modos Verbais' },
            ],
          },
          { id: 'artigo',      label: 'Artigo',       disc: 'Morfologia', mat: 'Artigo' },
          {
            id: 'pronome', label: 'Pronome', disc: 'Morfologia', mat: 'Pronome',
            children: [
              { id: 'colocacao-pron', label: 'Colocação Pronominal', disc: 'Morfologia', mat: 'Colocação Pronominal' },
            ],
          },
          { id: 'adverbio',    label: 'Advérbio',     disc: 'Morfologia', mat: 'Advérbio' },
          { id: 'preposicao',  label: 'Preposição',   disc: 'Morfologia', mat: 'Preposição' },
          { id: 'conjuncao',   label: 'Conjunção',    disc: 'Morfologia', mat: 'Conjunção' },
          { id: 'numeral',     label: 'Numeral',      disc: 'Morfologia', mat: 'Numeral' },
          { id: 'interjeicao', label: 'Interjeição',  disc: 'Morfologia', mat: 'Interjeição' },
        ],
      },
    ],
  },
  {
    id: 'sintaxe', label: 'Sintaxe', disc: 'Sintaxe', icon: '🔗',
    children: [
      { id: 'termos-oracao', label: 'Termos da Oração',      disc: 'Sintaxe', mat: 'Termos da Oração' },
      {
        id: 'coord', label: 'Coordenação', disc: 'Sintaxe', mat: 'Coordenação',
        children: [
          {
            id: 'subord', label: 'Subordinação', disc: 'Sintaxe', mat: 'Subordinação',
            children: [
              { id: 'periodo-comp', label: 'Período Composto', disc: 'Sintaxe', mat: 'Período Composto' },
            ],
          },
        ],
      },
      { id: 'conc-verbal',  label: 'Concordância Verbal',  disc: 'Sintaxe', mat: 'Concordância Verbal' },
      { id: 'conc-nominal', label: 'Concordância Nominal', disc: 'Sintaxe', mat: 'Concordância Nominal' },
      { id: 'reg-verbal',   label: 'Regência Verbal',      disc: 'Sintaxe', mat: 'Regência Verbal' },
      { id: 'reg-nominal',  label: 'Regência Nominal',     disc: 'Sintaxe', mat: 'Regência Nominal' },
      { id: 'crase',        label: 'Crase',                disc: 'Sintaxe', mat: 'Crase' },
      { id: 'pontuacao',    label: 'Pontuação',            disc: 'Sintaxe', mat: 'Pontuação' },
    ],
  },
  {
    id: 'estilistica', label: 'Estilística', disc: 'Estilística', icon: '✍️',
    children: [
      {
        id: 'semantica', label: 'Semântica', disc: 'Estilística', mat: 'Semântica',
        children: [
          { id: 'sinonimos',    label: 'Sinônimos',               disc: 'Estilística', mat: 'Sinônimos' },
          { id: 'significacao', label: 'Significação das Palavras', disc: 'Estilística', mat: 'Significação das Palavras' },
        ],
      },
      { id: 'figuras', label: 'Figuras de Linguagem', disc: 'Estilística', mat: 'Figuras de Linguagem' },
      {
        id: 'conectivos', label: 'Conectivos', disc: 'Estilística', mat: 'Conectivos',
        children: [
          { id: 'troca-conect', label: 'Troca de Conectivos', disc: 'Estilística', mat: 'Troca de Conectivos' },
          { id: 'conectores',   label: 'Conectores de Coesão', disc: 'Estilística', mat: 'Conectores de Coesão' },
        ],
      },
      {
        id: 'mec-coesao', label: 'Mecanismos de Coesão', disc: 'Estilística', mat: 'Mecanismos de Coesão',
        children: [
          { id: 'referenciacao', label: 'Referenciação e Substituição', disc: 'Estilística', mat: 'Referenciação e Substituição' },
        ],
      },
    ],
  },
  {
    id: 'interpretacao', label: 'Interpretação de Texto', disc: 'Interpretação de Texto', icon: '📖',
    children: [
      { id: 'interp-txt',  label: 'Interpretação de Texto', disc: 'Interpretação de Texto', mat: 'Interpretação de Texto' },
      { id: 'tipologia',   label: 'Tipologia Textual',      disc: 'Interpretação de Texto', mat: 'Tipologia Textual' },
      {
        id: 'generos-txt', label: 'Gêneros Textuais', disc: 'Interpretação de Texto', mat: 'Gêneros Textuais',
        children: [
          { id: 'reescrita-gen', label: 'Reescrita de Gêneros', disc: 'Interpretação de Texto', mat: 'Reescrita de Gêneros' },
        ],
      },
      { id: 'coesao-coer', label: 'Coesão e Coerência', disc: 'Interpretação de Texto', mat: 'Coesão e Coerência' },
      {
        id: 'reescrita', label: 'Reescrita e Equivalência', disc: 'Interpretação de Texto', mat: 'Reescrita e Equivalência',
        children: [
          { id: 'subst-reorg', label: 'Substituição e Reorganização', disc: 'Interpretação de Texto', mat: 'Substituição e Reorganização' },
        ],
      },
      {
        id: 'redacao-of', label: 'Redação Oficial', disc: 'Interpretação de Texto', mat: 'Redação Oficial',
        children: [
          { id: 'manual-tcdf', label: 'Manual Redação TCDF', disc: 'Interpretação de Texto', mat: 'Manual de Redação TCDF' },
        ],
      },
    ],
  },
  {
    id: 'ti', label: 'Tecnologia da Informação', disc: 'Tecnologia da Informação', icon: '💻',
    children: [
      {
        id: 'bd', label: 'Banco de Dados', disc: 'Tecnologia da Informação', mat: 'Banco de Dados',
        children: [{ id: 'sql', label: 'SQL', disc: 'Tecnologia da Informação', mat: 'SQL' }],
      },
      {
        id: 'redes', label: 'Redes de Computadores', disc: 'Tecnologia da Informação', mat: 'Redes de Computadores',
        children: [{ id: 'seg-info', label: 'Segurança da Informação', disc: 'Tecnologia da Informação', mat: 'Segurança da Informação' }],
      },
      {
        id: 'eng-soft', label: 'Engenharia de Software', disc: 'Tecnologia da Informação', mat: 'Engenharia de Software',
        children: [{ id: 'dev-soft', label: 'Desenvolvimento de Software', disc: 'Tecnologia da Informação', mat: 'Desenvolvimento de Software' }],
      },
      {
        id: 'so', label: 'Sistemas Operacionais', disc: 'Tecnologia da Informação', mat: 'Sistemas Operacionais',
        children: [{ id: 'arq-comp', label: 'Arquitetura de Computadores', disc: 'Tecnologia da Informação', mat: 'Arquitetura de Computadores' }],
      },
      {
        id: 'gov-ti', label: 'Governança de TI', disc: 'Tecnologia da Informação', mat: 'Governança de TI',
        children: [{ id: 'itil', label: 'ITIL / COBIT', disc: 'Tecnologia da Informação', mat: 'ITIL / COBIT' }],
      },
    ],
  },
  {
    id: 'logica', label: 'Raciocínio Lógico', disc: 'Raciocínio Lógico', icon: '🧠',
    children: [
      {
        id: 'logica-prop', label: 'Lógica Proposicional', disc: 'Raciocínio Lógico', mat: 'Lógica Proposicional',
        children: [{ id: 'logica-arg', label: 'Lógica de Argumentação', disc: 'Raciocínio Lógico', mat: 'Lógica de Argumentação' }],
      },
      {
        id: 'rac-quant', label: 'Raciocínio Quantitativo', disc: 'Raciocínio Lógico', mat: 'Raciocínio Quantitativo',
        children: [
          { id: 'seq-pad', label: 'Sequências e Padrões',       disc: 'Raciocínio Lógico', mat: 'Sequências e Padrões' },
          { id: 'comb',    label: 'Análise Combinatória',        disc: 'Raciocínio Lógico', mat: 'Análise Combinatória' },
          { id: 'prob',    label: 'Probabilidade e Estatística', disc: 'Raciocínio Lógico', mat: 'Probabilidade e Estatística' },
        ],
      },
    ],
  },
  {
    id: 'dir-const', label: 'Direito Constitucional', disc: 'Direito Constitucional', icon: '⚖️',
    children: [
      { id: 'princ-fund', label: 'Princípios Fundamentais', disc: 'Direito Constitucional', mat: 'Princípios Fundamentais' },
      { id: 'dir-gar',    label: 'Direitos e Garantias',    disc: 'Direito Constitucional', mat: 'Direitos e Garantias' },
      {
        id: 'org-estado', label: 'Organização do Estado', disc: 'Direito Constitucional', mat: 'Organização do Estado',
        children: [
          { id: 'poder-jud',     label: 'Poder Judiciário',               disc: 'Direito Constitucional', mat: 'Poder Judiciário' },
          { id: 'ctrl-const',    label: 'Controle de Constitucionalidade', disc: 'Direito Constitucional', mat: 'Controle de Constitucionalidade' },
        ],
      },
    ],
  },
  {
    id: 'dir-adm', label: 'Direito Administrativo', disc: 'Direito Administrativo', icon: '📋',
    children: [
      { id: 'princ-adm',  label: 'Princípios da Administração',    disc: 'Direito Administrativo', mat: 'Princípios da Administração' },
      { id: 'atos-adm',   label: 'Atos Administrativos',           disc: 'Direito Administrativo', mat: 'Atos Administrativos' },
      { id: 'licit',      label: 'Licitações e Contratos',         disc: 'Direito Administrativo', mat: 'Licitações e Contratos' },
      { id: 'agentes',    label: 'Agentes Públicos',               disc: 'Direito Administrativo', mat: 'Agentes Públicos' },
      { id: 'ctrl-adm',   label: 'Controle da Administração',      disc: 'Direito Administrativo', mat: 'Controle da Administração' },
      { id: 'resp-civil', label: 'Responsabilidade Civil do Estado', disc: 'Direito Administrativo', mat: 'Responsabilidade Civil do Estado' },
    ],
  },
]

// ── Layout Algorithm ──────────────────────────────────────────────────────────

interface Pos { x: number; y: number }

/** Total pixel height required to render this subtree */
function subtreeH(node: TNode): number {
  const ch = node.children ?? []
  if (!ch.length) return H
  return ch.reduce((sum, c) => sum + subtreeH(c) + GAP_Y, -GAP_Y)
}

/** Recursively assign positions. Returns the centerY of this node. */
function placeNode(
  node:      TNode,
  depth:     number,
  yTop:      number,
  positions: Map<string, Pos>,
): number {
  const x        = PAD + depth * (W + GAP_X)
  const children = node.children ?? []

  if (!children.length) {
    positions.set(node.id, { x, y: yTop })
    return yTop + H / 2
  }

  const childCenters: number[] = []
  let y = yTop
  for (const child of children) {
    childCenters.push(placeNode(child, depth + 1, y, positions))
    y += subtreeH(child) + GAP_Y
  }

  const myCenterY = (childCenters[0] + childCenters[childCenters.length - 1]) / 2
  positions.set(node.id, { x, y: myCenterY - H / 2 })
  return myCenterY
}

function collectEdges(node: TNode): { from: string; to: string }[] {
  return (node.children ?? []).flatMap(child => [
    { from: node.id, to: child.id },
    ...collectEdges(child),
  ])
}

function treeDepth(node: TNode): number {
  if (!node.children?.length) return 0
  return 1 + Math.max(...node.children.map(treeDepth))
}

// ── Stats ─────────────────────────────────────────────────────────────────────

interface NodeStats { count: number; acc: number }

function calcStats(node: TNode, sessions: SessionStat[]): NodeStats {
  const filtered = sessions.filter(s => {
    if (!node.disc || s.disc !== node.disc) return false
    if (node.mat) return s.mat === node.mat
    return true
  })
  const count   = filtered.reduce((s, r) => s + r.total, 0)
  const correct = filtered.reduce((s, r) => s + r.correct, 0)
  return { count, acc: count > 0 ? Math.round((correct / count) * 100) : 0 }
}

function buildStatsMap(root: TNode, sessions: SessionStat[]): Map<string, NodeStats> {
  const map = new Map<string, NodeStats>()
  const walk = (n: TNode) => {
    map.set(n.id, calcStats(n, sessions))
    n.children?.forEach(walk)
  }
  walk(root)
  return map
}

// ── Bezier edge path ──────────────────────────────────────────────────────────

function edgePath(from: Pos, to: Pos): string {
  const x1 = from.x + W,    y1 = from.y + H / 2
  const x2 = to.x,           y2 = to.y  + H / 2
  const cx = (x2 - x1) * 0.45
  return `M ${x1} ${y1} C ${x1 + cx} ${y1} ${x2 - cx} ${y2} ${x2} ${y2}`
}

// ── Node Card ─────────────────────────────────────────────────────────────────

interface NodeCardProps {
  node:     TNode
  stats:    NodeStats
  locked:   boolean
  rootIcon: string
  hovered:  boolean
  onHover:  (id: string | null) => void
}

function NodeCard({ node, stats, locked, rootIcon, hovered, onHover }: NodeCardProps) {
  const isRoot    = !node.mat
  const started   = stats.count > 0
  const highAcc   = started && stats.acc >= 75

  // Visual state
  const cardCls = locked
    ? 'border-border/40 bg-surface opacity-55'
    : highAcc
      ? 'border-success/50 bg-success/10'
      : started
        ? 'border-primary/50 bg-primary/10'
        : isRoot
          ? 'border-accent/40 bg-accent/10'
          : 'border-border bg-surface2'

  const icon = locked ? '🔒' : !started ? (isRoot ? rootIcon : '💤') : isRoot ? rootIcon : '⚡'

  const statusText = locked
    ? 'Bloqueado'
    : !started
      ? 'Não iniciado'
      : `${stats.acc}% acerto`

  const statusColor = locked
    ? 'text-dim'
    : !started
      ? 'text-muted'
      : highAcc
        ? 'text-success'
        : 'text-warning'

  return (
    <div
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      className={`absolute rounded-[10px] border cursor-default select-none transition-all duration-200
        ${cardCls}
        ${hovered && !locked ? 'scale-[1.04] shadow-lg shadow-black/40 z-20' : 'z-10'}
      `}
      style={{ left: 0, top: 0, width: W, height: H }}
    >
      {/* inner layout */}
      <div className="flex flex-col h-full px-2.5 py-1.5 gap-0.5">
        {/* row 1: icon + count */}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none
            ${isRoot
              ? 'bg-accent/20 text-accent border border-accent/30'
              : locked
                ? 'bg-surface3 text-dim border border-border/30'
                : started
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-surface3 text-muted border border-border/30'
            }`}
          >
            {icon}
          </span>
          {stats.count > 0 && (
            <span className={`text-[10px] font-black tabular-nums px-1.5 rounded-full border
              ${highAcc ? 'bg-success/20 border-success/40 text-success' : 'bg-primary/20 border-primary/40 text-primary'}
            `}>
              {stats.count}
            </span>
          )}
        </div>

        {/* row 2: name */}
        <div className={`text-[11px] font-semibold leading-tight line-clamp-2 flex-1
          ${locked ? 'text-dim' : isRoot ? 'text-accent font-bold' : 'text-text'}
        `}>
          {node.label}
        </div>

        {/* row 3: status */}
        <div className={`text-[10px] leading-none ${statusColor}`}>
          {locked && <span className="mr-0.5">🔒</span>}
          {statusText}
        </div>
      </div>

      {/* progress bar */}
      {started && (
        <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-[10px] bg-surface3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${highAcc ? 'bg-success' : 'bg-primary'}`}
            style={{ width: `${stats.acc}%` }}
          />
        </div>
      )}
    </div>
  )
}

// ── Family Tree (one disc group) ──────────────────────────────────────────────

function FamilyTree({ root, sessions }: { root: TNode; sessions: SessionStat[] }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const { positions, edges, statsMap, canvasW, canvasH } = useMemo(() => {
    const positions = new Map<string, Pos>()
    placeNode(root, 0, PAD, positions)

    // normalize: ensure no y < 0
    const minY = Math.min(...Array.from(positions.values()).map(p => p.y))
    if (minY < 0) {
      for (const [id, pos] of positions) positions.set(id, { ...pos, y: pos.y - minY + PAD })
    }

    const edges    = collectEdges(root)
    const statsMap = buildStatsMap(root, sessions)
    const depth    = treeDepth(root)
    const canvasW  = PAD + (depth + 1) * (W + GAP_X) - GAP_X + PAD
    const canvasH  = subtreeH(root) + PAD * 2

    return { positions, edges, statsMap, canvasW, canvasH }
  }, [root, sessions])

  // Gather all nodes flat for rendering
  const allNodes = useMemo(() => {
    const list: TNode[] = []
    const walk = (n: TNode) => {
      list.push(n)
      n.children?.forEach(c => walk(c))
    }
    walk(root)
    return list
  }, [root])

  // Gather locked nodes: locked if direct parent has count = 0
  const lockedIds = useMemo(() => {
    const locked = new Set<string>()
    const walk = (n: TNode, parentId: string | null) => {
      if (parentId !== null) {
        const parentStats = statsMap.get(parentId)
        if ((parentStats?.count ?? 0) === 0) locked.add(n.id)
      }
      n.children?.forEach(c => walk(c, n.id))
    }
    walk(root, null)
    return locked
  }, [root, statsMap])

  const rootStats  = statsMap.get(root.id) ?? { count: 0, acc: 0 }
  const rootIcon   = root.icon ?? '📚'
  const startedCt  = [...statsMap.values()].filter(s => s.count > 0).length
  const totalNodes = allNodes.length

  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface2">
        <div className="flex items-center gap-2">
          <span className="text-base">{rootIcon}</span>
          <span className="text-[13px] font-bold text-text">{root.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted">
            <span className={rootStats.count > 0 ? 'text-primary font-bold' : ''}>{startedCt}</span>
            /{totalNodes} nós
          </span>
          {rootStats.count > 0 && (
            <span className="text-[11px] text-success font-bold">{rootStats.acc}% acerto</span>
          )}
        </div>
      </div>

      {/* Scrollable canvas */}
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 420 }}>
        <div className="relative" style={{ width: canvasW, height: canvasH }}>
          {/* SVG edges */}
          <svg
            className="absolute inset-0 pointer-events-none"
            width={canvasW}
            height={canvasH}
          >
            {edges.map(e => {
              const from = positions.get(e.from)
              const to   = positions.get(e.to)
              if (!from || !to) return null
              const childLocked = lockedIds.has(e.to)
              const childStats  = statsMap.get(e.to)
              const active      = !childLocked && (childStats?.count ?? 0) > 0
              return (
                <path
                  key={`${e.from}-${e.to}`}
                  d={edgePath(from, to)}
                  fill="none"
                  stroke={active ? 'rgba(124,58,237,0.55)' : 'rgba(40,40,63,0.9)'}
                  strokeWidth={active ? 1.5 : 1}
                  strokeDasharray={childLocked ? '4 3' : undefined}
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {allNodes.map(node => {
            const pos   = positions.get(node.id)
            if (!pos) return null
            const stats  = statsMap.get(node.id) ?? { count: 0, acc: 0 }
            const locked = lockedIds.has(node.id)
            return (
              <div
                key={node.id}
                style={{ position: 'absolute', left: pos.x, top: pos.y, width: W, height: H }}
              >
                <NodeCard
                  node={node}
                  stats={stats}
                  locked={locked}
                  rootIcon={rootIcon}
                  hovered={hovered === node.id}
                  onHover={setHovered}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

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
