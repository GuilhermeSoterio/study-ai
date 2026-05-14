import { useRank, RANKS } from '@/hooks/useRank'
import { useStore } from '@/store'

// ── Medalhas ──────────────────────────────────────────────────────────────────

const MEDAL = {
  N1: { label: 'Bronze', color: '#c8832a', border: 'rgba(200,131,42,',  bg: 'rgba(200,131,42,',  icon: '🥉' },
  N2: { label: 'Prata',  color: '#b0b5bc', border: 'rgba(176,181,188,', bg: 'rgba(176,181,188,', icon: '🥈' },
  N3: { label: 'Ouro',   color: '#d4a017', border: 'rgba(212,160,23,',  bg: 'rgba(212,160,23,',  icon: '🥇' },
}

// ── Descrições expandidas por Patente × Sub-Nível ────────────────────────────

const RANK_SUB_DESC: Record<string, Record<'N1' | 'N2' | 'N3', string>> = {
  RECRUTA: {
    N1: 'Você pisou no campo pela primeira vez. O uniforme ainda está limpo — o peso do que está por vir ainda não chegou. Mas você se apresentou, e isso já separa você da maioria que nunca chegou a tentar.',
    N2: 'Algumas sessões no histórico. O ritmo do combate começa a fazer sentido — questão por questão, o mapa vai tomando forma. A consistência, não o brilho, é a arma desta fase.',
    N3: 'Recruta em estágio final — o campo já te moldou mais do que você percebe. A promoção está a um passo e o primeiro galão está à vista. Você já não é o mesmo que entrou.',
  },
  CABO: {
    N1: 'A primeira credencial conquistada. Você provou que voltou no dia seguinte — e isso é mais raro do que parece. A disciplina começa a tomar forma antes mesmo do hábito se instalar.',
    N2: 'Cabo consolidado. Seus padrões de estudo se repetem com crescente precisão — o caos inicial foi domesticado. O pelotão começa a te reconhecer pelo ritmo, não pelo esforço.',
    N3: 'Cabo de elite. A farda ganhou peso e a disciplina já é hábito, não esforço. Você carrega as primeiras marcas reais de quem levou a jornada a sério desde o primeiro dia.',
  },
  SARGENTO: {
    N1: 'Faixas no braço. Você conhece o terreno e começa a liderar o próprio ritmo — sem precisar de empurrão externo. O campo já não parece tão desconhecido quanto antes.',
    N2: 'Sargento veterano. A banca não te surpreende mais — você antecipa os padrões com a segurança de quem já os viu repetir. O conhecimento deixou de ser reativo e virou estratégico.',
    N3: 'Sargento de elite. Cada sessão é uma operação planejada, não uma reação ao acaso. A promoção cheira a pólvora — o Tenente está ao alcance de quem não parou.',
  },
  TENENTE: {
    N1: 'Estrela no ombro. O conhecimento virou arma e você começou a empunhá-la com precisão. O campo começa a te reconhecer como força a ser respeitada — não apenas como presença.',
    N2: 'Tenente veterano. Você comanda disciplinas inteiras com autoridade técnica — não mais como aluno, mas como especialista em formação. O mapa está cada vez mais legível.',
    N3: 'Tenente de elite. A próxima patente já está na mira e cada questão é um passo calculado. Concentração total — o Capitanato recompensa quem não perdeu o foco aqui.',
  },
  CAPITÃO: {
    N1: 'Metade do campo tomada. Duas estrelas — você é temido pelo nível de preparo que demonstra a cada sessão. O campo começa a inclinar a seu favor.',
    N2: 'Capitão veterano. Sua constância inspira e o campo já te reconhece pelo nome e pela presença. A aprovação saiu do domínio do sonho e entrou no domínio do plano.',
    N3: 'Capitão de elite. A linha de frente é sua e cada batalha confirma o que os números já dizem. O Majorato está a um passo — e você chegou até aqui sem atalhos.',
  },
  MAJOR: {
    N1: 'Três estrelas. A aprovação não é mais possibilidade — é probabilidade calculada a cada nova sessão. Você cruzou um limiar que a maioria nunca cruza.',
    N2: 'Major veterano. Cada estrela foi carregada na raça — não existe sorte aqui, existe repetição deliberada. O campo te teme porque você não para quando deveria parar.',
    N3: 'Major de elite. Às portas do Coronelato, carregando as marcas de uma jornada que forjou mais do que conhecimento. A batalha foi longa — e você ainda está de pé.',
  },
  CORONEL: {
    N1: 'Quatro insígnias forjadas. Você sobreviveu a cada queda e retornou mais forte do que entrou — isso é o que separa os que chegam aqui dos que desistiram no caminho.',
    N2: 'Coronel veterano. Você lidera pelo exemplo — sua trajetória é a prova viva de que disciplina vence talento no longo prazo. O campo te olha como referência.',
    N3: 'Coronel de elite. O Generalato é iminente e você é o que resta após o fogo — refinado, preciso, irredutível. A última ascensão começa agora.',
  },
  GENERAL: {
    N1: 'A missão está cumprida. Você cruzou o campo de batalha inteiro — agora você é o mapa que outros precisarão seguir. A meta foi conquistada, não entregue.',
    N2: 'General veterano. A aprovação não é mais sonho — é estado permanente, conquistado questão por questão, dia após dia. Você provou que a New Age não é discurso.',
    N3: 'General de elite. Não existe mais acima — você é o Estado de Aprovação, a versão final de quem não desistiu quando o campo estava escuro. A jornada foi cumprida.',
  },
}

