import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  gradient?: boolean
}

export function Card({ children, className = '', gradient = false }: Props) {
  const base = gradient
    ? 'bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/25'
    : 'bg-surface border border-border'
  return (
    <div className={`${base} rounded-card p-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2.5">
      {children}
    </div>
  )
}
