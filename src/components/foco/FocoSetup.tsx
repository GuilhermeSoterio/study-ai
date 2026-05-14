import { useState } from 'react'
import { useStore } from '@/store'
import type { SprintConfig } from './types'

interface Props {
  onStart: (config: SprintConfig) => void
}

export function FocoSetup({ onStart }: Props) {
  const disc   = useStore(s => s.disc)
  const bancas = useStore(s => s.bancas)

  const [timeMinutes,   setTimeMinutes]   = useState(60)
  const [goalQuestions, setGoalQuestions] = useState(10)
  const [selectedDisc,  setSelectedDisc]  = useState('')
  const [selectedMat,   setSelectedMat]   = useState('')
  const [selectedBanca, setSelectedBanca] = useState('')
  const [tema,          setTema]          = useState('')

  const mats = selectedDisc ? (disc[selectedDisc] ?? []) : []

  const speedTarget = goalQuestions > 0 && timeMinutes > 0
    ? (timeMinutes / goalQuestions).toFixed(1)
    : null

  return (
    <div className="max-w-md mx-auto space-y-5 py-6">
      <div>
        <div className="text-[15px] font-black text-text">Modo Foco</div>
        <div className="text-[12px] text-muted mt-0.5">Configure sua sessão sprint</div>
      </div>

      <div className="bg-surface border border-border rounded-card p-4 space-y-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted">Parâmetros do Sprint</div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Tempo (min)</label>
            <input
              type="number" min={1} max={300} value={timeMinutes}
              onChange={e => setTimeMinutes(Number(e.target.value) || 60)}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Meta (questões)</label>
            <input
              type="number" min={1} max={200} value={goalQuestions}
              onChange={e => setGoalQuestions(Number(e.target.value) || 10)}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
            />
          </div>
        </div>

        {speedTarget && (
          <div className="text-[11px] text-muted bg-surface2 rounded-sm px-3 py-2">
            Ritmo alvo:{' '}
            <span className="font-bold text-primary">{speedTarget} min/questão</span>
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-card p-4 space-y-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted">
          Filtro de Tema <span className="font-normal normal-case tracking-normal">(opcional)</span>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Disciplina</label>
          <select
            value={selectedDisc}
            onChange={e => { setSelectedDisc(e.target.value); setSelectedMat('') }}
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
          >
            <option value="">Todas</option>
            {Object.keys(disc).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {selectedDisc && (
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Matéria</label>
            <select
              value={selectedMat}
              onChange={e => setSelectedMat(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
            >
              <option value="">Todas de {selectedDisc}</option>
              {mats.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Banca</label>
          <select
            value={selectedBanca}
            onChange={e => setSelectedBanca(e.target.value)}
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
          >
            <option value="">Todas</option>
            {bancas.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Temática</label>
          <input
            type="text" value={tema}
            onChange={e => setTema(e.target.value)}
            placeholder="Ex: Equivalências, Mix RLM..."
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary placeholder:text-dim"
          />
        </div>
      </div>

      <button
        onClick={() => onStart({ timeMinutes, goalQuestions, disc: selectedDisc, mat: selectedMat, banca: selectedBanca, tema: tema.trim() })}
        className="w-full py-3 rounded-card text-[13px] font-black text-white transition-all"
        style={{ background: '#4a7c59' }}
      >
        ▶ Iniciar Sprint
      </button>
    </div>
  )
}