// ── Traço de combate por Patente × Sub-Nível ─────────────────────────────────

const RANK_SUB_TRAITS: Record<string, Record<'N1' | 'N2' | 'N3', string>> = {
  RECRUTA:  { N1: 'Comparecimento',       N2: 'Constância Inicial',      N3: 'Adaptação ao Campo'      },
  CABO:     { N1: 'Disciplina Nascente',   N2: 'Ritmo Consolidado',       N3: 'Hábito Instalado'        },
  SARGENTO: { N1: 'Leitura de Banca',      N2: 'Antecipação de Padrão',   N3: 'Resistência ao Tédio'    },
  TENENTE:  { N1: 'Precisão Técnica',      N2: 'Autoridade de Campo',     N3: 'Foco Cirúrgico'          },
  CAPITÃO:  { N1: 'Preparo Reconhecido',   N2: 'Constância Provada',      N3: 'Domínio de Frente'       },
  MAJOR:    { N1: 'Alta Probabilidade',    N2: 'Tenacidade Blindada',     N3: 'Iminência de Coroa'      },
  CORONEL:  { N1: 'Resiliência Forjada',   N2: 'Liderança pelo Exemplo',  N3: 'Refinamento Final'       },
  GENERAL:  { N1: 'Meta Conquistada',      N2: 'Estado Permanente',       N3: 'Status de Aprovação'     },
}

// ── Lore por patente (header do grupo) ───────────────────────────────────────

