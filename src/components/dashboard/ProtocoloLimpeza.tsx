import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store'
import { isDue, calcNextDue } from '@/lib/srs'
import type { Flashcard } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PurgeTarget {
  disc:            string
  mat:             string
  total:           number
  correct:         number
  effectiveTaxa:   number
  errorsRemaining: number
}

type Phase = 'briefing' | 'challenge' | 'success' | 'fail'

// ── Helpers ───────────────────────────────────────────────────────────────────

function AnimCounter({ to, duration = 800 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let frame = 0
    const steps = Math.max(1, Math.round(duration / 40))
    const step  = to / steps
    const id = setInterval(() => {
      frame++
      setVal(Math.min(to, Math.round(step * frame)))
      if (frame >= steps) clearInterval(id)
    }, 40)
    return () => clearInterval(id)
  }, [to, duration])
  return <>{val}</>
}

// ── Inline card view ──────────────────────────────────────────────────────────

function InlineCardView({ card, onRate }: {
  card:   Flashcard
  onRate: (r: 1 | 2 | 3, correct: boolean) => void
}) {
  const [flipped,  setFlipped]  = useState(false)
  const [acertou,  setAcertou]  = useState<boolean | null>(null)
  const [editing,  setEditing]  = useState(false)
  const [editQ,    setEditQ]    = useState(card.q)
  const [editA,    setEditA]    = useState(card.a)
  const updateFlashcard = useStore(s => s.updateFlashcard)

  function openEdit() { setEditQ(card.q); setEditA(card.a); setEditing(true) }

  function saveEdit() {
    const q = editQ.trim(); const a = editA.trim()
    if (!q || !a) return
    updateFlashcard(card.id, { q, a })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(165,150,125,0.80)' }}>Editar flashcard</span>
          <button onClick={() => setEditing(false)} className="text-[13px] opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'rgba(238,228,208,0.90)' }}>✕</button>
        </div>
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'rgba(165,150,125,0.65)' }}>Pergunta</div>
          <textarea
            value={editQ} onChange={e => setEditQ(e.target.value)} rows={5}
            className="w-full rounded-lg px-3 py-2 text-[11px] resize-y outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(238,228,208,0.90)' }}
          />
        </div>
        <div className="space-y-1">
          <div className="text-[9px] uppercase tracking-wider font-bold" style={{ color: 'rgba(165,150,125,0.65)' }}>Resposta</div>
          <textarea
            value={editA} onChange={e => setEditA(e.target.value)} rows={3}
            className="w-full rounded-lg px-3 py-2 text-[11px] resize-y outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(238,228,208,0.90)' }}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(165,150,125,0.85)' }}
          >
            Cancelar
          </button>
          <button
            onClick={saveEdit} disabled={!editQ.trim() || !editA.trim()}
            className="flex-1 py-2 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, rgba(74,124,89,0.60), rgba(60,100,75,0.70))', border: '1px solid rgba(74,124,89,0.55)', color: 'rgba(160,220,180,0.95)' }}
          >
            Salvar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <button
          onClick={openEdit}
          className="absolute top-2 right-2 z-20 w-6 h-6 flex items-center justify-center rounded text-[11px] transition-all"
          style={{ color: 'rgba(165,150,125,0.50)', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(238,228,208,0.90)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(165,150,125,0.50)')}
          title="Editar flashcard"
        >
          ✏
        </button>
        <div
          className="cursor-pointer select-none"
          style={{ perspective: '1000px' }}
          onClick={() => { if (!flipped) setFlipped(true) }}
        >
          <div
            className="w-full transition-all duration-500"
            style={{ display: 'grid', transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            {/* Frente */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ gridArea: '1/1', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'rgba(165,150,125,0.65)' }}>
                {card.disc} › {card.mat}
              </div>
              <div className="text-[12px] leading-relaxed font-medium whitespace-pre-wrap" style={{ color: 'rgba(238,228,208,0.90)' }}>
                {card.q}
              </div>
              <div className="text-[10px] text-center mt-auto pt-1" style={{ color: 'rgba(165,150,125,0.45)' }}>
                Clique para revelar
              </div>
            </div>

            {/* Verso */}
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{ gridArea: '1/1', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'rgba(74,124,89,0.10)', border: '1px solid rgba(74,124,89,0.32)' }}
            >
              <div className="text-[9px] font-bold tracking-wider uppercase" style={{ color: 'rgba(106,180,120,0.70)' }}>
                Resposta
              </div>
              <div className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(238,228,208,0.90)' }}>
                {card.a}
              </div>
              <div className="text-[10px] text-center mt-auto pt-1" style={{ color: 'rgba(165,150,125,0.45)' }}>
                Você acertou?
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Etapa 1: Acertei / Errei */}
      {flipped && acertou === null && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setAcertou(true) }}
            className="py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-[12px] transition-all hover:brightness-125 active:scale-95"
            style={{ background: 'rgba(74,124,89,0.18)', border: '1px solid rgba(74,124,89,0.55)', color: 'rgba(160,220,180,0.95)' }}
          >
            ✓ Acertei
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onRate(1, false) }}
            className="py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-[12px] transition-all hover:brightness-125 active:scale-95"
            style={{ background: 'rgba(192,57,43,0.16)', border: '1px solid rgba(192,57,43,0.50)', color: 'rgba(240,100,80,0.95)' }}
          >
            ✗ Errei
          </button>
        </div>
      )}

      {/* Etapa 2: Dificuldade (só aparece após "Acertei") */}
      {flipped && acertou === true && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-center" style={{ color: 'rgba(165,150,125,0.60)' }}>
            Qual foi a dificuldade?
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { r: 3 as const, label: '😊', sub: 'Fácil',   border: 'rgba(74,124,89,0.55)',  bg: 'rgba(74,124,89,0.14)',  color: 'rgba(160,220,180,0.90)' },
              { r: 2 as const, label: '🤔', sub: 'Normal',  border: 'rgba(212,160,23,0.50)', bg: 'rgba(212,160,23,0.10)', color: 'rgba(245,208,107,0.90)' },
              { r: 1 as const, label: '😓', sub: 'Difícil', border: 'rgba(192,57,43,0.40)',  bg: 'rgba(192,57,43,0.08)',  color: 'rgba(240,140,110,0.90)' },
            ]).map(({ r, label, sub, border, bg, color }) => (
              <button
                key={r}
                type="button"
                onClick={e => { e.stopPropagation(); onRate(r, true) }}
                className="py-2.5 rounded-lg flex flex-col items-center gap-0.5 transition-all hover:brightness-125 active:scale-95"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <span className="text-[16px]">{label}</span>
                <span className="text-[9px] font-bold" style={{ color }}>{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Painel de flashcards ──────────────────────────────────────────────────────

function FlashcardPanel({ disc, mat, onAnswer, onAllDone }: {
  disc:       string
  mat:        string
  onAnswer?:  (correct: boolean) => void
  onAllDone?: () => void
}) {
  const allCards        = useStore(s => s.flashcards)
  const sessions        = useStore(s => s.sessions)
  const updateFlashcard = useStore(s => s.updateFlashcard)

  const [done, setDone] = useState(0)

  const wrongQIds = useMemo(() => {
    const ids = new Set<string>()
    for (const s of sessions) {
      if (s.correct === 0 && s.source === 'QConcursos') {
        const m = s.id.match(/Q\d{5,}/)
        if (m) ids.add(m[0])
      }
    }
    return ids
  }, [sessions])

  const isWrong = useMemo(() => (c: Flashcard) => {
    if (c.correct === false) return true
    const m = c.id.match(/Q\d{5,}/)
    return m ? wrongQIds.has(m[0]) : false
  }, [wrongQIds])

  const queue = useMemo(() => {
    const wrongDue = (cards: Flashcard[]) => cards.filter(c => isDue(c.reviews) && isWrong(c))
    const anyDue   = (cards: Flashcard[]) => cards.filter(c => isDue(c.reviews))
    const active   = allCards.filter(c => !c.ignored)
    const byMat    = active.filter(c => c.disc === disc && c.mat === mat)
    const byDisc   = active.filter(c => c.disc === disc)
    // Prioridade: errados da matéria > todos da matéria > errados da disc > todos da disc
    if (wrongDue(byMat).length > 0)  return wrongDue(byMat)
    if (anyDue(byMat).length > 0)    return anyDue(byMat)
    if (wrongDue(byDisc).length > 0) return wrongDue(byDisc)
    return anyDue(byDisc)
  }, [allCards, disc, mat, isWrong])

  const card  = queue[0] ?? null
  const total = queue.length + done

  const contextLabel = useMemo(() => {
    const wrongDue = (cards: Flashcard[]) => cards.some(c => isDue(c.reviews) && isWrong(c))
    const anyDue   = (cards: Flashcard[]) => cards.some(c => isDue(c.reviews))
    const active   = allCards.filter(c => !c.ignored)
    const byMat    = active.filter(c => c.disc === disc && c.mat === mat)
    const byDisc   = active.filter(c => c.disc === disc)
    if (wrongDue(byMat))  return `${mat} · erros`
    if (anyDue(byMat))    return `${mat}`
    if (wrongDue(byDisc)) return `${disc} · erros`
    return disc
  }, [allCards, disc, mat, isWrong])

  // Avisa o pai quando todos os cards foram respondidos
  useEffect(() => {
    if (!card && done > 0) onAllDone?.()
  }, [card, done]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRate(rating: 1 | 2 | 3, correct: boolean) {
    if (!card) return
    const nextDue = calcNextDue(card.reviews, rating)
    updateFlashcard(card.id, { reviews: [...card.reviews, { ts: Date.now(), rating, nextDue }] })
    setDone(n => n + 1)
    onAnswer?.(correct)
  }

  if (!card && done === 0) return null

  if (!card) {
    return (
      <div
        className="w-full max-w-sm rounded-2xl flex flex-col items-center justify-center gap-3 p-8 text-center self-stretch"
        style={{ background: 'linear-gradient(160deg, #1c1a2a, #24203c)', border: '1.5px solid rgba(74,124,89,0.30)' }}
      >
        <div className="text-[32px]">🎉</div>
        <div className="font-black text-[14px] tracking-wider" style={{ color: 'rgba(160,220,180,0.90)' }}>
          {done} card{done !== 1 ? 's' : ''} revisado{done !== 1 ? 's' : ''}!
        </div>
        <div className="text-[10px]" style={{ color: 'rgba(165,150,125,0.65)' }}>
          Todos os flashcards desta sessão concluídos.
        </div>
      </div>
    )
  }

  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div
      className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #1c1a2a, #24203c, #1a1826)',
        border: '1.5px solid rgba(74,124,89,0.35)',
        boxShadow: '0 0 40px rgba(74,124,89,0.07)',
      }}
    >
      <div
        className="px-5 py-3 flex items-center justify-between shrink-0"
        style={{ background: 'rgba(74,124,89,0.10)', borderBottom: '1px solid rgba(74,124,89,0.28)' }}
      >
        <div className="min-w-0">
          <div className="font-bold text-[11px] tracking-[0.18em] uppercase" style={{ color: 'rgba(160,220,180,0.90)' }}>
            📇 Flashcards
          </div>
          <div className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(165,150,125,0.70)' }}>
            {contextLabel} · {queue.length} restante{queue.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="text-[12px] font-black tabular-nums shrink-0 ml-3" style={{ color: 'rgba(160,220,180,0.65)' }}>
          {done}/{total}
        </div>
      </div>

      <div className="flex-1 px-5 py-4">
        <InlineCardView key={card.id} card={card} onRate={handleRate} />
      </div>

      <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4a7c59, #6ab478)' }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Overlay ───────────────────────────────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[9000] flex items-start lg:items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(13,11,20,0.82)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

// ── Layout duplo ──────────────────────────────────────────────────────────────

function DualLayout({ purgeCard, disc, mat, onAnswer, onAllDone }: {
  purgeCard:  React.ReactNode
  disc:       string
  mat:        string
  onAnswer?:  (correct: boolean) => void
  onAllDone?: () => void
}) {
  return (
    <div className="flex flex-col lg:flex-row items-start justify-center gap-4 w-full my-auto" style={{ maxWidth: 980 }}>
      <div className="w-full max-w-md flex-shrink-0">{purgeCard}</div>
      <FlashcardPanel disc={disc} mat={mat} onAnswer={onAnswer} onAllDone={onAllDone} />
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function ProtocoloLimpeza({ target, onClose }: {
  target:  PurgeTarget
  onClose: () => void
}) {
  const executePurge = useStore(s => s.executePurge)
  const [phase,            setPhase]            = useState<Phase>('briefing')
  const [challengeAnswers, setChallengeAnswers] = useState<boolean[]>([])
  const [result,           setResult]           = useState<{ errorsCleared: number; newTaxa: number } | null>(null)

  const { disc, mat, total, correct, effectiveTaxa, errorsRemaining } = target
  const detected     = Math.min(5, errorsRemaining)
  const needed       = 5
  const answeredCount = challengeAnswers.length
  const correctCount  = challengeAnswers.filter(Boolean).length

  function handleAnswer(isCorrect: boolean) {
    setChallengeAnswers(prev => [...prev, isCorrect])
  }

  async function confirmChallenge(answers: boolean[]) {
    const correct_ = answers.filter(Boolean).length
    const passed   = answers.length > 0 && correct_ >= Math.ceil(answers.length * 0.8)
    if (passed) {
      // Clear the full detected block on pass, not just the challenge correct count
      const errorsCleared  = detected
      // Base newTaxa on effectiveTaxa so prior purge credits are included
      const prevEffective  = Math.round(effectiveTaxa * total / 100)
      const newEffective   = Math.min(total, prevEffective + errorsCleared)
      const newTaxa        = Math.round(newEffective / total * 100)
      setResult({ errorsCleared, newTaxa })
      setPhase('success')
      await executePurge({ disc, mat, errorsCleared, challengeCorrect: correct_ })
    } else {
      setPhase('fail')
    }
  }

  // Auto-confirma quando atinge 5 respostas ou quando os cards acabam
  useEffect(() => {
    if (phase !== 'challenge') return
    if (challengeAnswers.length >= needed) confirmChallenge(challengeAnswers)
  }, [challengeAnswers, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAllDone() {
    if (phase !== 'challenge' || challengeAnswers.length >= needed) return
    // Todos os cards disponíveis foram respondidos (menos de 5)
    confirmChallenge(challengeAnswers)
  }

  // ── Briefing ──────────────────────────────────────────────────────────────

  if (phase === 'briefing') return (
    <Overlay onClose={onClose}>
      <DualLayout disc={disc} mat={mat} purgeCard={
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #1c1a2a, #24203c, #1a1826)', border: '1.5px solid rgba(192,57,43,0.55)', boxShadow: '0 0 60px rgba(192,57,43,0.18)' }}
        >
          <div className="px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(192,57,43,0.14)', borderBottom: '1px solid rgba(192,57,43,0.35)' }}>
            <div className="flex items-center gap-2">
              <span className="text-[14px] animate-pulse">☢</span>
              <span className="font-display font-bold text-[11px] tracking-[0.22em] uppercase" style={{ color: 'rgba(240,180,150,0.90)' }}>
                Protocolo de Limpeza
              </span>
            </div>
            <button onClick={onClose} className="text-[16px] leading-none opacity-40 hover:opacity-80 transition-opacity" style={{ color: 'rgba(240,180,150,0.90)' }}>✕</button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="text-center space-y-1">
              <div className="font-display font-black text-[22px] tracking-widest" style={{ color: 'rgba(255,130,100,0.95)' }}>SETOR EM ALERTA</div>
              <div className="font-bold text-[13px]" style={{ color: 'rgba(238,228,208,0.90)' }}>{mat}</div>
              <div className="text-[10px] tracking-wider" style={{ color: 'rgba(165,150,125,0.75)' }}>{disc}</div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Acurácia', value: `${effectiveTaxa}%`, warn: effectiveTaxa < 70 },
                { label: 'Questões', value: total.toLocaleString(), warn: false },
                { label: 'Erros',    value: (total - correct).toLocaleString(), warn: true },
              ].map(({ label, value, warn }) => (
                <div key={label} className="rounded-lg px-3 py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${warn ? 'rgba(192,57,43,0.35)' : 'rgba(255,255,255,0.10)'}` }}>
                  <div className="font-black text-[18px] tabular-nums leading-none" style={{ color: warn ? 'rgba(240,140,110,0.95)' : 'rgba(238,228,208,0.90)' }}>{value}</div>
                  <div className="text-[9px] mt-0.5 tracking-wider uppercase" style={{ color: 'rgba(165,150,125,0.70)' }}>{label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-lg px-4 py-3 flex items-center gap-3" style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.40)' }}>
              <span className="text-[22px] shrink-0">⚠</span>
              <div>
                <div className="font-display font-black text-[12px] tracking-wider" style={{ color: 'rgba(240,160,130,0.95)' }}>
                  {detected} questão{detected !== 1 ? 'ões' : ''} crítica{detected !== 1 ? 's' : ''} detectada{detected !== 1 ? 's' : ''}
                </div>
                <div className="text-[10px] mt-0.5 leading-snug" style={{ color: 'rgba(165,150,125,0.80)' }}>
                  Revise os flashcards ao lado e marque se acertou ou errou cada um.
                </div>
              </div>
            </div>

            <div className="text-[10px] leading-relaxed text-center" style={{ color: 'rgba(165,150,125,0.70)' }}>
              Mínimo de 80% de acertos nos flashcards para executar a{' '}
              <span style={{ color: 'rgba(212,160,23,0.90)' }}>Anulação de Dano</span>.
            </div>

            <button
              onClick={() => setPhase('challenge')}
              className="w-full py-3 rounded-lg font-display font-black text-[13px] tracking-widest uppercase transition-all hover:brightness-110 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, rgba(192,57,43,0.70), rgba(160,40,30,0.80))', color: 'rgba(255,220,200,0.95)', border: '1px solid rgba(220,80,55,0.60)' }}
            >
              ⚔ Aceitar Desafio
            </button>
          </div>
        </div>
      } />
    </Overlay>
  )

  // ── Challenge ─────────────────────────────────────────────────────────────

  if (phase === 'challenge') return (
    <Overlay onClose={onClose}>
      <DualLayout disc={disc} mat={mat} onAnswer={handleAnswer} onAllDone={handleAllDone} purgeCard={
        <div
          className="w-full rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #1c1a2a, #24203c, #1a1826)', border: '1.5px solid rgba(212,160,23,0.45)', boxShadow: '0 0 50px rgba(212,160,23,0.12)' }}
        >
          <div className="px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(212,160,23,0.10)', borderBottom: '1px solid rgba(212,160,23,0.28)' }}>
            <span className="font-display font-bold text-[11px] tracking-[0.22em] uppercase" style={{ color: 'rgba(245,208,107,0.90)' }}>
              Desafio · {mat}
            </span>
            <button onClick={onClose} className="text-[16px] opacity-40 hover:opacity-80 transition-opacity" style={{ color: 'rgba(245,208,107,0.90)' }}>✕</button>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="text-center space-y-1">
              <div className="font-display font-black text-[15px] tracking-wider" style={{ color: 'rgba(238,228,208,0.90)' }}>
                Resolva os flashcards
              </div>
              <div className="font-black text-[20px]" style={{ color: 'rgba(245,208,107,0.95)' }}>{mat}</div>
              <div className="text-[10px] tracking-wider" style={{ color: 'rgba(165,150,125,0.70)' }}>
                revire cada card e marque se acertou ou errou →
              </div>
            </div>

            {/* Indicadores de resposta */}
            <div className="flex justify-center gap-2 flex-wrap py-1">
              {Array.from({ length: needed }).map((_, i) => {
                const answered = i < answeredCount
                const wasCorrect = answered ? challengeAnswers[i] : null
                return (
                  <div
                    key={i}
                    className="w-11 h-11 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all"
                    style={{
                      background: !answered
                        ? 'rgba(255,255,255,0.04)'
                        : wasCorrect
                          ? 'rgba(74,124,89,0.22)'
                          : 'rgba(192,57,43,0.20)',
                      border: `1.5px solid ${!answered ? 'rgba(255,255,255,0.12)' : wasCorrect ? 'rgba(74,124,89,0.60)' : 'rgba(192,57,43,0.55)'}`,
                    }}
                  >
                    <span className="text-[16px] font-black leading-none" style={{
                      color: !answered ? 'rgba(165,150,125,0.4)' : wasCorrect ? '#6ab478' : '#e05c4a'
                    }}>
                      {!answered ? '○' : wasCorrect ? '✓' : '✗'}
                    </span>
                    <span className="text-[8px]" style={{ color: 'rgba(165,150,125,0.45)' }}>Q{i + 1}</span>
                  </div>
                )
              })}
            </div>

            {/* Progresso */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]" style={{ color: 'rgba(165,150,125,0.80)' }}>
                <span>{answeredCount}/{needed} respondidas</span>
                <span style={{ color: correctCount >= Math.ceil(answeredCount * 0.8) && answeredCount > 0 ? '#6ab478' : 'rgba(165,150,125,0.80)' }}>
                  {correctCount} acerto{correctCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(correctCount / needed) * 100}%`,
                    background: correctCount >= Math.ceil(answeredCount * 0.8) && answeredCount > 0
                      ? 'linear-gradient(90deg, #4a7c59, #6ab478)'
                      : 'linear-gradient(90deg, rgba(192,57,43,0.7), rgba(220,80,55,0.8))',
                  }}
                />
              </div>
            </div>

            <div className="text-[10px] leading-relaxed text-center" style={{ color: 'rgba(165,150,125,0.55)' }}>
              O resultado é registrado automaticamente ao responder os flashcards →
            </div>
          </div>
        </div>
      } />
    </Overlay>
  )

  // ── Success ───────────────────────────────────────────────────────────────

  if (phase === 'success' && result) return (
    <Overlay onClose={onClose}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1c1a2a, #24203c, #1a1826)', border: '1.5px solid rgba(212,160,23,0.75)', boxShadow: '0 0 80px rgba(212,160,23,0.25), 0 0 160px rgba(212,160,23,0.10)' }}
      >
        <div className="px-6 py-3" style={{ background: 'rgba(212,160,23,0.14)', borderBottom: '1px solid rgba(212,160,23,0.35)' }}>
          <span className="font-display font-bold text-[11px] tracking-[0.22em] uppercase" style={{ color: 'rgba(245,208,107,0.90)' }}>
            Anulação de Dano
          </span>
        </div>
        <div className="px-6 py-8 space-y-6 text-center">
          <div className="space-y-2">
            <div className="text-[40px] leading-none select-none" style={{ filter: 'drop-shadow(0 0 18px rgba(212,160,23,0.60))' }}>⚡</div>
            <div className="font-display font-black text-[18px] tracking-widest uppercase" style={{ color: 'rgba(245,208,107,0.98)' }}>Dano Anulado</div>
          </div>
          <div className="rounded-xl py-5 px-4" style={{ background: 'rgba(212,160,23,0.10)', border: '1px solid rgba(212,160,23,0.38)' }}>
            <div className="font-black tabular-nums leading-none" style={{ fontSize: 52, color: 'rgba(245,208,107,0.98)' }}>
              <AnimCounter to={result.errorsCleared} />
            </div>
            <div className="text-[11px] mt-1 font-bold tracking-wider uppercase" style={{ color: 'rgba(212,160,23,0.70)' }}>
              erro{result.errorsCleared !== 1 ? 's' : ''} eliminado{result.errorsCleared !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="font-black tabular-nums text-[26px] leading-none" style={{ color: 'rgba(165,150,125,0.65)' }}>{effectiveTaxa}%</div>
              <div className="text-[9px] mt-0.5 tracking-wider" style={{ color: 'rgba(165,150,125,0.55)' }}>anterior</div>
            </div>
            <div style={{ color: 'rgba(212,160,23,0.55)', fontSize: 20 }}>→</div>
            <div className="text-center">
              <div className="font-black tabular-nums text-[32px] leading-none" style={{ color: 'rgba(245,208,107,0.98)' }}>
                <AnimCounter to={result.newTaxa} duration={1000} />%
              </div>
              <div className="text-[9px] mt-0.5 tracking-wider" style={{ color: 'rgba(212,160,23,0.70)' }}>nova acurácia</div>
            </div>
          </div>
          <div className="text-[10px] leading-relaxed" style={{ color: 'rgba(165,150,125,0.70)' }}>
            O setor <span style={{ color: 'rgba(238,228,208,0.85)' }}>{mat}</span> foi limpo.<br />
            Os erros anulados não pesarão mais no seu percentual.
          </div>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-lg font-display font-black text-[13px] tracking-widest uppercase transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, rgba(212,160,23,0.55), rgba(180,130,15,0.65))', color: 'rgba(255,240,190,0.95)', border: '1px solid rgba(212,160,23,0.50)' }}
          >
            Fechar
          </button>
        </div>
      </div>
    </Overlay>
  )

  // ── Fail ──────────────────────────────────────────────────────────────────

  return (
    <Overlay onClose={onClose}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1c1a2a, #24203c, #1a1826)', border: '1.5px solid rgba(100,90,120,0.55)', boxShadow: '0 0 40px rgba(0,0,0,0.40)' }}
      >
        <div className="px-6 py-3" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="font-display font-bold text-[11px] tracking-[0.22em] uppercase" style={{ color: 'rgba(165,150,125,0.80)' }}>
            Operação Incompleta
          </span>
        </div>
        <div className="px-6 py-8 space-y-5 text-center">
          <div className="text-[40px] leading-none select-none opacity-60">✗</div>
          <div className="space-y-1">
            <div className="font-display font-black text-[16px] tracking-wider" style={{ color: 'rgba(238,228,208,0.75)' }}>
              Limpeza não executada
            </div>
            <div className="font-black tabular-nums text-[28px]" style={{ color: 'rgba(165,150,125,0.70)' }}>
              {correctCount}/{answeredCount}
            </div>
            <div className="text-[11px]" style={{ color: 'rgba(165,150,125,0.65)' }}>
              acertos — mínimo 80% necessário
            </div>
          </div>
          <div className="text-[10px] leading-relaxed" style={{ color: 'rgba(165,150,125,0.65)' }}>
            Reforce o estudo de <span style={{ color: 'rgba(238,228,208,0.80)' }}>{mat}</span> e tente novamente quando estiver preparado.
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setChallengeAnswers([]); setPhase('challenge') }}
              className="flex-1 py-2.5 rounded-lg text-[11px] font-bold tracking-wider transition-all hover:brightness-110"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(238,228,208,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              Tentar novamente
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-[11px] font-bold tracking-wider transition-all hover:brightness-110"
              style={{ background: 'rgba(192,57,43,0.15)', color: 'rgba(240,160,130,0.85)', border: '1px solid rgba(192,57,43,0.35)' }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
