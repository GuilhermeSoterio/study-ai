import { useStore } from '@/store'
import { useMoral } from '@/hooks/useMoral'
import { useRank, RANKS } from '@/hooks/useRank'

// Gradientes da barra por faixa de moral
function barGradient(score: number): string {
  if (score > 60) return 'linear-gradient(90deg, #2d6a4a, #4a7c59, #6b8e5a)'
  if (score > 30) return 'linear-gradient(90deg, #b07d10, #d4a017, #e8b84b)'
  return 'linear-gradient(90deg, #7f1d1d, #c0392b, #e74c3c)'
}

function barGlow(score: number, color: string): string | undefined {
  if (score > 40) return undefined
  return `0 0 16px 2px ${color}55, 0 0 6px 1px ${color}80`
}

export function MoralBar() {
  const moral  = useMoral()
  const rank   = useRank()
  const config = useStore(s => s.config)

  const demotedRank = moral.isCollapsed && rank.index > 0 ? RANKS[rank.index - 1] : null
  const isCritical  = moral.score <= 30

  return (
    <div
      className="bg-surface border rounded-card p-4 space-y-3"
      style={{ borderColor: moral.isCollapsed ? '#7f1d1d80' : undefined }}
    >
      {/* ── Cabeçalho compacto ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted">Moral</span>
          {moral.consecutiveGood > 1 && (
            <span className="text-[9px] font-black text-success bg-success/10 border border-success/25 px-1.5 py-0.5 rounded">
              {moral.consecutiveGood}d ✓
            </span>
          )}
          {moral.isCollapsed && (
            <span className="text-[9px] font-black text-danger bg-danger/10 border border-danger/30 px-1.5 py-0.5 rounded animate-pulse">
              ▼ REBAIXADO
            </span>
          )}
        </div>
        <div
          className="text-[10px] font-black px-2 py-0.5 rounded-sm border"
          style={{ color: moral.color, borderColor: moral.color + '60', background: moral.color + '18' }}
        >
          {moral.status}
        </div>
      </div>

      {/* ── Barra de energia ───────────────────────────────────── */}
      <div
        className="relative h-7 rounded-md overflow-hidden"
        style={{ background: '#0f172a', border: `1px solid ${moral.color}30` }}
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-md transition-all duration-700"
          style={{
            width:     `${moral.score}%`,
            background: barGradient(moral.score),
            boxShadow:  barGlow(moral.score, moral.color),
          }}
        />

        {/* Divisórias de segmento (estilo jogo de luta) */}
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-px"
            style={{ left: `${(i + 1) * 10}%`, background: 'rgba(255,255,255,0.08)' }}
          />
        ))}

        {/* Score sobreposto */}
        <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
          <span
            className="text-[11px] font-black tabular-nums"
            style={{ color: moral.score > 15 ? 'rgba(255,255,255,0.85)' : moral.color, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            {moral.score}
          </span>
          <span className="text-[10px] text-white/30 tabular-nums">/ 100</span>
        </div>

        {/* Pulsação em estado crítico */}
        {isCritical && (
          <div
            className="absolute inset-0 rounded-md pointer-events-none"
            style={{ animation: 'vuln-pulse 1.4s ease-in-out infinite', borderRadius: 'inherit' }}
          />
        )}
      </div>

      {/* ── Histórico: 13 dias + hoje ──────────────────────────── */}
      <div>
        <div className="flex gap-0.5 mb-1">
          {moral.history.map((day, i) => (
            <div
              key={i}
              title={`${day.date}: ${day.q}q`}
              className="h-2 flex-1 rounded-full"
              style={{
                background:
                  day.status === 'good'         ? '#4a7c59' :
                  day.status === 'partial'      ? '#d4a017' :
                  day.status === 'before-start' ? 'transparent' :
                                                  '#1e293b',
              }}
            />
          ))}
          <div
            title={`Hoje: ${moral.todayQ}q`}
            className="h-2 flex-1 rounded-full border"
            style={{
              background:  moral.todayMet ? '#4a7c59' : moral.todayQ > 0 ? '#d4a017' : 'transparent',
              borderColor: moral.color + '90',
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-dim select-none">
          <span>← 13 dias</span>
          <span>hoje →</span>
        </div>
      </div>

      {/* ── Linha de status única ──────────────────────────────── */}
      <div className="flex items-center justify-between text-[10px]">
        <span className={moral.todayMet ? 'text-success font-bold' : 'text-dim font-medium'}>
          {moral.todayMet
            ? `✓ Hoje: ${moral.todayQ}q — meta cumprida`
            : moral.todayQ > 0
              ? <>⏳ Hoje: <strong className="text-text font-black">{moral.todayQ}</strong> / <strong className="text-text font-black">{config.daily}</strong>q</>
              : '— Nenhuma questão hoje ainda'}
        </span>
        <span className="text-dim font-semibold">meta {config.daily}q/dia</span>
      </div>

      {/* ── Aviso de rebaixamento compacto ─────────────────────── */}
      {moral.isCollapsed && (
        <div className="flex items-center gap-2 border border-red-900/50 bg-red-950/20 rounded px-2.5 py-2">
          <span className="text-danger text-[13px] shrink-0">▼</span>
          <p className="text-[10px] text-muted leading-relaxed">
            {demotedRank ? (
              <>
                Patente reduzida para{' '}
                <span className="font-bold text-danger">{demotedRank.insig} {demotedRank.name}</span>.
                {' '}Cumpra a meta diária para recuperar.
              </>
            ) : (
              <>Patente <span className="font-bold text-danger">RECRUTA</span> ameaçada. Retome imediatamente.</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
