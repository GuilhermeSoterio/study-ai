import { useRef, useEffect, useState } from 'react'
import type { TNode, NodeStats } from '@/lib/types'
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
  const cardRef = useRef<HTMLDivElement>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0, above: true })

  useEffect(() => {
    if (hovered && cardRef.current) {
      const r = cardRef.current.getBoundingClientRect()
      const above = r.top > 60
      setTooltipPos({
        x: r.left + r.width / 2,
        y: above ? r.top - 8 : r.bottom + 8,
        above,
      })
    }
  }, [hovered])

  const isRoot  = !node.mat
  const started = stats.count > 0
  const highAcc = started && stats.acc >= 75

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

  const countColor = locked
    ? 'text-dim'
    : stats.count === 0
      ? 'text-muted/50'
      : stats.count >= 500
        ? 'text-yellow-400'
        : stats.count >= 100
          ? 'text-success'
          : 'text-primary'

  const countBg = locked
    ? ''
    : stats.count >= 500
      ? 'bg-yellow-400/10 border border-yellow-400/30'
      : stats.count >= 100
        ? 'bg-success/10 border border-success/30'
        : stats.count > 0
          ? 'bg-primary/10 border border-primary/20'
          : ''

  return (
    <>
      {/* Card — tem scale no hover, por isso o tooltip fica FORA deste div */}
      <div
        ref={cardRef}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        className={`absolute rounded-[10px] border cursor-default select-none transition-all duration-200
          ${cardCls}
          ${hovered && !locked ? 'scale-[1.04] shadow-lg shadow-black/40 z-20' : 'z-10'}
        `}
        style={{ left: 0, top: 0, width: W, height: H }}
      >
        <div className="flex flex-col h-full px-2.5 py-1.5 gap-0.5">
          {/* row 1: icon + label */}
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none shrink-0
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
            <span className={`text-[11px] font-semibold leading-tight line-clamp-1 flex-1 min-w-0
              ${locked ? 'text-dim' : isRoot ? 'text-accent font-bold' : 'text-text'}
            `}>
              {node.label}
            </span>
          </div>

          {/* row 2: contador de questões + accuracy */}
          <div className="flex items-center justify-between gap-1 flex-1">
            <span className={`text-[12px] font-black tabular-nums leading-none rounded-md px-1.5 py-0.5 ${countColor} ${countBg}`}>
              {stats.count > 0
                ? stats.count >= 1000
                  ? `${(stats.count / 1000).toFixed(1)}k`
                  : stats.count
                : '—'
              }
              <span className="text-[8px] font-semibold ml-0.5 opacity-70">Q</span>
            </span>

            {started && (
              <span className={`text-[10px] font-bold leading-none
                ${highAcc ? 'text-success' : 'text-warning'}
              `}>
                {stats.acc}%
              </span>
            )}
          </div>
        </div>

        {/* barra de progresso de acerto */}
        {started && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-[10px] bg-surface3 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${highAcc ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${stats.acc}%` }}
            />
          </div>
        )}

        {/* glow sutil para nós com muitas questões */}
        {stats.count >= 100 && !locked && (
          <div className={`absolute inset-0 rounded-[10px] pointer-events-none
            ${stats.count >= 500
              ? 'shadow-[0_0_8px_rgba(250,204,21,0.15)]'
              : 'shadow-[0_0_6px_rgba(34,197,94,0.12)]'
            }`}
          />
        )}
      </div>

      {/* Tooltip — fora do div escalado para position:fixed funcionar corretamente */}
      {hovered && (
        <div
          className="pointer-events-none whitespace-nowrap"
          style={{
            position: 'fixed',
            zIndex: 9999,
            left: tooltipPos.x,
            top: tooltipPos.above ? tooltipPos.y : tooltipPos.y,
            transform: tooltipPos.above ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          }}
        >
          {tooltipPos.above ? (
            <>
              <div className="bg-surface border border-border rounded-md px-2.5 py-1 text-[11px] font-semibold text-text shadow-lg shadow-black/50">
                {node.label}
              </div>
              <div className="w-2 h-2 bg-surface border-b border-r border-border rotate-45 mx-auto -mt-[5px]" />
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-surface border-t border-l border-border rotate-45 mx-auto mb-[-5px]" />
              <div className="bg-surface border border-border rounded-md px-2.5 py-1 text-[11px] font-semibold text-text shadow-lg shadow-black/50">
                {node.label}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
