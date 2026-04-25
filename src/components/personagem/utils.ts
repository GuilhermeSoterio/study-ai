import type { SessionStat } from '@/types'
import type { TNode, Pos, NodeStats } from './types'

// ── Dimensions ────────────────────────────────────────────────────────────────
export const W = 134 // node width
export const H = 64 // node height
export const GAP_X = 52 // horizontal gap between levels
export const GAP_Y = 12 // vertical gap between siblings
export const PAD = 20 // canvas padding

// ── Layout Algorithm ──────────────────────────────────────────────────────────

/** Total pixel height required to render this subtree */
export function subtreeH(node: TNode): number {
  const ch = node.children ?? []
  if (!ch.length) return H
  return ch.reduce((sum, c) => sum + subtreeH(c) + GAP_Y, -GAP_Y)
}

/** Recursively assign positions. Returns the centerY of this node. */
export function placeNode(
  node: TNode,
  depth: number,
  yTop: number,
  positions: Map<string, Pos>,
): number {
  const x = PAD + depth * (W + GAP_X)
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

export function collectEdges(node: TNode): { from: string; to: string }[] {
  return (node.children ?? []).flatMap(child => [
    { from: node.id, to: child.id },
    ...collectEdges(child),
  ])
}

export function treeDepth(node: TNode): number {
  if (!node.children?.length) return 0
  return 1 + Math.max(...node.children.map(treeDepth))
}

// ── Stats ─────────────────────────────────────────────────────────────────────

// Coleta todos os `mat` do nó e de todos os seus descendentes
function collectSubtreeMats(node: TNode): Set<string> {
  const mats = new Set<string>()
  const walk = (n: TNode) => {
    if (n.mat) mats.add(n.mat)
    n.children?.forEach(walk)
  }
  walk(node)
  return mats
}

function normalize(s: string) { return s.toLowerCase().trim() }

function calcStats(node: TNode, sessions: SessionStat[], subtreeMats: Set<string>): NodeStats {
  const nodeDisc = node.disc ? normalize(node.disc) : null
  const normSubtreeMats = new Set([...subtreeMats].map(normalize))

  const filtered = sessions.filter(s => {
    if (!nodeDisc || normalize(s.disc) !== nodeDisc) return false
    if (!node.mat) return true
    return normSubtreeMats.has(normalize(s.mat))
  })
  const count = filtered.reduce((s, r) => s + r.total, 0)
  const correct = filtered.reduce((s, r) => s + r.correct, 0)
  return { count, acc: count > 0 ? Math.round((correct / count) * 100) : 0 }
}

export function buildStatsMap(root: TNode, sessions: SessionStat[]): Map<string, NodeStats> {
  const map = new Map<string, NodeStats>()
  const walk = (n: TNode) => {
    map.set(n.id, calcStats(n, sessions, collectSubtreeMats(n)))
    n.children?.forEach(walk)
  }
  walk(root)
  return map
}

// ── Bezier edge path ──────────────────────────────────────────────────────────

export function edgePath(from: Pos, to: Pos): string {
  const x1 = from.x + W; const y1 = from.y + H / 2
  const x2 = to.x; const y2 = to.y + H / 2
  const cx = (x2 - x1) * 0.45
  return `M ${x1} ${y1} C ${x1 + cx} ${y1} ${x2 - cx} ${y2} ${x2} ${y2}`
}