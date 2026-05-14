import { useMemo, useState } from 'react'
import { useStore } from '@/store'
import { ProtocoloLimpeza, type PurgeTarget } from './ProtocoloLimpeza'

// ── Status (para ordenação e labels) ──────────────────────────────────────────

type Status = 'consolidada' | 'instavel' | 'pressao'

const STATUS_LABEL: Record<Status, { label: string; sublabel: string }> = {
  consolidada: { label: 'Ouro Forjado',  sublabel: '> 70%'  },
  instavel:    { label: 'Temperando',    sublabel: '50–70%' },
  pressao:     { label: 'Ferro Bruto',   sublabel: '< 50%'  },
}

function getStatus(taxa: number): Status {
  if (taxa > 70) return 'consolidada'
  if (taxa >= 50) return 'instavel'
  return 'pressao'
}

// ── Sistema Kintsugi ──────────────────────────────────────────────────────────
// Cada bloco é ferro escuro com veias douradas; a proporção de ouro escala com taxa.

function kintsugiBlock(taxa: number, isHot: boolean) {
  const t    = taxa / 100
  const ease = Math.pow(t, 1.3)   // curva exponencial — ouro acelera acima de 70%

  const goldFill = ease * 0.78    // cobertura dourada 0 → 0.78
  const crackA   = 0.10 + t * 0.72  // opacidade das veias (escassa/tênue → vívida)

  // Borda: ferro frio → ouro quente → ouro polido
  const bdrColor = t >= 0.70
    ? `rgba(245,208,107,${(0.45 + ease * 0.50).toFixed(2)})`
    : t >= 0.40
    ? `rgba(212,160,23,${(0.20 + ease * 0.35).toFixed(2)})`
    : 'rgba(72,68,92,0.65)'

  // Glow
  const glow = isHot
    ? '0 0 0 2px rgba(255,80,50,0.50), 0 0 18px 5px rgba(255,80,50,0.35)'
    : t >= 0.45
    ? `0 0 ${(3 + ease * 20).toFixed(0)}px ${(ease * 6).toFixed(0)}px rgba(212,160,23,${(ease * 0.60).toFixed(2)}), inset 0 1px 0 rgba(255,232,140,${(crackA * 0.35).toFixed(2)})`
    : 'inset 0 2px 8px rgba(0,0,0,0.55)'

  // Fundo: superfície dourada + 3 veias + base de ferro
  const bg = [
    `linear-gradient(138deg, rgba(212,160,23,${(goldFill*0.55).toFixed(2)}), rgba(245,208,107,${(goldFill*0.88).toFixed(2)}), rgba(212,160,23,${(goldFill*0.62).toFixed(2)}))`,
    // Veia 1 — diagonal longa
    `linear-gradient(20deg,  transparent 44%,  rgba(255,232,140,${crackA.toFixed(2)})   44.5%, rgba(245,208,107,${(crackA*0.95).toFixed(2)}) 45.2%, transparent 45.8%)`,
    // Veia 2 — contra-diagonal
    `linear-gradient(-38deg, transparent 58%,  rgba(212,160,23,${(crackA*0.70).toFixed(2)})  58.6%, transparent 59.3%)`,
    // Veia 3 — curta e íngreme
    `linear-gradient(68deg,  transparent 70%,  rgba(255,232,140,${(crackA*0.50).toFixed(2)}) 70.4%, transparent 70.9%)`,
    // Base de ferro temperado
    'linear-gradient(152deg, #1c1a2a, #24203c, #1a1826)',
  ].join(', ')

  // Texto escuro sobre ouro, claro sobre ferro
  const textColor    = t >= 0.72 ? 'rgba(28,16,4,0.95)'  : 'rgba(238,228,208,0.95)'
  const subTextColor = t >= 0.72 ? 'rgba(48,28,6,0.80)'  : 'rgba(165,150,125,0.90)'

  return { bg, bdrColor, glow, textColor, subTextColor }
}

// Borda/glow do card de disciplina baseado na acurácia geral da zona
function kintsugiZone(taxa: number) {
  const t    = taxa / 100
  const ease = Math.pow(t, 1.3)

  if (t >= 0.70) return {
    border:      `1px solid rgba(245,208,107,${(0.30 + ease * 0.50).toFixed(2)})`,
    borderLeft:  `4px solid rgba(245,208,107,${(0.65 + ease * 0.30).toFixed(2)})`,
    boxShadow:   `0 0 ${(6 + ease * 22).toFixed(0)}px rgba(212,160,23,${(ease * 0.38).toFixed(2)})`,
    accentColor: `rgba(245,208,107,${(0.75 + ease * 0.25).toFixed(2)})`,
  }
  if (t >= 0.40) return {
    border:      `1px solid rgba(212,160,23,${(0.18 + ease * 0.28).toFixed(2)})`,
    borderLeft:  `4px solid rgba(212,160,23,${(0.50 + ease * 0.30).toFixed(2)})`,
    boxShadow:   undefined,
    accentColor: `rgba(212,160,23,${(0.65 + ease * 0.25).toFixed(2)})`,
  }
  return {
    border:      'rgba(72,68,92,0.55)',
    borderLeft:  '4px solid rgba(90,85,118,0.80)',
    boxShadow:   undefined,
    accentColor: 'rgba(130,120,155,0.80)',
  }
}

