import { useState } from 'react'
import { useStore } from '@/store'

type ErrorType = 'nao_sabia' | 'distracao' | 'pegadinha' | 'tempo'

const ERROR_OPTIONS: { value: ErrorType; label: string; desc: string; color: string }[] = [
  { value: 'nao_sabia',  label: 'Não sabia',  desc: 'Conteúdo desconhecido',      color: 'border-danger/60 bg-danger/10 text-danger'   },
  { value: 'distracao',  label: 'Distração',  desc: 'Li errado ou me enganei',    color: 'border-warning/60 bg-warning/10 text-warning' },
  { value: 'pegadinha',  label: 'Pegadinha',  desc: 'A banca induziu ao erro',    color: 'border-accent/60 bg-accent/10 text-accent'   },
  { value: 'tempo',      label: 'Tempo',      desc: 'Não tive tempo suficiente',  color: 'border-muted/60 bg-surface2 text-muted'      },
]

export function Registrar() {
  const disc       = useStore(s => s.disc)
  const bancas     = useStore(s => s.bancas)
  const addSession = useStore(s => s.addSession)
  const userId     = useStore(s => s.userId)

  const [selectedDisc, setSelectedDisc] = useState('')
  const [selectedMat,  setSelectedMat]  = useState('')
  const [total,        setTotal]        = useState('')
  const [correct,      setCorrect]      = useState('')
  const [banca,        setBanca]        = useState('')
  const [errorType,    setErrorType]    = useState<ErrorType | null>(null)
  const [saved,        setSaved]        = useState(false)

  const mats      = selectedDisc ? (disc[selectedDisc] ?? []) : []
  const totalNum  = parseInt(total)  || 0
  const correctNum = parseInt(correct) || 0
  const errors    = totalNum - correctNum
  const hasErrors = errors > 0
  const valid     = selectedDisc && selectedMat && totalNum > 0 && correctNum >= 0 && correctNum <= totalNum && banca

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !userId) return

    addSession({
      id:         crypto.randomUUID(),
      user_id:    userId,
      ts:         Date.now(),
      date:       new Date().toISOString().slice(0, 10),
      disc:       selectedDisc,
      mat:        selectedMat,
      total:      totalNum,
      correct:    correctNum,
      banca,
      source:     'manual',
      error_type: hasErrors ? errorType : null,
    })

    // Reset
    setTotal(''); setCorrect(''); setErrorType(null); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="text-[13px] font-bold text-text">Registrar Sessão</div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Disciplina */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Disciplina</label>
          <select
            value={selectedDisc}
            onChange={e => { setSelectedDisc(e.target.value); setSelectedMat('') }}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
          >
            <option value="">Selecione...</option>
            {Object.keys(disc).map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Matéria */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Matéria</label>
          <select
            value={selectedMat}
            onChange={e => setSelectedMat(e.target.value)}
            disabled={!selectedDisc}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary disabled:opacity-40"
          >
            <option value="">Selecione...</option>
            {mats.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Total e Acertos */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Total de questões</label>
            <input
              type="number" min={1} value={total}
              onChange={e => setTotal(e.target.value)}
              placeholder="Ex: 10"
              className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Acertos</label>
            <input
              type="number" min={0} max={totalNum || undefined} value={correct}
              onChange={e => setCorrect(e.target.value)}
              placeholder="Ex: 7"
              className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Preview de taxa */}
        {totalNum > 0 && correctNum >= 0 && correctNum <= totalNum && (
          <div className="flex items-center gap-3 px-3 py-2 bg-surface2 rounded-sm text-[12px]">
            <span className="text-success">{correctNum} acertos</span>
            <span className="text-danger">{errors} erros</span>
            <span className={`font-black ml-auto ${
              Math.round((correctNum / totalNum) * 100) >= 75 ? 'text-success'
              : Math.round((correctNum / totalNum) * 100) >= 50 ? 'text-warning' : 'text-danger'
            }`}>
              {Math.round((correctNum / totalNum) * 100)}%
            </span>
          </div>
        )}

        {/* Banca */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted">Banca</label>
          <select
            value={banca} onChange={e => setBanca(e.target.value)}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
          >
            <option value="">Selecione...</option>
            {bancas.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Tipo de erro — só aparece quando há erros */}
        {hasErrors && (
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted">
              Por que errou? <span className="normal-case font-normal">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ERROR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setErrorType(errorType === opt.value ? null : opt.value)}
                  className={`px-3 py-2.5 rounded-sm border text-left transition-all ${
                    errorType === opt.value
                      ? opt.color
                      : 'border-border bg-surface text-muted hover:border-border hover:text-text'
                  }`}
                >
                  <div className="text-[12px] font-bold">{opt.label}</div>
                  <div className="text-[10px] opacity-70">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!valid}
          className="w-full py-2.5 rounded-sm font-bold text-[13px] bg-gradient-to-r from-primary to-cyan-600 text-white disabled:opacity-40 transition-opacity"
        >
          {saved ? '✓ Registrado!' : 'Registrar sessão'}
        </button>
      </form>
    </div>
  )
}
