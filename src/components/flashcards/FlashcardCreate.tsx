import { useState } from 'react'
import { useStore } from '@/store'

export function FlashcardCreate() {
  const disc = useStore(s => s.disc)
  const bancas = useStore(s => s.bancas)
  const addFlashcard = useStore(s => s.addFlashcard)
  const userId = useStore(s => s.userId)

  const discNames = Object.keys(disc)
  const [selectedDisc, setSelectedDisc] = useState(discNames[0] ?? '')
  const [mat, setMat] = useState('')
  const [banca, setBanca] = useState('Não informada')
  const [q, setQ] = useState('')
  const [a, setA] = useState('')
  const [saved, setSaved] = useState(false)

  const mats = disc[selectedDisc] ?? []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !q.trim() || !a.trim()) return

    addFlashcard({
      id: crypto.randomUUID(),
      user_id: userId,
      ts: Date.now(),
      disc: selectedDisc,
      mat: mat || mats[0] || '',
      q: q.trim(),
      a: a.trim(),
      banca,
      reviews: [],
    })

    setQ('')
    setA('')
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-card p-6 space-y-4">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
          Novo Flashcard
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Disciplina</label>
            <select
              value={selectedDisc}
              onChange={e => { setSelectedDisc(e.target.value); setMat('') }}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary2"
            >
              {discNames.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Matéria</label>
            <select
              value={mat}
              onChange={e => setMat(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary2"
            >
              {mats.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Banca</label>
          <select
            value={banca}
            onChange={e => setBanca(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary2"
          >
            {bancas.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Pergunta / Frente</label>
          <textarea
            value={q}
            onChange={e => setQ(e.target.value)}
            rows={3}
            placeholder="Digite a pergunta, conceito ou enunciado..."
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary2 resize-none"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-muted">Resposta / Verso</label>
          <textarea
            value={a}
            onChange={e => setA(e.target.value)}
            rows={5}
            placeholder="Digite a resposta, explicação ou gabarito comentado..."
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary2 resize-none"
            required
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-cyan-600 text-white font-bold text-sm rounded-sm hover:opacity-90 transition-opacity"
          >
            Salvar Card
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