// ── Ícones por disciplina ─────────────────────────────────────────────────────

const DISC_ICON_MAP: [RegExp, string][] = [
  [/direito.*(admin|adm)/i,      '📋'],
  [/direito.*(const)/i,          '📜'],
  [/direito.*(penal|crim)/i,     '🔒'],
  [/direito.*(civil)/i,          '📄'],
  [/direito.*(process)/i,        '📑'],
  [/direito.*(trab)/i,           '📋'],
  [/direito/i,                   '📋'],
  [/portugu|língua|redaç/i,      '📖'],
  [/matem|aritm|álgebr/i,        '🔢'],
  [/raciocín|lógic/i,            '🎯'],
  [/informat|\bti\b|tecnologia/i,'💻'],
  [/contab/i,                    '📊'],
  [/econom/i,                    '📈'],
  [/estat/i,                     '📉'],
  [/atualid|contempor/i,         '📰'],
  [/histór|histor/i,             '📅'],
  [/geograf/i,                   '🗺️'],
  [/inglês|ingles/i,             '📝'],
  [/espanhol/i,                  '📝'],
  [/audit/i,                     '🔍'],
  [/legisl/i,                    '📋'],
  [/ética|etica/i,               '📋'],
  [/segurança|seguranca/i,       '🔐'],
  [/financ|fiscal|tribut/i,      '💰'],
  [/biolog/i,                    '🔬'],
  [/quím|quim/i,                 '🧪'],
  [/físic|fisic/i,               '⚡'],
  [/saúde|saude/i,               '🏥'],
  [/ambi|ecolog/i,               '🌿'],
  [/psicolog/i,                  '🧠'],
  [/sociol/i,                    '👥'],
  [/filosof/i,                   '💭'],
  [/arquiv/i,                    '🗂️'],
  [/gestão|gestao|admin/i,       '📋'],
  [/fonét|fonet|língua/i,        '📢'],
]

function getDiscIcon(disc: string): string {
  for (const [re, icon] of DISC_ICON_MAP) {
    if (re.test(disc)) return icon
  }
  return '📌'
}

// ── Data ──────────────────────────────────────────────────────────────────────

interface MatNode {
  mat:              string
  total:            number
  correct:          number
  taxa:             number
  status:           Status
  isPurgeable:      boolean
  errorsRemaining:  number
}

interface DiscZone {
  disc:   string
  mats:   MatNode[]
  total:  number
  taxa:   number
  status: Status
}

function useBattleMap(): DiscZone[] {
  const sessions     = useStore(s => s.sessionStats)
  const purgeRecords = useStore(s => s.purgeRecords)

  return useMemo(() => {
    // Build purge-credit map: "disc|||mat" → total errors_cleared
    const purgeMap = new Map<string, number>()
    for (const p of purgeRecords) {
      const key = `${p.disc}|||${p.mat}`
      purgeMap.set(key, (purgeMap.get(key) ?? 0) + p.errors_cleared)
    }

    const discMap = new Map<string, Map<string, { total: number; correct: number }>>()

    for (const s of sessions) {
      if (!discMap.has(s.disc)) discMap.set(s.disc, new Map())
      const inner = discMap.get(s.disc)!
      const cur   = inner.get(s.mat) ?? { total: 0, correct: 0 }
      inner.set(s.mat, { total: cur.total + s.total, correct: cur.correct + s.correct })
    }

    const zones: DiscZone[] = []
    for (const [disc, matMap] of discMap) {
      const mats: MatNode[] = [...matMap.entries()]
        .map(([mat, v]) => {
          const purgeCredits     = purgeMap.get(`${disc}|||${mat}`) ?? 0
          const effectiveCorrect = Math.min(v.total, v.correct + purgeCredits)
          const taxa             = v.total > 0 ? Math.round((effectiveCorrect / v.total) * 100) : 0
          const rawErrors        = v.total - v.correct
          const errorsRemaining  = Math.max(0, rawErrors - purgeCredits)
          const isPurgeable      = taxa < 70 && v.total >= 5 && errorsRemaining > 0
          return { mat, ...v, taxa, status: getStatus(taxa), isPurgeable, errorsRemaining }
        })
        .sort((a, b) => b.total - a.total)

      const total   = mats.reduce((s, m) => s + m.total, 0)
      const correct = mats.reduce((s, m) => s + m.correct, 0)
      const taxa    = total > 0 ? Math.round((correct / total) * 100) : 0

      zones.push({ disc, mats, total, taxa, status: getStatus(taxa) })
    }

    return zones.sort((a, b) => {
      const order: Record<Status, number> = { pressao: 0, instavel: 1, consolidada: 2 }
      return order[a.status] - order[b.status]
    })
  }, [sessions, purgeRecords])
}

