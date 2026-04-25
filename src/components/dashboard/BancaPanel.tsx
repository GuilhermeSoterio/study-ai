import { useMemo, useState } from 'react'
import { useStore } from '@/store'
import { Card, CardLabel } from '@/components/ui/Card'

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

function taxaColor(t: number) {
  return t >= 75 ? 'text-success' : t >= 50 ? 'text-warning' : 'text-danger'
}
function barColor(t: number) {
  return t >= 75 ? 'bg-success' : t >= 50 ? 'bg-warning' : 'bg-danger'
}

interface BancaStat {
  banca:   string
  total:   number
  correct: number
  taxa:    number
}

function useBancaStats(): { all: BancaStat[]; official: BancaStat[] } {
  const sessions = useStore(s => s.sessions)
  return useMemo(() => {
    const map = new Map<string, { total: number; correct: number }>()
    for (const s of sessions) {
      const key = s.banca || 'Não informada'
      const cur = map.get(key) ?? { total: 0, correct: 0 }
      map.set(key, { total: cur.total + s.total, correct: cur.correct + s.correct })
    }
    const all = [...map.entries()]
      .map(([banca, v]) => ({ banca, ...v, taxa: pct(v.correct, v.total) }))
      .sort((a, b) => b.total - a.total)

    const NON_BANCA = new Set(['chatgpt', 'chat gpt', 'não informada'])
    const official = all.filter(s => !NON_BANCA.has(s.banca.toLowerCase()))

    return { all, official }
  }, [sessions])
}

// ─── Sumário: 3 métricas rápidas ─────────────────────────────────────────────

interface Top3Card {
  label: string
  icon:  string
  top:   { banca: string; value: string; color: string }[]
}

