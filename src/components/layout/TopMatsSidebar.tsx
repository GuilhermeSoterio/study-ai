import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@/store'
import { supabase } from '@/lib/supabase'

type SortKey = 'volume' | 'taxa'

const MEDAL: Record<number, { icon: string; color: string }> = {
  0: { icon: '🥇', color: '#d4a017' },
  1: { icon: '🥈', color: '#94a3b8' },
  2: { icon: '🥉', color: '#b45309' },
}

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

// ── Top 10 Matérias ───────────────────────────────────────────────────────────

function TopMats() {
  const sessionStats = useStore(s => s.sessionStats)
  const [sort, setSort] = useState<SortKey>('volume')

  const top = useMemo(() => {
    const map = new Map<string, { disc: string; total: number; correct: number }>()
    for (const s of sessionStats) {
      const cur = map.get(s.mat) ?? { disc: s.disc, total: 0, correct: 0 }
      map.set(s.mat, { disc: cur.disc, total: cur.total + s.total, correct: cur.correct + s.correct })
    }
    return [...map.entries()]
      .map(([mat, v]) => ({ mat, disc: v.disc, total: v.total, taxa: pct(v.correct, v.total) }))
      .filter(m => m.total >= 5)
      .sort((a, b) => sort === 'volume' ? b.total - a.total : b.taxa - a.taxa)
      .slice(0, 10)
  }, [sessionStats, sort])

  const maxVal = top.length > 0 ? (sort === 'volume' ? top[0].total : top[0].taxa) : 1

  if (top.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Top 10</span>
        <div className="flex gap-0.5">
          {(['volume', 'taxa'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`text-[9px] font-bold px-2 py-0.5 rounded-sm transition-colors ${
                sort === k
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'text-muted hover:text-text border border-transparent'
              }`}
            >
              {k === 'volume' ? 'Vol.' : 'Taxa'}
            </button>
          ))}
        </div>
      </div>

      {top.map((m, i) => {
        const medal    = MEDAL[i]
        const barPct   = Math.round((sort === 'volume' ? m.total : m.taxa) / maxVal * 100)
        const taxaColor = m.taxa >= 70 ? '#4a7c59' : m.taxa >= 50 ? '#d4a017' : '#c0392b'

        return (
          <div key={m.mat} className="bg-surface border border-border/60 rounded-md px-2.5 py-2 hover:border-border transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="shrink-0 text-[12px] leading-none">
                {medal ? medal.icon : (
                  <span className="text-[9px] font-black text-dim tabular-nums w-4 inline-block text-center">{i + 1}</span>
                )}
              </span>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-text truncate leading-tight">{m.mat}</div>
                <div className="text-[9px] text-muted truncate leading-tight">{m.disc}</div>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="h-1 bg-surface3 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, background: sort === 'taxa' ? taxaColor : '#4a7c59' }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black tabular-nums" style={{ color: sort === 'taxa' ? taxaColor : '#4a7c59' }}>
                  {sort === 'volume' ? `${m.total}q` : `${m.taxa}%`}
                </span>
                <span className="text-[9px] text-muted tabular-nums">
                  {sort === 'volume' ? `${m.taxa}%` : `${m.total}q`}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Ranking de Usuários ───────────────────────────────────────────────────────

interface SidebarRankEntry {
  user_id:         string
  display_name:    string
  avatar_url:      string | null
  total_questions: number
  total_correct:   number
  accuracy:        number
}

function UserRanking() {
  const userId  = useStore(s => s.userId)
  const [entries, setEntries] = useState<SidebarRankEntry[]>([])

  useEffect(() => {
    supabase.rpc('get_ranking').then(({ data }) => {
      if (data) setEntries(data as SidebarRankEntry[])
    })
  }, [userId])

  if (entries.length === 0) return null

  const maxPts = Math.max(...entries.map(u => u.total_questions), 1)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted">Ranking</span>
        <span className="text-[9px] text-dim">questões totais</span>
      </div>

      {entries.map((u, i) => {
        const isMe   = u.user_id === userId
        const medal  = MEDAL[i]
        const barPct = Math.round((u.total_questions / maxPts) * 100)

        return (
          <div
            key={u.user_id}
            className="rounded-md px-2.5 py-2 transition-colors"
            style={{
              background: isMe ? 'rgba(74,124,89,0.08)' : undefined,
              border:     isMe ? '1px solid rgba(74,124,89,0.35)' : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="shrink-0 text-[12px] leading-none w-4 text-center">
                {medal ? medal.icon : (
                  <span className="text-[9px] font-black text-dim tabular-nums">{i + 1}</span>
                )}
              </span>

              <div
                className="relative w-6 h-6 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-[9px] font-black"
                style={{
                  background: isMe ? 'rgba(74,124,89,0.3)' : 'rgba(212,160,23,0.2)',
                  color:      isMe ? '#4a7c59' : '#d4a017',
                  border:     `1px solid ${isMe ? '#4a7c5955' : '#d4a01755'}`,
                }}
              >
                {initials(u.display_name)}
                {u.avatar_url && (
                  <img src={u.avatar_url} alt={u.display_name} className="absolute inset-0 w-full h-full object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className="text-[11px] font-bold leading-tight truncate"
                  style={{ color: isMe ? '#4a7c59' : undefined }}
                >
                  {u.display_name}
                  {isMe && <span className="text-[8px] text-muted font-normal ml-1">você</span>}
                </div>
              </div>

              <span
                className="text-[11px] font-black tabular-nums shrink-0"
                style={{ color: isMe ? '#4a7c59' : '#d4a017' }}
              >
                {u.total_questions.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="h-1 bg-surface3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${barPct}%`,
                  background: isMe ? '#4a7c59' : '#d4a017',
                }}
              />
            </div>

            {u.total_questions > 0 && (
              <div className="flex justify-between text-[9px] text-muted mt-0.5">
                <span>{u.total_questions.toLocaleString('pt-BR')} questões</span>
                <span>{u.accuracy}% acerto</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function TopMatsSidebar() {
  return (
    <div className="space-y-5">
      <TopMats />

      {/* Divisor */}
      <div className="border-t border-border/40" />

      <UserRanking />
    </div>
  )
}
