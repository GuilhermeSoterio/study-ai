import type { TNode, NodeStats } from './types'
import { W, H } from './utils'

interface NodeCardProps {
  node: TNode
  stats: NodeStats
  locked: boolean
  rootIcon: string
  hovered: boolean
  onHover: (id: string | null) => void
}

export function NodeCard({ node, stats, locked, rootIcon, hovered, onHover }: NodeCardProps) {
  const isRoot = !node.mat
  const started = stats.count > 0
  const highAcc = started && stats.acc >= 75

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