function SummaryCard({ card }: { card: Top3Card }) {
  const [first, ...rest] = card.top
  return (
    <div className="bg-surface border border-border rounded-card px-3 py-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
        <span>{card.icon}</span>
        <span>{card.label}</span>
      </div>

      {/* Top 1 — destaque */}
      {first && (
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-[13px] font-bold text-text truncate flex-1">{first.banca}</span>
          <span className={`text-[18px] font-black tabular-nums shrink-0 ${first.color}`}>{first.value}</span>
        </div>
      )}

      {/* Top 2 e 3 — menores */}
      {rest.length > 0 && (
        <div className="space-y-1 border-t border-border/50 pt-1.5">
          {rest.map((r, i) => (
            <div key={r.banca} className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-muted tabular-nums shrink-0">#{i + 2}</span>
              <span className="text-[11px] text-muted truncate flex-1 px-1">{r.banca}</span>
              <span className={`text-[11px] font-bold tabular-nums shrink-0 ${r.color}`}>{r.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BancaSummary({ stats }: { stats: BancaStat[] }) {
  const withData = stats.filter(s => s.total >= 3)
  if (!withData.length) return null

  const byBest  = [...withData].sort((a, b) => b.taxa - a.taxa).slice(0, 3)
  const byWorst = [...withData].sort((a, b) => a.taxa - b.taxa).slice(0, 3)
  const byMost  = [...withData].sort((a, b) => b.total - a.total).slice(0, 3)

  const cards: Top3Card[] = [
    {
      label: 'Melhor banca',
      icon:  '🏆',
      top: byBest.map(s => ({ banca: s.banca, value: `${s.taxa}%`, color: taxaColor(s.taxa) })),
    },
    {
      label: 'Mais difícil',
      icon:  '⚠️',
      top: byWorst.map(s => ({ banca: s.banca, value: `${s.taxa}%`, color: taxaColor(s.taxa) })),
    },
    {
      label: 'Mais estudada',
      icon:  '📚',
      top: byMost.map(s => ({ banca: s.banca, value: `${s.total}q`, color: 'text-accent' })),
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map(c => <SummaryCard key={c.label} card={c} />)}
    </div>
  )
}

// ─── Breakdown detalhado ──────────────────────────────────────────────────────

function BancaBreakdown({ stats }: { stats: BancaStat[] }) {
  const max = stats[0]?.total ?? 1

  return (
    <Card>
      <CardLabel>Por banca</CardLabel>
      <div className="space-y-0">
        {stats.map(s => (
          <div key={s.banca} className="py-2 border-b border-border/50 last:border-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-text truncate flex-1">{s.banca}</span>
              <span className={`text-[12px] font-black tabular-nums ${taxaColor(s.taxa)}`}>{s.taxa}%</span>
              <span className="text-[10px] text-muted w-10 text-right shrink-0">{s.total}q</span>
            </div>
            {/* Volume bar (cinza) + acerto bar (colorida) sobrepostos */}
            <div className="relative h-1.5 bg-surface3 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 left-0 bg-surface2 rounded-full"
                style={{ width: `${(s.total / max) * 100}%` }}
              />
              <div className={`absolute inset-y-0 left-0 rounded-full ${barColor(s.taxa)}`}
                style={{ width: `${(s.correct / max) * 100}%`, opacity: 0.85 }}
              />
            </div>
            <div className="flex gap-3 text-[10px] text-muted">
              <span className="text-success">{s.correct} acertos</span>
              <span className="text-danger">{s.total - s.correct} erros</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Matéria mais fraca por banca ────────────────────────────────────────────

interface MatFraca {
  banca: string
  mat:   string
  taxa:  number
  total: number
}

function useMatFraca(minQuestions = 3): MatFraca[] {
  const sessions = useStore(s => s.sessions)
  return useMemo(() => {
    // banca → mat → { total, correct }
    const map = new Map<string, Map<string, { total: number; correct: number }>>()
    for (const s of sessions) {
      const banca = s.banca || 'Não informada'
      if (!map.has(banca)) map.set(banca, new Map())
      const inner = map.get(banca)!
      const cur   = inner.get(s.mat) ?? { total: 0, correct: 0 }
      inner.set(s.mat, { total: cur.total + s.total, correct: cur.correct + s.correct })
    }

    const NON_BANCA = new Set(['chatgpt', 'chat gpt', 'não informada'])
    const result: MatFraca[] = []
    for (const [banca, mats] of map) {
      if (NON_BANCA.has(banca.toLowerCase())) continue
      const worst = [...mats.entries()]
        .map(([mat, v]) => ({ mat, ...v, taxa: pct(v.correct, v.total) }))
        .filter(m => m.total >= minQuestions)
        .sort((a, b) => a.taxa - b.taxa)[0]
      if (worst) result.push({ banca, mat: worst.mat, taxa: worst.taxa, total: worst.total })
    }
    return result.sort((a, b) => a.taxa - b.taxa)
  }, [sessions])
}

function MatFracaList() {
  const items = useMatFraca()
  if (!items.length) return null

  return (
    <Card>
      <CardLabel>Matéria mais fraca por banca</CardLabel>
      <div className="space-y-0">
        {items.map(item => (
          <div key={item.banca} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-text">{item.banca}</div>
              <div className="text-[11px] text-muted truncate">{item.mat}</div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-[13px] font-black tabular-nums ${taxaColor(item.taxa)}`}>
                {item.taxa}%
              </div>
              <div className="text-[10px] text-muted">{item.total}q</div>
            </div>
            <div className="w-20 shrink-0">
              <div className="bg-surface3 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${barColor(item.taxa)}`}
                  style={{ width: `${item.taxa}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Diversificação ──────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: 'Tudo', days: 0 },
]

const BAR_COLORS = [
  '#4a7c59','#d4a017','#c0392b','#3a6648',
  '#8b7355','#6b8e5a','#9a9485','#8b0000','#5c8a44','#b8860b',
]

function diversityScore(shares: number[]): number {
  // Índice de Herfindahl invertido: 0 = concentrado, 100 = perfeitamente diverso
  const hhi = shares.reduce((s, p) => s + (p / 100) ** 2, 0)
  const n   = shares.length
  if (n <= 1) return 0
  const normalized = (hhi - 1 / n) / (1 - 1 / n)
  return Math.round((1 - normalized) * 100)
}

function Diversificacao() {
  const sessions = useStore(s => s.sessions)
  const [period, setPeriod] = useState(30)

  const { items, score } = useMemo(() => {
    const cutoff = period === 0
      ? ''
      : new Date(Date.now() - period * 86400000).toISOString().slice(0, 10)

    const map = new Map<string, number>()
    for (const s of sessions) {
      if (cutoff && s.date < cutoff) continue
      const key = s.banca || 'Não informada'
      map.set(key, (map.get(key) ?? 0) + s.total)
    }

    const total = [...map.values()].reduce((a, b) => a + b, 0) || 1
    const sorted = [...map.entries()]
      .map(([banca, qty], i) => ({
        banca,
        qty,
        share: Math.round((qty / total) * 100),
        color: BAR_COLORS[i % BAR_COLORS.length],
      }))
      .sort((a, b) => b.qty - a.qty)

    return { items: sorted, score: diversityScore(sorted.map(s => s.share)) }
  }, [sessions, period])

  const scoreColor = score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-danger'
  const scoreLabel = score >= 70 ? 'Diversificado' : score >= 40 ? 'Moderado' : 'Concentrado'
  const dominant  = items[0]

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <CardLabel>Diversificação por banca</CardLabel>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map(o => (
            <button key={o.label} onClick={() => setPeriod(o.days)}
              className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                period === o.days
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted hover:text-text'
              }`}
            >{o.label}</button>
          ))}
        </div>
      </div>

      {/* Score de diversidade */}
      <div className="flex items-center gap-4 mb-3 p-3 bg-surface2 rounded-sm">
        <div className="text-center">
          <div className={`text-[22px] font-black tabular-nums ${scoreColor}`}>{score}</div>
          <div className="text-[10px] text-muted">Score</div>
        </div>
        <div className="flex-1">
          <div className={`text-[12px] font-bold ${scoreColor}`}>{scoreLabel}</div>
          {dominant && (
            <div className="text-[11px] text-muted mt-0.5">
              {dominant.share >= 60
                ? `${dominant.banca} domina com ${dominant.share}% das questões`
                : `Maior concentração: ${dominant.banca} (${dominant.share}%)`}
            </div>
          )}
        </div>
      </div>

      {/* Barra empilhada */}
      <div className="flex h-3 rounded-full overflow-hidden mb-3 gap-px">
        {items.map(item => (
          <div key={item.banca} title={`${item.banca}: ${item.share}%`}
            style={{ width: `${item.share}%`, background: item.color }}
          />
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.banca} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
            <span className="text-[11px] text-muted truncate flex-1">{item.banca}</span>
            <span className="text-[11px] font-bold text-text tabular-nums">{item.qty}q</span>
            <div className="w-16 bg-surface3 rounded-full h-1 shrink-0">
              <div className="h-1 rounded-full" style={{ width: `${item.share}%`, background: item.color }} />
            </div>
            <span className="text-[11px] text-muted tabular-nums w-8 text-right">{item.share}%</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Tendência recente vs histórico ──────────────────────────────────────────

interface TendenciaStat {
  banca:       string
  historico:   number
  recente:     number
  diff:        number
  nRecente:    number
  nHistorico:  number
}

function useTendencias(recenteSessions = 5): TendenciaStat[] {
  const sessions = useStore(s => s.sessions)
  return useMemo(() => {
    const NON_BANCA = new Set(['chatgpt', 'chat gpt', 'não informada'])

    // Agrupa todas as sessões por banca, mantendo ordem cronológica
    const map = new Map<string, { total: number; correct: number }[]>()
    const sorted = [...sessions].sort((a, b) => a.ts - b.ts)
    for (const s of sorted) {
      const banca = s.banca || 'Não informada'
      if (NON_BANCA.has(banca.toLowerCase())) continue
      if (!map.has(banca)) map.set(banca, [])
      map.get(banca)!.push({ total: s.total, correct: s.correct })
    }

    const result: TendenciaStat[] = []
    for (const [banca, entries] of map) {
      if (entries.length < recenteSessions + 1) continue // precisa de histórico além do recente

      const recent  = entries.slice(-recenteSessions)
      const history = entries.slice(0, -recenteSessions)

      const recTotal  = recent.reduce((s, e) => s + e.total, 0)
      const recCorr   = recent.reduce((s, e) => s + e.correct, 0)
      const histTotal = history.reduce((s, e) => s + e.total, 0)
      const histCorr  = history.reduce((s, e) => s + e.correct, 0)

      const recente   = pct(recCorr, recTotal)
      const historico = pct(histCorr, histTotal)

      result.push({
        banca,
        historico,
        recente,
        diff:       recente - historico,
        nRecente:   recTotal,
        nHistorico: histTotal,
      })
    }

    return result.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
  }, [sessions])
}

function TendenciaRow({ item }: { item: TendenciaStat }) {
  const up      = item.diff > 0
  const neutral = Math.abs(item.diff) < 2
  const diffColor  = neutral ? 'text-muted' : up ? 'text-success' : 'text-danger'
  const diffLabel  = neutral ? '=' : up ? `+${item.diff}pp` : `${item.diff}pp`
  const arrow      = neutral ? '→' : up ? '↑' : '↓'

  return (
    <div className="py-2.5 border-b border-border/50 last:border-0 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold text-text truncate flex-1">{item.banca}</span>
        <span className={`text-[13px] font-black tabular-nums ${diffColor}`}>
          {arrow} {diffLabel}
        </span>
      </div>

      {/* Barra comparativa */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] text-muted mb-0.5">Histórico · {item.nHistorico}q</div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 bg-surface3 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full ${barColor(item.historico)}`}
                style={{ width: `${item.historico}%` }} />
            </div>
            <span className={`text-[10px] font-bold w-7 text-right tabular-nums ${taxaColor(item.historico)}`}>
              {item.historico}%
            </span>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted mb-0.5">Recente · {item.nRecente}q</div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 bg-surface3 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full ${barColor(item.recente)}`}
                style={{ width: `${item.recente}%` }} />
            </div>
            <span className={`text-[10px] font-bold w-7 text-right tabular-nums ${taxaColor(item.recente)}`}>
              {item.recente}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TendenciaPanel() {
  const [n, setN] = useState(5)
  const items = useTendencias(n)

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <CardLabel>Tendência: recente vs histórico</CardLabel>
        <div className="flex items-center gap-1 mb-2.5">
          <span className="text-[10px] text-muted">Últimas</span>
          {[5, 10, 15].map(v => (
            <button key={v} onClick={() => setN(v)}
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border transition-colors ${
                n === v ? 'bg-primary text-white border-primary' : 'border-border text-muted hover:text-text'
              }`}
            >{v}</button>
          ))}
          <span className="text-[10px] text-muted">sessões</span>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-[12px] text-muted">
          Dados insuficientes — cada banca precisa de mais de {n} sessões para calcular tendência.
        </p>
      ) : (
        <div>
          {items.map(item => <TendenciaRow key={item.banca} item={item} />)}
        </div>
      )}
    </Card>
  )
}

// ─── Análise de tipos de erro ─────────────────────────────────────────────────

const ERROR_META: Record<string, { label: string; color: string; bg: string }> = {
  nao_sabia:  { label: 'Não sabia',  color: 'text-danger',   bg: 'bg-danger'   },
  distracao:  { label: 'Distração',  color: 'text-warning',  bg: 'bg-warning'  },
  pegadinha:  { label: 'Pegadinha',  color: 'text-accent',   bg: 'bg-accent'   },
  tempo:      { label: 'Tempo',      color: 'text-muted',    bg: 'bg-muted'    },
}

function ErrosPanel() {
  const sessions = useStore(s => s.sessions)

  const stats = useMemo(() => {
    const map: Record<string, number> = {}
    let totalErros = 0
    for (const s of sessions) {
      if (!s.error_type) continue
      const erros = s.total - s.correct
      if (erros <= 0) continue
      map[s.error_type] = (map[s.error_type] ?? 0) + erros
      totalErros += erros
    }
    if (totalErros === 0) return null
    return Object.entries(map)
      .map(([type, count]) => ({ type, count, share: Math.round((count / totalErros) * 100) }))
      .sort((a, b) => b.count - a.count)
  }, [sessions])

  if (!stats) return null

  const dominant = stats[0]
  const meta = dominant ? ERROR_META[dominant.type] : null

  return (
    <Card>
      <CardLabel>Por que você erra?</CardLabel>

      {/* Insight principal */}
      {meta && (
        <div className={`mb-3 px-3 py-2 rounded-sm bg-surface2 border-l-2 ${meta.bg}/50`}>
          <div className={`text-[12px] font-bold ${meta.color}`}>
            Principal causa: {meta.label} ({dominant.share}%)
          </div>
          <div className="text-[11px] text-muted mt-0.5">
            {dominant.type === 'nao_sabia'  && 'Foco em revisar conteúdo — o problema é de conhecimento.'}
            {dominant.type === 'distracao'  && 'Leia com mais atenção — o conteúdo você sabe, mas perde por distração.'}
            {dominant.type === 'pegadinha'  && 'Aprenda a identificar armadilhas de banca — é uma habilidade treinável.'}
            {dominant.type === 'tempo'      && 'Aumente a velocidade de leitura ou gerencie melhor o tempo de prova.'}
          </div>
        </div>
      )}

      {/* Barras por tipo */}
      <div className="space-y-2">
        {stats.map(s => {
          const m = ERROR_META[s.type]
          return (
            <div key={s.type} className="flex items-center gap-2">
              <span className={`text-[11px] font-bold w-20 shrink-0 ${m.color}`}>{m.label}</span>
              <div className="flex-1 bg-surface3 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${m.bg}`} style={{ width: `${s.share}%` }} />
              </div>
              <span className="text-[11px] text-muted tabular-nums w-16 text-right">
                {s.count} erros · {s.share}%
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function BancaPanel() {
  const { all, official } = useBancaStats()
  if (!all.length) return null

  return (
    <div className="space-y-3">
      <div className="text-[13px] font-bold text-text">Análise por Banca</div>
      <BancaSummary stats={official} />
      <BancaBreakdown stats={all} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MatFracaList />
        <Diversificacao />
      </div>
      <TendenciaPanel />
      <ErrosPanel />
    </div>
  )
}