// ── Matéria mais urgente ──────────────────────────────────────────────────────

function useHotMat(zones: DiscZone[]): string | null {
  return useMemo(() => {
    const allMats = zones.flatMap(z => z.mats).filter(m => m.total >= 5)
    if (allMats.length === 0) return null
    const underPressure = allMats.filter(m => m.taxa < 50)
    const pool = underPressure.length > 0 ? underPressure : allMats.filter(m => m.taxa < 70)
    if (pool.length === 0) return null
    return pool.sort((a, b) => a.taxa - b.taxa || b.total - a.total)[0].mat
  }, [zones])
}

// ── MatBlock ──────────────────────────────────────────────────────────────────

function MatBlock({ node, isHot, onPurge }: { node: MatNode; isHot: boolean; onPurge: () => void }) {
  const [hover, setHover] = useState(false)
  const size  = Math.max(56, Math.round(Math.sqrt(node.total) * 9))
  const ks    = kintsugiBlock(node.taxa, isHot)
  const shine = node.taxa >= 85 && !isHot

  return (
    <div
      className={`relative cursor-default rounded-sm transition-transform hover:scale-[1.07]${shine ? ' kintsugi-shine' : ''}`}
      style={{
        width:       size,
        height:      size,
        flexShrink:  0,
        background:  ks.bg,
        border:      `1.5px solid ${ks.bdrColor}`,
        boxShadow:   ks.glow,
        animation:   isHot ? 'vuln-pulse 1.6s ease-in-out infinite' : undefined,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Conteúdo */}
      <div className="absolute inset-0 p-1 flex flex-col justify-between overflow-hidden">
        <div
          className="text-[9px] font-bold leading-tight line-clamp-2"
          style={{ color: ks.subTextColor }}
        >
          {node.mat}
        </div>
        <div
          className="text-[13px] font-black tabular-nums leading-none"
          style={{ color: ks.textColor }}
        >
          {node.taxa}%
        </div>
      </div>

      {/* Badge de alvo quente */}
      {isHot && (
        <div
          className="absolute -top-2 -right-2 text-[13px] leading-none z-10 select-none"
          title="Alvo sugerido — ataque agora"
        >
          🔥
        </div>
      )}

      {/* Badge de alerta de limpeza */}
      {node.isPurgeable && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onPurge() }}
          className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-[9px] z-10 transition-transform hover:scale-110 active:scale-95"
          style={{
            background:  'rgba(192,57,43,0.90)',
            border:      '1.5px solid rgba(255,130,100,0.70)',
            color:       'rgba(255,220,200,0.95)',
            boxShadow:   '0 0 8px rgba(192,57,43,0.55)',
            animation:   'vuln-pulse 1.6s ease-in-out infinite',
          }}
          title={`Protocolo de Limpeza — ${node.errorsRemaining} erro${node.errorsRemaining !== 1 ? 's' : ''} detectado${node.errorsRemaining !== 1 ? 's' : ''}`}
        >
          ☢
        </button>
      )}

      {/* Tooltip */}
      {hover && (
        <div className="absolute bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap">
          <div
            className="text-[11px] font-semibold rounded px-2.5 py-1.5 shadow-lg leading-snug"
            style={{ background: '#1c1a2a', border: '1px solid rgba(212,160,23,0.35)', color: 'rgba(238,228,208,0.95)' }}
          >
            <div className="font-black" style={{ color: ks.bdrColor }}>{node.mat}</div>
            <div style={{ color: 'rgba(212,160,23,0.75)' }}>
              {STATUS_LABEL[node.status].label} · {node.taxa}%
            </div>
            <div style={{ color: 'rgba(165,150,125,0.80)' }}>{node.correct}/{node.total} questões</div>
            {isHot && <div className="text-[10px] mt-0.5" style={{ color: '#ff9060' }}>🔥 Alvo prioritário</div>}
            {node.isPurgeable && <div className="text-[10px] mt-0.5" style={{ color: 'rgba(240,140,110,0.90)' }}>☢ Protocolo de Limpeza disponível</div>}
          </div>
          <div className="w-2 h-2 rotate-45 mx-auto -mt-1" style={{ background: '#1c1a2a' }} />
        </div>
      )}
    </div>
  )
}

