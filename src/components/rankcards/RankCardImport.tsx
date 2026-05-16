import { useState } from 'react'
import { useStore } from '@/store'
import type { RankCard, RankCardElo } from '@/types'

const VALID_ELOS: RankCardElo[] = ['Platina', 'Ouro', 'Prata', 'Bronze']

const ELO_STYLE: Record<RankCardElo, string> = {
  Platina: 'text-cyan-400 border-cyan-400/40 bg-cyan-400/10',
  Ouro:    'text-amber-400 border-amber-400/40 bg-amber-400/10',
  Prata:   'text-slate-400 border-slate-400/40 bg-slate-400/10',
  Bronze:  'text-orange-500 border-orange-600/40 bg-orange-600/10',
}

const ELO_ICON: Record<RankCardElo, string> = {
  Platina: '◆', Ouro: '★', Prata: '▲', Bronze: '●',
}

interface ParsedDeck {
  disciplina: string
  materia: string
  modalidade: string
  cards: RankCard[]
}

interface ParseError {
  message: string
  detail?: string
}

function parseJSON(raw: string, userId: string): ParsedDeck | ParseError {
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { message: 'JSON inválido', detail: 'Verifique se o texto colado é um JSON bem formado.' }
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { message: 'Estrutura inválida', detail: 'O JSON deve ser um objeto com os campos disciplina e cards.' }
  }

  const obj = data as Record<string, unknown>

  if (!obj.disciplina || typeof obj.disciplina !== 'string') {
    return { message: 'Campo obrigatório ausente', detail: '"disciplina" deve ser uma string não vazia.' }
  }

  if (Array.isArray(obj.data_structure)) {
    return {
      message: 'Este JSON é a estrutura do deck (metadados)',
      detail: 'Você colou o JSON de organização por elos e blocos, mas ele não contém perguntas nem respostas. Peça à IA para gerar o JSON com os cards completos (campo "cards" com "q" e "a" em cada item).',
    }
  }

  if (!Array.isArray(obj.cards) || obj.cards.length === 0) {
    return { message: 'Sem cards', detail: '"cards" deve ser um array não vazio com os campos q, a, elo e bloco_tematico.' }
  }

  const cards: RankCard[] = []
  for (let i = 0; i < obj.cards.length; i++) {
    const raw = obj.cards[i] as Record<string, unknown>
    if (typeof raw !== 'object' || raw === null) {
      return { message: `Card ${i + 1} inválido`, detail: 'Cada item do array cards deve ser um objeto.' }
    }
    if (!VALID_ELOS.includes(raw.elo as RankCardElo)) {
      return {
        message: `Card ${i + 1}: elo inválido`,
        detail: `"${raw.elo}" não é um elo válido. Use: Platina, Ouro, Prata ou Bronze.`,
      }
    }
    if (!raw.q || typeof raw.q !== 'string' || !raw.q.trim()) {
      return { message: `Card ${i + 1}: campo "q" ausente ou vazio`, detail: 'Cada card precisa de uma pergunta (q).' }
    }
    if (!raw.a || typeof raw.a !== 'string' || !raw.a.trim()) {
      return { message: `Card ${i + 1}: campo "a" ausente ou vazio`, detail: 'Cada card precisa de uma resposta (a).' }
    }

    cards.push({
      id:             crypto.randomUUID(),
      user_id:        userId,
      ts:             Date.now() + i,
      disciplina:     String(obj.disciplina).trim(),
      materia:        typeof obj.materia === 'string' ? obj.materia.trim() : '',
      modalidade:     typeof obj.modalidade === 'string' ? obj.modalidade.trim() : 'EloCards de Alta Incidência',
      elo:            raw.elo as RankCardElo,
      bloco_tematico: typeof raw.bloco_tematico === 'string' ? raw.bloco_tematico.trim() : '',
      prioridade:     typeof raw.prioridade === 'number' ? raw.prioridade : 1,
      incidencia:     typeof raw.incidencia === 'number' ? raw.incidencia : 1,
      q:              raw.q.trim(),
      a:              (raw.a as string).trim(),
      reviews:        [],
    })
  }

  return {
    disciplina: String(obj.disciplina).trim(),
    materia:    typeof obj.materia === 'string' ? obj.materia.trim() : '',
    modalidade: typeof obj.modalidade === 'string' ? obj.modalidade.trim() : 'EloCards de Alta Incidência',
    cards,
  }
}

type Step = 'input' | 'preview' | 'done'