const LORE: Record<string, { range: string; requisito: string }> = {
  RECRUTA:  { range: '0 – 4%',   requisito: 'Início da jornada'          },
  CABO:     { range: '5 – 14%',  requisito: '5% da meta'                 },
  SARGENTO: { range: '15 – 29%', requisito: '15% da meta'                },
  TENENTE:  { range: '30 – 49%', requisito: '30% da meta + 500 cards'    },
  CAPITÃO:  { range: '50 – 64%', requisito: '50% da meta + 1.000 cards'  },
  MAJOR:    { range: '65 – 79%', requisito: '65% da meta + 2.500 cards'  },
  CORONEL:  { range: '80 – 99%', requisito: '80% da meta + 3.500 cards'  },
  GENERAL:  { range: '100%',     requisito: '100% da meta + 5.000 cards' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Thresholds de cada sub-nível dentro da patente (0–100 escala withinPct)
const SL_RANGE = {
  N1: { from: 0,  to: 49  },
  N2: { from: 50, to: 89  },
  N3: { from: 90, to: 100 },
}

// Mínimo de frentes (disciplinas distintas) exigidas por patente × sub-nível.
// Impede o "farm" numa única matéria.
const FRENTE_REQ: Record<string, Record<'N1' | 'N2' | 'N3', number>> = {
  RECRUTA:  { N1: 1, N2: 2, N3: 3 },
  CABO:     { N1: 2, N2: 3, N3: 3 },
  SARGENTO: { N1: 3, N2: 3, N3: 4 },
  TENENTE:  { N1: 3, N2: 4, N3: 4 },
  CAPITÃO:  { N1: 4, N2: 4, N3: 5 },
  MAJOR:    { N1: 4, N2: 5, N3: 5 },
  CORONEL:  { N1: 5, N2: 5, N3: 6 },
  GENERAL:  { N1: 5, N2: 6, N3: 6 },
}

function subLevelProgress(withinPct: number, sl: 'N1' | 'N2' | 'N3') {
  const { from, to } = SL_RANGE[sl]
  return Math.min(100, Math.max(0, Math.round(((withinPct - from) / (to - from)) * 100)))
}

function qRange(rankMin: number, nextMin: number, sl: 'N1' | 'N2' | 'N3', bigGoal: number) {
  const start  = Math.ceil((rankMin  / 100) * bigGoal)
  const end    = Math.ceil((nextMin  / 100) * bigGoal)
  const span   = end - start
  const { from, to } = SL_RANGE[sl]
  const qFrom  = start + Math.ceil((from / 100) * span)
  const qTo    = start + Math.floor((to   / 100) * span)
  return { qFrom, qTo }
}

// ── Sistemas metálicos por medalha ────────────────────────────────────────────
// taxa 0–100 controla saturação do metal. Cada tipo tem sua paleta de cor.

function metalBlock(taxa: number, sl: 'N1' | 'N2' | 'N3') {
  const t    = taxa / 100
  const ease = Math.pow(t, 1.3)
  const fill = ease * 0.82
  const crackA = 0.10 + t * 0.76

  if (sl === 'N1') {
    // Bronze / Cobre — veias âmbar-cobre quente
    const r1 = [185, 100, 30] as const   // bronze escuro
    const r2 = [240, 180,  70] as const   // bronze brilhante
    const r3 = [250, 200, 120] as const   // highlight quente
    const bdrColor = t >= 0.55
      ? `rgba(${r3.join()},${(0.50 + ease * 0.48).toFixed(2)})`
      : t >= 0.30
      ? `rgba(${r2.join()},${(0.22 + ease * 0.38).toFixed(2)})`
      : 'rgba(72,68,92,0.55)'
    const glow = t >= 0.35
      ? `0 0 ${(4 + ease * 28).toFixed(0)}px ${(ease * 9).toFixed(0)}px rgba(200,120,40,${(ease * 0.62).toFixed(2)}), inset 0 1px 0 rgba(${r3.join()},${(crackA * 0.38).toFixed(2)})`
      : 'inset 0 2px 8px rgba(0,0,0,0.60)'
    const bg = [
      `linear-gradient(138deg, rgba(${r1.join()},${(fill*0.58).toFixed(2)}), rgba(${r2.join()},${(fill*0.90).toFixed(2)}), rgba(${r1.join()},${(fill*0.65).toFixed(2)}))`,
      `linear-gradient(20deg,  transparent 44%,  rgba(${r3.join()},${crackA.toFixed(2)})           44.5%, rgba(${r2.join()},${(crackA*0.95).toFixed(2)}) 45.2%, transparent 45.8%)`,
      `linear-gradient(-38deg, transparent 58%,  rgba(${r1.join()},${(crackA*0.72).toFixed(2)})    58.6%, transparent 59.3%)`,
      `linear-gradient(68deg,  transparent 70%,  rgba(${r3.join()},${(crackA*0.52).toFixed(2)})    70.4%, transparent 70.9%)`,
      'linear-gradient(152deg, #1c1a2a, #24203c, #1a1826)',
    ].join(', ')
    return { bg, bdrColor, glow, shineClass: 'bronze-shine' }
  }

  if (sl === 'N2') {
    // Prata / Aço — veias branco-aço frio
    const r1 = [130, 138, 150] as const  // aço escuro
    const r2 = [200, 208, 218] as const  // prata média
    const r3 = [230, 235, 245] as const  // highlight frio
    const bdrColor = t >= 0.55
      ? `rgba(${r3.join()},${(0.48 + ease * 0.46).toFixed(2)})`
      : t >= 0.30
      ? `rgba(${r2.join()},${(0.20 + ease * 0.36).toFixed(2)})`
      : 'rgba(72,68,92,0.55)'
    const glow = t >= 0.35
      ? `0 0 ${(4 + ease * 26).toFixed(0)}px ${(ease * 8).toFixed(0)}px rgba(180,188,200,${(ease * 0.58).toFixed(2)}), inset 0 1px 0 rgba(${r3.join()},${(crackA * 0.40).toFixed(2)})`
      : 'inset 0 2px 8px rgba(0,0,0,0.60)'
    const bg = [
      `linear-gradient(138deg, rgba(${r1.join()},${(fill*0.55).toFixed(2)}), rgba(${r2.join()},${(fill*0.88).toFixed(2)}), rgba(${r1.join()},${(fill*0.60).toFixed(2)}))`,
      `linear-gradient(20deg,  transparent 44%,  rgba(${r3.join()},${crackA.toFixed(2)})           44.5%, rgba(${r2.join()},${(crackA*0.95).toFixed(2)}) 45.2%, transparent 45.8%)`,
      `linear-gradient(-38deg, transparent 58%,  rgba(${r1.join()},${(crackA*0.68).toFixed(2)})    58.6%, transparent 59.3%)`,
      `linear-gradient(68deg,  transparent 70%,  rgba(${r3.join()},${(crackA*0.50).toFixed(2)})    70.4%, transparent 70.9%)`,
      'linear-gradient(152deg, #1c1a2a, #24203c, #1a1826)',
    ].join(', ')
    return { bg, bdrColor, glow, shineClass: 'silver-shine' }
  }

  // Ouro — veias douradas mais intensas que o BattleMap
  const bdrColor = t >= 0.55
    ? `rgba(255,228,110,${(0.55 + ease * 0.44).toFixed(2)})`
    : t >= 0.30
    ? `rgba(212,160,23,${(0.25 + ease * 0.42).toFixed(2)})`
    : 'rgba(72,68,92,0.55)'
  const glow = t >= 0.35
    ? `0 0 ${(5 + ease * 34).toFixed(0)}px ${(ease * 12).toFixed(0)}px rgba(212,160,23,${(ease * 0.72).toFixed(2)}), inset 0 1px 0 rgba(255,235,140,${(crackA * 0.48).toFixed(2)})`
    : 'inset 0 2px 8px rgba(0,0,0,0.60)'
  const bg = [
    `linear-gradient(138deg, rgba(212,160,23,${(fill*0.62).toFixed(2)}), rgba(255,218,60,${(fill*0.94).toFixed(2)}), rgba(212,160,23,${(fill*0.70).toFixed(2)}))`,
    `linear-gradient(20deg,  transparent 44%,  rgba(255,242,150,${crackA.toFixed(2)})          44.5%, rgba(245,208,107,${(crackA*0.95).toFixed(2)}) 45.2%, transparent 45.8%)`,
    `linear-gradient(-38deg, transparent 58%,  rgba(225,168,22,${(crackA*0.72).toFixed(2)})    58.6%, transparent 59.3%)`,
    `linear-gradient(68deg,  transparent 70%,  rgba(255,242,150,${(crackA*0.58).toFixed(2)})   70.4%, transparent 70.9%)`,
    'linear-gradient(152deg, #1c1a2a, #24203c, #1a1826)',
  ].join(', ')
  return { bg, bdrColor, glow, shineClass: 'kintsugi-shine' }
}

// ── Cores de texto adaptadas ao fundo metálico ───────────────────────────────

function txt(sl: 'N1' | 'N2' | 'N3', state: 'active' | 'achieved' | 'locked') {
  if (state === 'locked') return {
    body:    'rgb(var(--color-muted))',
    label:   'rgb(var(--color-dim))',
    value:   'rgb(var(--color-muted))',
    accent:  'rgb(var(--color-dim))',
  }
  // active / achieved — fundo metálico escuro, precisa de texto claro
  if (sl === 'N2') return {        // prata — tom frio
    body:    'rgba(218,228,245,0.92)',
    label:   'rgba(185,200,225,0.75)',
    value:   'rgba(210,220,238,0.90)',
    accent:  'rgba(165,185,215,0.80)',
  }
  if (sl === 'N1') return {        // bronze — tom quente
    body:    'rgba(252,238,212,0.92)',
    label:   'rgba(230,195,140,0.75)',
    value:   'rgba(245,225,190,0.90)',
    accent:  'rgba(210,170,100,0.80)',
  }
  return {                         // ouro
    body:    'rgba(255,242,210,0.92)',
    label:   'rgba(245,215,130,0.75)',
    value:   'rgba(252,235,180,0.90)',
    accent:  'rgba(225,190,80,0.80)',
  }
}

// ── Sub-nível card ────────────────────────────────────────────────────────────

function SubLevelCard({
  rank, rankNextMin, sl, state, desc, trait, bigGoal, withinPct, totalQuestions, uniqueDiscs, frenteReq,
}: {
  rank:           typeof RANKS[number]
  rankNextMin:    number
  sl:             'N1' | 'N2' | 'N3'
  state:          'active' | 'achieved' | 'locked'
  desc:           string
  trait:          string
  bigGoal:        number
  withinPct:      number
  totalQuestions: number
  uniqueDiscs?:   number
  frenteReq?:     number
}) {
  const m          = MEDAL[sl]
  const isN3Active = state === 'active' && sl === 'N3'

  // Countdown: questões até o próximo limiar
  const rankStartQ     = Math.ceil((rank.min    / 100) * bigGoal)
  const rankEndQ       = Math.ceil((rankNextMin / 100) * bigGoal)
  const span           = rankEndQ - rankStartQ
  const nextThresholdQ = sl === 'N1'
    ? rankStartQ + Math.ceil(0.50 * span)
    : sl === 'N2'
    ? rankStartQ + Math.ceil(0.90 * span)
    : rankEndQ
  const remaining      = Math.max(0, nextThresholdQ - totalQuestions)
  const nextTarget     = sl === 'N1' ? 'N2 Prata' : sl === 'N2' ? 'N3 Ouro' : 'próxima patente'

  // Taxa: active sempre vibrante (mín 55%), achieved sólido (75%), locked = ferro puro
  const effectiveTaxa = state === 'locked' ? 0 : state === 'achieved' ? 75 : Math.max(55, withinPct)
  const ks            = metalBlock(effectiveTaxa, sl)
  const shine         = state !== 'locked' && effectiveTaxa >= 72   // shimmer na cor da medalha

  const cardBorder = state === 'active'
    ? `1.5px solid ${ks.bdrColor}`
    : state === 'achieved'
    ? `1px solid ${ks.bdrColor}`
    : `1px solid rgb(var(--color-border))`

  const avatarFilter = state === 'locked' ? 'grayscale(1) opacity(0.35)' : undefined
  const textOpacity  = state === 'locked' ? 0.38 : 1
  const tc           = txt(sl, state)

  const { qFrom, qTo } = qRange(rank.min, rankNextMin, sl, bigGoal)
  const slPct          = state === 'active' ? subLevelProgress(withinPct, sl) : 0
  const nextSl         = sl === 'N1' ? 'N2 Prata' : sl === 'N2' ? 'N3 Ouro' : 'próxima patente'

  // Cor da barra de progresso concluída na paleta da medalha
  const barAchieved = sl === 'N1'
    ? 'linear-gradient(90deg, rgba(185,100,30,0.70), rgba(240,180,70,0.80))'
    : sl === 'N2'
    ? 'linear-gradient(90deg, rgba(130,138,150,0.70), rgba(200,208,218,0.80))'
    : 'linear-gradient(90deg, rgba(180,130,20,0.70), rgba(245,208,107,0.80))'

  return (
    <div
      className={`rounded-card p-5 flex flex-col gap-4 relative overflow-hidden ${isN3Active ? 'n3-pulse' : ''} ${shine ? ks.shineClass : ''}`}
      style={{ background: ks.bg, border: cardBorder, boxShadow: state === 'locked' ? undefined : ks.glow }}
    >
      {/* Status badge */}
      {state === 'active' && (
        <div
          className="absolute top-3 right-3 text-[9px] font-display font-bold tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: `${m.bg}0.22)`, color: m.color, border: `1px solid ${m.border}0.45)` }}
        >
          ◉ ATUAL
        </div>
      )}
      {state === 'achieved' && (
        <div
          className="absolute top-3 right-3 text-[9px] font-display font-bold tracking-widest px-2 py-0.5 rounded-full"
          style={{ background: `${m.bg}0.25)`, color: m.color, border: `1px solid ${m.border}0.45)` }}
        >
          ✓ CONCLUÍDA
        </div>
      )}

      {/* Avatar + identidade */}
      <div className="flex items-center gap-4" style={{ opacity: textOpacity }}>
        <div className="text-[42px] leading-none select-none shrink-0" style={{ filter: avatarFilter }}>
          {rank.avatar}
        </div>
        <div>
          <div
            className="font-display font-bold tracking-widest leading-none"
            style={{ fontSize: 22, color: m.color, letterSpacing: '0.15em' }}
          >
            {rank.name}
          </div>
          <div
            className="mt-1 tracking-widest"
            style={{ fontSize: 16, color: m.color, opacity: state === 'locked' ? 0.4 : 0.75 }}
          >
            {rank.insig}
          </div>
        </div>
      </div>

      {/* Medal badge */}
      <div className="flex items-center gap-2 flex-wrap" style={{ opacity: textOpacity }}>
        <span className="text-[15px] leading-none select-none">{state === 'locked' ? '🔒' : m.icon}</span>
        <span
          className="font-display font-bold text-[10px] tracking-widest px-2.5 py-1 rounded-sm"
          style={{
            background: `${m.bg}0.18)`,
            color:      m.color,
            border:     `1px solid ${m.border}0.38)`,
          }}
        >
          {sl} · {m.label}
        </span>
      </div>

      {/* Descrição */}
      <p className="text-[12px] leading-relaxed flex-1" style={{ color: tc.body, opacity: textOpacity }}>
        {desc}
      </p>

      {/* ── Painel de status unificado ───────────────────────────────── */}
      {state === 'active' ? (
        <div className="rounded-sm px-3.5 py-3 space-y-1.5" style={{ background: `${m.bg}0.14)`, border: `1px solid ${m.border}0.35)` }}>
          <div className="font-display font-bold text-[8px] tracking-widest uppercase" style={{ color: tc.label }}>
            🎯 Missão
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-black tabular-nums leading-none" style={{ fontSize: 30, color: m.color }}>
              {remaining.toLocaleString()}
            </span>
            <span className="text-[11px] leading-tight" style={{ color: tc.value }}>
              questões para<br />{nextTarget}
            </span>
          </div>
          {frenteReq !== undefined && uniqueDiscs !== undefined && (() => {
            const deficit = frenteReq - uniqueDiscs
            if (deficit > 0) return (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span style={{ color: tc.label, fontSize: 9 }}>⚠</span>
                <span className="font-display font-bold text-[9px] tracking-widest" style={{ color: tc.accent }}>
                  +{deficit} frente{deficit > 1 ? 's' : ''} necessária{deficit > 1 ? 's' : ''}
                </span>
                <span className="text-[9px] tabular-nums ml-auto" style={{ color: tc.label }}>
                  {uniqueDiscs}/{frenteReq}
                </span>
              </div>
            )
            return (
              <div className="flex items-center gap-1.5 pt-0.5">
                <span style={{ color: m.color, fontSize: 9 }}>✓</span>
                <span className="text-[9px] tracking-wide" style={{ color: tc.accent }}>
                  frentes OK
                </span>
                <span className="text-[9px] tabular-nums ml-auto" style={{ color: tc.label }}>
                  {uniqueDiscs}/{frenteReq}
                </span>
              </div>
            )
          })()}
        </div>
      ) : state === 'achieved' ? (
        <div className="rounded-sm px-3.5 py-3 space-y-1.5" style={{ background: `${m.bg}0.14)`, border: `1px solid ${m.border}0.30)` }}>
          <div className="font-display font-bold text-[8px] tracking-widest uppercase" style={{ color: tc.label }}>
            ✓ Concluído
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-black tabular-nums leading-none" style={{ fontSize: 30, color: m.color }}>
              {qTo.toLocaleString()}
            </span>
            <span className="text-[11px] leading-tight" style={{ color: tc.value }}>
              questões<br />superadas
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-sm px-3.5 py-3 space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid rgb(var(--color-border))` }}>
          <div className="font-display font-bold text-[8px] tracking-widest uppercase" style={{ color: 'rgb(var(--color-dim))' }}>
            🔒 Requisito
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-black tabular-nums leading-none" style={{ fontSize: 30, color: 'rgb(var(--color-dim))' }}>
              {qFrom.toLocaleString()}
            </span>
            <span className="text-[11px] leading-tight" style={{ color: 'rgb(var(--color-dim))' }}>
              questões para<br />desbloquear
            </span>
          </div>
        </div>
      )}

      {/* ── Perfil de combate ────────────────────────────────────────── */}
      <div className="space-y-2.5" style={{ opacity: textOpacity }}>
        <div className="h-px" style={{ background: state === 'locked' ? 'rgb(var(--color-border))' : `${m.border}0.30)` }} />

        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <div className="font-display font-bold text-[8px] tracking-widest uppercase mb-0.5" style={{ color: tc.label }}>
              ⚡ Traço
            </div>
            <div className="text-[10px] font-bold leading-tight" style={{ color: tc.value }}>
              {trait}
            </div>
          </div>
          <div>
            <div className="font-display font-bold text-[8px] tracking-widest uppercase mb-0.5" style={{ color: tc.label }}>
              📊 Questões
            </div>
            <div className="text-[10px] tabular-nums" style={{ color: tc.value }}>
              {state === 'locked'
                ? `a partir de ${qFrom.toLocaleString()}`
                : `${qFrom.toLocaleString()} – ${qTo.toLocaleString()}`
              }
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1.5 pt-0.5">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:      state === 'achieved' ? '100%' : state === 'active' ? `${slPct}%` : '0%',
                background: state === 'achieved' ? barAchieved : ks.bdrColor,
                boxShadow:  state === 'active' ? `0 0 5px ${m.border}0.50)` : undefined,
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px]" style={{ color: tc.accent }}>
              {state === 'achieved' ? '100% concluído' : state === 'active' ? `${slPct}% neste estágio` : '0% — bloqueado'}
            </span>
            {state === 'active' && (
              <span className="text-[9px]" style={{ color: tc.accent }}>→ {nextSl}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Grupo por patente ─────────────────────────────────────────────────────────

const SL_ORDER = { N1: 0, N2: 1, N3: 2 } as const

function RankGroup({
  rank, index, currentRankIdx, currentSubLevel, bigGoal, withinPct, totalQuestions, uniqueDiscs,
}: {
  rank:            typeof RANKS[number]
  index:           number
  currentRankIdx:  number
  currentSubLevel: 'N1' | 'N2' | 'N3'
  bigGoal:         number
  withinPct:       number
  totalQuestions:  number
  uniqueDiscs:     number
}) {
  const lore         = LORE[rank.name]
  const subDesc      = RANK_SUB_DESC[rank.name]
  const subTraits    = RANK_SUB_TRAITS[rank.name]
  const isFuture     = index > currentRankIdx
  const isPastRank   = index < currentRankIdx
  const rankNextMin  = RANKS[index + 1]?.min ?? 100
  const currentOrder = currentRankIdx * 3 + SL_ORDER[currentSubLevel]

  return (
    <div className="space-y-2">
      {/* Rank header */}
      <div
        className="flex items-center gap-3 px-1 py-0.5"
        style={{ opacity: isFuture ? 0.4 : 1 }}
      >
        <span
          className="text-[26px] leading-none select-none"
          style={{ filter: isFuture ? 'grayscale(0.8)' : undefined }}
        >
          {rank.avatar}
        </span>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span
            className="font-display font-bold tracking-widest"
            style={{ fontSize: 15, color: isFuture ? 'rgb(var(--color-muted))' : rank.color, letterSpacing: '0.16em' }}
          >
            {rank.name}
          </span>
          <span className="text-muted text-[10px]">{lore.range} da meta</span>
          <span className="text-[10px]" style={{ color: 'rgb(var(--color-dim))' }}>·</span>
          <span className="text-[10px]" style={{ color: 'rgb(var(--color-dim))' }}>{lore.requisito}</span>
        </div>
        {isPastRank && (
          <span
            className="ml-auto font-display font-bold text-[8px] tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(74,124,89,0.14)', color: 'rgba(106,180,120,0.85)', border: '1px solid rgba(74,124,89,0.28)' }}
          >
            ✓ SUPERADA
          </span>
        )}
      </div>

      {/* 3 sub-level cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['N1', 'N2', 'N3'] as const).map(sl => {
          const cardOrder = index * 3 + SL_ORDER[sl]
          const state: 'active' | 'achieved' | 'locked' =
            cardOrder === currentOrder ? 'active' :
            cardOrder  <  currentOrder ? 'achieved' : 'locked'

          return (
            <SubLevelCard
              key={sl}
              rank={rank}
              rankNextMin={rankNextMin}
              sl={sl}
              state={state}
              desc={subDesc[sl]}
              trait={subTraits[sl]}
              bigGoal={bigGoal}
              withinPct={withinPct}
              totalQuestions={totalQuestions}
              uniqueDiscs={state === 'active' ? uniqueDiscs : undefined}
              frenteReq={state === 'active' ? (FRENTE_REQ[rank.name]?.[sl] ?? 1) : undefined}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Barra de posição geral ────────────────────────────────────────────────────

function ProgressLadder({ goalPct }: { goalPct: number }) {
  return (
    <div className="bg-surface border border-border rounded-card p-5 space-y-3">
      <div className="font-display font-bold text-muted uppercase" style={{ fontSize: 11, letterSpacing: '0.22em' }}>
        Posição na escala de comando
      </div>
      <div className="relative h-5">
        <div className="absolute inset-y-[7px] inset-x-0 rounded-full overflow-hidden" style={{ background: 'rgb(var(--color-surface3))' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${goalPct}%`,
              background: goalPct >= 80
                ? 'linear-gradient(90deg, #4a7c59, #d4a017, #f5d06b)'
                : goalPct >= 50
                ? 'linear-gradient(90deg, #4a7c59, #d4a017)'
                : 'linear-gradient(90deg, #3a6648, #4a7c59)',
            }}
          />
        </div>
        {RANKS.filter(r => r.min > 0).map(r => (
          <div
            key={r.name}
            className="absolute top-0 bottom-0 flex items-center justify-center"
            style={{ left: `${r.min}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-0.5 h-5 rounded-full" style={{ background: goalPct >= r.min ? r.color : 'rgb(var(--color-border))' }} />
          </div>
        ))}
        <div
          className="absolute top-0 bottom-0 flex items-center z-10 transition-all duration-1000"
          style={{ left: `${Math.min(goalPct, 99)}%`, transform: 'translateX(-50%)' }}
        >
          <div
            className="w-4 h-4 rounded-full border-2 border-bg"
            style={{ background: '#f5d06b', boxShadow: '0 0 0 3px rgba(212,160,23,0.40), 0 0 12px rgba(212,160,23,0.55)' }}
          />
        </div>
      </div>
      <div className="relative h-5">
        {RANKS.map((r, i) => {
          const nextMin = RANKS[i + 1]?.min ?? 100
          const center  = r.min + (nextMin - r.min) / 2
          return (
            <span
              key={r.name}
              className="absolute font-display font-bold text-[8px] tracking-wider whitespace-nowrap -translate-x-1/2"
              style={{ left: `${center}%`, color: goalPct >= r.min ? r.color : 'rgb(var(--color-dim))', opacity: goalPct >= r.min ? 1 : 0.45 }}
            >
              {r.name}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ── Legenda de sub-níveis ─────────────────────────────────────────────────────

function SubLevelLegend({ current }: { current: 'N1' | 'N2' | 'N3' }) {
  const entries = [
    { sl: 'N1' as const, range: '0–49%',  desc: 'Acabou de ser promovido. O novo campo ainda é desconhecido.' },
    { sl: 'N2' as const, range: '50–89%', desc: 'Completou metade do trajeto. O padrão começa a se consolidar.' },
    { sl: 'N3' as const, range: '90–99%', desc: 'Falta apenas 10% para a promoção. O card pulsa em ouro — iminente.' },
  ]
  return (
    <div className="bg-surface border border-border rounded-card p-5 space-y-3">
      <div className="font-display font-bold text-muted uppercase" style={{ fontSize: 11, letterSpacing: '0.22em' }}>
        Sistema de Sub-Níveis
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {entries.map(({ sl, range, desc }) => {
          const m        = MEDAL[sl]
          const isActive = current === sl
          return (
            <div
              key={sl}
              className="rounded-sm p-3 space-y-1.5"
              style={{
                background: isActive ? `${m.bg}0.12)` : 'transparent',
                border:     `1px solid ${isActive ? `${m.border}0.45)` : 'rgb(var(--color-border))'}`,
                opacity:    isActive ? 1 : 0.55,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[16px] leading-none">{m.icon}</span>
                <span className="font-display font-bold text-[10px] tracking-widest uppercase" style={{ color: m.color }}>
                  {sl} · {m.label}
                </span>
                <span className="ml-auto text-[9px] tabular-nums text-muted">{range}</span>
              </div>
              <p className="text-[10.5px] leading-relaxed text-muted">{desc}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function Patentes() {
  const rank         = useRank()
  const config       = useStore(s => s.config)
  const sessionStats = useStore(s => s.sessionStats)
  const uniqueDiscs  = new Set(sessionStats.map(s => s.disc).filter(Boolean)).size

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="font-display font-bold text-text" style={{ fontSize: 28, letterSpacing: '0.12em' }}>
            ESCALA DE PATENTES
          </div>
          <div className="text-muted text-[12px] mt-1">
            {RANKS.length} patentes · {RANKS.length * 3} estágios · meta de {config.big_goal.toLocaleString()} questões · {rank.totalReviews.toLocaleString()} cards revisados
          </div>
        </div>

        {/* Patente atual */}
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-card ${rank.subLevel === 'N3' ? 'n3-pulse' : ''}`}
          style={{
            background: 'linear-gradient(135deg, #1c1a2a, #24203c)',
            border:     rank.subLevel === 'N3' ? '1.5px solid rgba(245,208,107,0.65)' : '1.5px solid rgba(212,160,23,0.40)',
            boxShadow:  '0 0 20px rgba(212,160,23,0.15)',
          }}
        >
          <span className="text-[28px] leading-none">{rank.avatar}</span>
          <div>
            <div className="font-display font-bold" style={{ fontSize: 18, color: rank.color, letterSpacing: '0.15em' }}>
              {rank.insig} {rank.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px]" style={{ color: 'rgba(212,160,23,0.55)' }}>
                {rank.goalPct}% · {rank.total.toLocaleString()}q
              </span>
              <span
                className="font-display font-bold text-[8px] tracking-widest px-1.5 py-0.5 rounded-sm"
                style={{
                  background: `${MEDAL[rank.subLevel].bg}0.20)`,
                  color:       MEDAL[rank.subLevel].color,
                  border:      `1px solid ${MEDAL[rank.subLevel].border}0.45)`,
                }}
              >
                {rank.subLevel} · {MEDAL[rank.subLevel].label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de posição */}
      <ProgressLadder goalPct={rank.goalPct} />

      {/* Legenda sub-níveis */}
      <SubLevelLegend current={rank.subLevel} />

      {/* 24 cards agrupados por patente */}
      <div className="space-y-5">
        {RANKS.map((r, i) => (
          <RankGroup
            key={r.name}
            rank={r}
            index={i}
            currentRankIdx={rank.index}
            currentSubLevel={rank.subLevel}
            bigGoal={config.big_goal}
            withinPct={rank.withinPct}
            totalQuestions={rank.total}
            uniqueDiscs={uniqueDiscs}
          />
        ))}
      </div>

    </div>
  )
}