// ── DiscZoneCard ──────────────────────────────────────────────────────────────

function DiscZoneCard({ zone, hotMat, onPurge }: {
  zone:    DiscZone
  hotMat:  string | null
  onPurge: (target: PurgeTarget) => void
}) {
  const kz   = kintsugiZone(zone.taxa)
  const icon = getDiscIcon(zone.disc)
  const lbl  = STATUS_LABEL[zone.status]

  return (
    <div
      className="rounded-card p-3 space-y-2 bg-surface"
      style={{
        border:     kz.border,
        borderLeft: kz.borderLeft,
        boxShadow:  kz.boxShadow,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-1.5">
          <div
            className="w-[26px] h-[26px] rounded-md flex items-center justify-center text-[13px] leading-none select-none shrink-0"
            style={{ background: `rgba(212,160,23,0.10)`, border: `1px solid rgba(212,160,23,0.25)` }}
            title={zone.disc}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-black text-text truncate">{zone.disc}</div>
            <div className="text-[10px] font-semibold" style={{ color: kz.accentColor }}>
              {lbl.label} · {zone.total}q
            </div>
          </div>
        </div>
        <div
          className="text-[20px] font-black tabular-nums shrink-0"
          style={{ color: kz.accentColor }}
        >
          {zone.taxa}%
        </div>
      </div>

      {/* Mat blocks */}
      <div className="flex flex-wrap gap-1.5">
        {zone.mats.map(m => (
          <MatBlock
            key={m.mat}
            node={m}
            isHot={m.mat === hotMat}
            onPurge={() => onPurge({
              disc:            zone.disc,
              mat:             m.mat,
              total:           m.total,
              correct:         m.correct,
              effectiveTaxa:   m.taxa,
              errorsRemaining: m.errorsRemaining,
            })}
          />
        ))}
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Gradiente de referência */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-16 h-3 rounded-full"
          style={{ background: 'linear-gradient(90deg, #1c1a2a, #4a3a10, #d4a017, #f5d06b)' }}
        />
        <span className="text-[10px] text-muted">0% → 100%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(135deg, #1c1a2a, #24203c)' }} />
        <span className="text-[10px] text-muted">Ferro bruto</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(135deg, #4a3a10, #d4a01788)' }} />
        <span className="text-[10px] text-muted">Temperando</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: 'linear-gradient(135deg, #d4a017, #f5d06b)' }} />
        <span className="text-[10px] text-muted">Ouro forjado</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px]">🔥</span>
        <span className="text-[10px] text-muted font-bold">Alvo prioritário</span>
      </div>
      <span className="text-[10px] text-dim">· bloco ∝ volume</span>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function BattleMap() {
  const zones  = useBattleMap()
  const hotMat = useHotMat(zones)
  const [purgeTarget, setPurgeTarget] = useState<PurgeTarget | null>(null)

  if (zones.length === 0) return null

  const ferros    = zones.filter(z => z.status === 'pressao').length
  const ouros     = zones.filter(z => z.status === 'consolidada').length
  const alertCount = zones.flatMap(z => z.mats).filter(m => m.isPurgeable).length

  return (
    <>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-bold text-text">🗺️ Mapa de Frentes</span>
            {ferros > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(72,68,92,0.35)', color: 'rgba(165,150,200,0.9)', border: '1px solid rgba(90,85,115,0.5)' }}>
                {ferros} ferro bruto
              </span>
            )}
            {ouros > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(212,160,23,0.12)', color: 'rgba(245,208,107,0.95)', border: '1px solid rgba(212,160,23,0.35)' }}>
                {ouros} ouro forjado
              </span>
            )}
            {alertCount > 0 && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(192,57,43,0.15)', color: 'rgba(240,140,110,0.95)', border: '1px solid rgba(192,57,43,0.40)', animation: 'vuln-pulse 1.6s ease-in-out infinite' }}>
                ☢ {alertCount} alerta{alertCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Legend />
        </div>

        {/* Grid de zonas */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {zones.map(z => (
            <DiscZoneCard key={z.disc} zone={z} hotMat={hotMat} onPurge={setPurgeTarget} />
          ))}
        </div>
      </div>

      {purgeTarget && (
        <ProtocoloLimpeza target={purgeTarget} onClose={() => setPurgeTarget(null)} />
      )}
    </>
  )
}
