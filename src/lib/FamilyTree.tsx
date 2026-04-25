import { useMemo, useState } from 'react'
import type { SessionStat } from '@/types'
import { NodeCard } from './NodeCard'
import { W, H, GAP_X, PAD, subtreeH, placeNode, collectEdges, treeDepth, edgePath, buildStatsMap } from './utils'
import type { TNode, Pos } from './types'

export function FamilyTree({ root, sessions }: { root: TNode; sessions: SessionStat[] }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const { positions, edges, statsMap, canvasW, canvasH } = useMemo(() => {
    const positions = new Map<string, Pos>()
    placeNode(root, 0, PAD, positions)

    // normalize: ensure no y < 0
    const minY = Math.min(...Array.from(positions.values()).map(p => p.y))
    if (minY < 0) {
      for (const [id, pos] of positions) positions.set(id, { ...pos, y: pos.y - minY + PAD })
    }

    const edges = collectEdges(root)
    const statsMap = buildStatsMap(root, sessions)
    const depth = treeDepth(root)
    const canvasW = PAD + (depth + 1) * (W + GAP_X) - GAP_X + PAD
    const canvasH = subtreeH(root) + PAD * 2

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

  const rootStats = statsMap.get(root.id) ?? { count: 0, acc: 0 }
  const rootIcon = root.icon ?? '📚'
  const startedCt = [...statsMap.values()].filter(s => s.count > 0).length
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
              const to = positions.get(e.to)
              if (!from || !to) return null
              const childLocked = lockedIds.has(e.to)
              const childStats = statsMap.get(e.to)
              const active = !childLocked && (childStats?.count ?? 0) > 0
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
            const pos = positions.get(node.id)
            if (!pos) return null
            const stats = statsMap.get(node.id) ?? { count: 0, acc: 0 }
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