export function RankCardImport({ onViewBank }: { onViewBank: () => void }) {
  const addRankCards = useStore(s => s.addRankCards)
  const userId = useStore(s => s.userId)

  const [step,    setStep]    = useState<Step>('input')
  const [raw,     setRaw]     = useState('')
  const [deck,    setDeck]    = useState<ParsedDeck | null>(null)
  const [error,   setError]   = useState<ParseError | null>(null)
  const [loading, setLoading] = useState(false)
  const [imported, setImported] = useState(0)

  function handleAnalyze() {
    if (!userId) return
    setError(null)
    const result = parseJSON(raw, userId)
    if ('message' in result) {
      setError(result)
      setDeck(null)
    } else {
      setDeck(result)
      setStep('preview')
    }
  }

  function handleImport() {
    if (!deck) return
    setLoading(true)
    addRankCards(deck.cards)
    setImported(deck.cards.length)
    setStep('done')
    setLoading(false)
  }

  function handleReset() {
    setStep('input')
    setRaw('')
    setDeck(null)
    setError(null)
    setImported(0)
  }

  // ── DONE ──
  if (step === 'done') {
    return (
      <div className="max-w-2xl mx-auto bg-surface border border-border rounded-card p-10 text-center space-y-4">
        <div className="text-5xl">🏅</div>
        <div className="text-xl font-bold text-text">
          {imported} EloCard{imported !== 1 ? 's' : ''} importado{imported !== 1 ? 's' : ''}!
        </div>
        <div className="text-sm text-muted">
          Os cards já estão disponíveis no Banco e prontos para revisão.
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <button
            onClick={onViewBank}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm rounded-sm hover:opacity-90 transition-opacity"
          >
            Ver Banco →
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 border border-border text-muted text-sm rounded-sm hover:text-text transition-colors"
          >
            Importar outro
          </button>
        </div>
      </div>
    )
  }

  // ── PREVIEW ──
  if (step === 'preview' && deck) {
    const byElo = VALID_ELOS.map(elo => ({
      elo,
      count: deck.cards.filter(c => c.elo === elo).length,
    })).filter(e => e.count > 0)

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Cabeçalho do deck */}
        <div className="bg-surface border border-border rounded-card p-4 space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Deck detectado</div>
          <div className="text-base font-bold text-text">{deck.disciplina}</div>
          {deck.materia && <div className="text-sm text-muted">{deck.materia}</div>}
          <div className="text-[11px] text-dim">{deck.modalidade}</div>
        </div>

        {/* Resumo por elo */}
        <div className="grid grid-cols-4 gap-2">
          {byElo.map(({ elo, count }) => (
            <div key={elo} className={`rounded-card border px-3 py-2 text-center ${ELO_STYLE[elo]}`}>
              <div className="text-[11px] font-bold">{elo}</div>
              <div className="text-lg font-black">{count}</div>
              <div className="text-[10px] opacity-70">card{count !== 1 ? 's' : ''}</div>
            </div>
          ))}
        </div>

        <div className="text-[12px] font-bold text-text">
          Total: {deck.cards.length} cards
        </div>

        {/* Preview dos primeiros 5 */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-widest text-muted">Prévia</div>
          {deck.cards.slice(0, 5).map((card, i) => (
            <div key={i} className="flex items-start gap-2 bg-surface border border-border rounded-sm px-3 py-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${ELO_STYLE[card.elo]}`}>
                {ELO_ICON[card.elo]} {card.elo}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-muted truncate">{card.bloco_tematico}</div>
                <div className="text-[12px] text-text line-clamp-1">{card.q}</div>
              </div>
            </div>
          ))}
          {deck.cards.length > 5 && (
            <div className="text-[11px] text-dim px-1">+ {deck.cards.length - 5} cards adicionais</div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            onClick={handleImport}
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Importando…' : `Importar ${deck.cards.length} cards`}
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2.5 border border-border text-muted text-sm rounded-sm hover:text-text transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>
    )
  }

  // ── INPUT ──
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="bg-surface border border-border rounded-card p-6 space-y-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted">
          Importar deck via JSON
        </div>

        <div className="bg-surface2 border border-border/60 rounded-sm p-3 text-[11px] text-muted space-y-1">
          <div className="font-bold text-text mb-1">Formato esperado:</div>
          <pre className="text-[10px] leading-relaxed overflow-x-auto">{`{
  "disciplina": "Direito Constitucional",
  "materia": "Poder Judiciário",
  "modalidade": "EloCards de Alta Incidência",
  "cards": [
    {
      "elo": "Platina",
      "bloco_tematico": "Dever de Fundamentação",
      "prioridade": 1,
      "incidencia": 13,
      "q": "Pergunta...",
      "a": "Resposta..."
    }
  ]
}`}</pre>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">
            Cole o JSON aqui
          </label>
          <textarea
            value={raw}
            onChange={e => { setRaw(e.target.value); setError(null) }}
            rows={12}
            placeholder='{ "disciplina": "...", "cards": [...] }'
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-[12px] font-mono text-text focus:outline-none focus:border-amber-400/60 resize-y"
          />
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-sm px-4 py-3 space-y-1">
            <div className="text-[12px] font-bold text-danger">{error.message}</div>
            {error.detail && <div className="text-[11px] text-danger/80">{error.detail}</div>}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!raw.trim()}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm rounded-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Analisar JSON →
        </button>
      </div>
    </div>
  )
}
