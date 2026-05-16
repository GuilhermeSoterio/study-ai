import { useState } from 'react'
import { useStore } from '@/store'
import type { RankCardElo } from '@/types'

const ELOS: { elo: RankCardElo; label: string; color: string; range: string }[] = [
  { elo: 'Platina', label: 'Platina', color: 'border-cyan-400/60 bg-cyan-400/10 text-cyan-400',    range: '11+ questões' },
  { elo: 'Ouro',    label: 'Ouro',    color: 'border-amber-400/60 bg-amber-400/10 text-amber-400', range: '6–10 questões' },
  { elo: 'Prata',   label: 'Prata',   color: 'border-slate-400/60 bg-slate-400/10 text-slate-400', range: '4–5 questões' },
  { elo: 'Bronze',  label: 'Bronze',  color: 'border-orange-600/60 bg-orange-600/10 text-orange-500', range: '2–3 questões' },
]

export function RankCardCreate() {
  const addRankCard = useStore(s => s.addRankCard)
  const userId = useStore(s => s.userId)

  const [disciplina,    setDisciplina]    = useState('')
  const [materia,       setMateria]       = useState('')
  const [modalidade,    setModalidade]    = useState('EloCards de Alta Incidência')
  const [elo,           setElo]           = useState<RankCardElo>('Ouro')
  const [blocoTematico, setBlocoTematico] = useState('')
  const [prioridade,    setPrioridade]    = useState(1)
  const [incidencia,    setIncidencia]    = useState(1)
  const [q,             setQ]             = useState('')
  const [a,             setA]             = useState('')
  const [saved,         setSaved]         = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !q.trim() || !a.trim() || !disciplina.trim() || !blocoTematico.trim()) return

    addRankCard({
      id:             crypto.randomUUID(),
      user_id:        userId,
      ts:             Date.now(),
      disciplina:     disciplina.trim(),
      materia:        materia.trim(),
      modalidade:     modalidade.trim() || 'EloCards de Alta Incidência',
      elo,
      bloco_tematico: blocoTematico.trim(),
      prioridade,
      incidencia,
      q:              q.trim(),
      a:              a.trim(),
      reviews:        [],
    })

    setQ('')
    setA('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const selectedElo = ELOS.find(e => e.elo === elo)!

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-card p-6 space-y-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
          Novo EloCard
        </div>

        {/* Disciplina + Matéria */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Disciplina</label>
            <input
              value={disciplina}
              onChange={e => setDisciplina(e.target.value)}
              placeholder="Ex: Direito Constitucional"
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400/60"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Matéria</label>
            <input
              value={materia}
              onChange={e => setMateria(e.target.value)}
              placeholder="Ex: Poder Judiciário"
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400/60"
            />
          </div>
        </div>

        {/* Modalidade */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Modalidade</label>
          <input
            value={modalidade}
            onChange={e => setModalidade(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400/60"
          />
        </div>

        {/* Elo selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Elo</label>
          <div className="grid grid-cols-4 gap-2">
            {ELOS.map(e => (
              <button
                key={e.elo}
                type="button"
                onClick={() => setElo(e.elo)}
                className={`py-2 px-1 rounded-sm border text-[12px] font-bold transition-all ${
                  elo === e.elo ? e.color : 'border-border text-muted hover:border-border/80'
                }`}
              >
                <div>{e.label}</div>
                <div className="text-[10px] font-normal opacity-70">{e.range}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Bloco Temático + Prioridade + Incidência */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Bloco Temático</label>
            <input
              value={blocoTematico}
              onChange={e => setBlocoTematico(e.target.value)}
              placeholder="Ex: Dever de Fundamentação e Publicidade"
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400/60"
              required
            />
          </div>
          <div className="space-y-1.5 w-24">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Prioridade</label>
            <input
              type="number" min={1} value={prioridade}
              onChange={e => setPrioridade(Number(e.target.value))}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400/60"
            />
          </div>
          <div className="space-y-1.5 w-28">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Incidência</label>
            <input
              type="number" min={1} value={incidencia}
              onChange={e => setIncidencia(Number(e.target.value))}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400/60"
            />
          </div>
        </div>

        {/* Preview do elo selecionado */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-sm border ${selectedElo.color} text-[11px]`}>
          <span className="font-bold">{selectedElo.label}</span>
          <span className="opacity-70">·</span>
          <span>{blocoTematico || 'Bloco Temático'}</span>
          <span className="opacity-70">·</span>
          <span>{incidencia}x em provas</span>
        </div>

        {/* Q / A */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Pergunta / Frente</label>
          <textarea
            value={q}
            onChange={e => setQ(e.target.value)}
            rows={3}
            placeholder="Digite a pergunta ou conceito..."
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400/60 resize-none"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Resposta / Verso</label>
          <textarea
            value={a}
            onChange={e => setA(e.target.value)}
            rows={5}
            placeholder="Digite a resposta ou gabarito comentado..."
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-amber-400/60 resize-none"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm rounded-sm hover:opacity-90 transition-opacity"
          >
            Salvar EloCard
          </button>
          {saved && (
            <span className="text-success text-sm font-semibold animate-pulse">
              ✓ Card salvo!
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
