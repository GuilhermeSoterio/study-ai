import { useState } from 'react'
import { useMedals, useEliteDays, calcEliteStreak, MEDAL_DEFS, type MatMedal } from '@/hooks/useMedals'

// ── Elite Force Summary ───────────────────────────────────────────────────────

function EliteSummary() {
  const [minQ,   setMinQ]   = useState(10)
  const [minTaxa, setMinTaxa] = useState(80)
  const [showCfg, setShowCfg] = useState(false)

  const days   = useEliteDays(minTaxa, minQ)
  const streak = calcEliteStreak(days)
  const best   = days.reduce((b, d) => d.taxa > b ? d.taxa : b, 0)

  return (
    <div
      className="rounded-card p-4 space-y-3"
      style={{
        background: 'rgba(212,160,23,0.06)',
        border: '1.5px solid rgba(212,160,23,0.35)',
        borderLeft: '4px solid #d4a017',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black tracking-widest text-amber-600 uppercase">
            ⚡ Força de Elite
          </span>
          <span className="text-[10px] text-muted">
            ≥ {minTaxa}% acerto AND ≥ {minQ}q/dia
          </span>
        </div>
        <button
          onClick={() => setShowCfg(v => !v)}
          className="text-[10px] text-muted hover:text-text transition-colors"
        >
          ⚙
        </button>
      </div>

      {showCfg && (
        <div className="flex items-center gap-3 text-[10px] text-muted flex-wrap">
          <label className="flex items-center gap-1">
            acerto ≥
            <input
              type="number" min={50} max={99} value={minTaxa}
              onChange={e => setMinTaxa(Number(e.target.value) || 80)}
              className="w-10 text-center bg-surface2 border border-border rounded px-1 py-0.5 text-[10px] text-text outline-none focus:border-primary"
            />
            %
          </label>
          <label className="flex items-center gap-1">
            mín.
            <input
              type="number" min={1} max={200} value={minQ}
              onChange={e => setMinQ(Number(e.target.value) || 10)}
              className="w-12 text-center bg-surface2 border border-border rounded px-1 py-0.5 text-[10px] text-text outline-none focus:border-primary"
            />
            q/dia
          </label>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="text-[22px] font-black tabular-nums" style={{ color: '#d4a017' }}>
            {days.length}
          </div>
          <div className="text-[10px] text-muted mt-0.5">dias de elite</div>
        </div>
        <div className="text-center">
          <div className="text-[22px] font-black tabular-nums" style={{ color: '#d4a017' }}>
            {streak}
          </div>
          <div className="text-[10px] text-muted mt-0.5">streak atual</div>
        </div>
        <div className="text-center">
          <div className="text-[22px] font-black tabular-nums" style={{ color: '#d4a017' }}>
            {best > 0 ? `${best}%` : '—'}
          </div>
          <div className="text-[10px] text-muted mt-0.5">melhor taxa</div>
        </div>
      </div>

      {days.length === 0 ? (
        <div className="text-[11px] text-muted text-center py-1">
          Nenhum dia de elite ainda — bata {minTaxa}%+ com ≥{minQ}q em um dia.
        </div>
      ) : (
        <div className="flex flex-wrap gap-1 pt-1">
          {days.slice(-30).map(d => (
            <div
              key={d.date}
              title={`${d.date} · ${d.taxa}% · ${d.total}q`}
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(212,160,23,0.15)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.3)' }}
            >
              {d.date.slice(5)} ✦
            </div>
          ))}
          {days.length > 30 && (
            <span className="text-[9px] text-muted self-center">+{days.length - 30} dias</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Medal Card ────────────────────────────────────────────────────────────────

function MedalCard({ item }: { item: MatMedal }) {
  const m = item.medal
  return (
    <div
      className="rounded-card p-3 space-y-2 flex flex-col"
      style={{ background: m.bg, border: `1px solid ${m.border}` }}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="text-[20px] leading-none">{m.icon}</span>
        <span className="text-[13px] font-black tabular-nums" style={{ color: m.color }}>
          {item.taxa}%
        </span>
      </div>
      <div>
        <div className="text-[12px] font-bold text-text truncate leading-tight">{item.mat}</div>
        <div className="text-[10px] text-muted truncate">{item.disc}</div>
      </div>
      <div
        className="text-[9px] font-black tracking-wider uppercase mt-auto"
        style={{ color: m.color }}
      >
        {m.label}
      </div>
      <div className="text-[10px] text-muted">{item.total}q · {m.desc}</div>
    </div>
  )
}

// ── Medal Section ─────────────────────────────────────────────────────────────

function MedalSection({ medals, defId }: { medals: MatMedal[]; defId: string }) {
  const def  = MEDAL_DEFS.find(d => d.id === defId)!
  const tier = medals.filter(m => m.medal.id === defId)
  if (tier.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span>{def.icon}</span>
        <span className="text-[11px] font-black" style={{ color: def.color }}>{def.label}</span>
        <span className="text-[10px] text-muted">≥{def.minTaxa}% · ≥{def.minQ}q</span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: def.bg, color: def.color, border: `1px solid ${def.border}` }}
        >
          {tier.length}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
        {tier.map(item => <MedalCard key={item.mat} item={item} />)}
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function MedalGallery() {
  const medals = useMedals()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-text">🎖️ Medalhas de Honra ao Mérito</span>
        {medals.length > 0 && (
          <span className="text-[11px] text-muted">{medals.length} conquistada{medals.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Força de Elite */}
      <EliteSummary />

      {/* Medal collection — higher tiers first */}
      {medals.length === 0 ? (
        <div className="text-[12px] text-muted text-center py-4 bg-surface border border-border rounded-card">
          Nenhuma medalha ainda — atinja os requisitos mínimos de questões e acerto por matéria.
        </div>
      ) : (
        <div className="space-y-5">
          <MedalSection medals={medals} defId="cruz"    />
          <MedalSection medals={medals} defId="merito"  />
          <MedalSection medals={medals} defId="mencao"  />
        </div>
      )}
    </div>
  )
}
