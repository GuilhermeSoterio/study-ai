import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '@/store'
import type { SprintConfig } from './types'

interface Props {
  config:    SprintConfig
  startTime: number
  onFinish:  () => void
}

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function FocoSession({ config, startTime, onFinish }: Props) {
  const totalSeconds    = config.timeMinutes * 60
  const sessions        = useStore(s => s.sessions)
  const refreshSinceTs  = useStore(s => s.refreshSinceTs)

  const [elapsed, setElapsed] = useState(0)
  const onFinishRef = useRef(onFinish)
  onFinishRef.current = onFinish

  // countdown
  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(() => Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startTime])

  // polling — busca novas sessões a cada 5s (não depende do Realtime do Supabase)
  useEffect(() => {
    const id = setInterval(() => refreshSinceTs(startTime), 5000)
    return () => clearInterval(id)
  }, [startTime, refreshSinceTs])

  useEffect(() => {
    if (elapsed >= totalSeconds && totalSeconds > 0) onFinishRef.current()
  }, [elapsed, totalSeconds])

  // questões capturadas pela extensão desde o início do sprint
  const sprint = useMemo(() =>
    sessions.filter(s => s.ts >= startTime),
    [sessions, startTime]
  )
  const done    = sprint.reduce((sum, s) => sum + s.total,   0)
  const correct = sprint.reduce((sum, s) => sum + s.correct, 0)
  const goalMet = done >= config.goalQuestions

  // detecta última questão recebida para flash de feedback
  const prevDoneRef = useRef(0)
  const [flash, setFlash] = useState<'correct' | 'wrong' | null>(null)
  useEffect(() => {
    if (done > prevDoneRef.current) {
      const last = sprint[0] // store é newest-first
      setFlash(last && last.correct > 0 ? 'correct' : 'wrong')
      prevDoneRef.current = done
      const t = setTimeout(() => setFlash(null), 1800)
      return () => clearTimeout(t)
    }
  }, [done, sprint])

  const remaining  = totalSeconds - elapsed
  const timeRatio  = totalSeconds > 0 ? elapsed / totalSeconds : 0
  const questRatio = config.goalQuestions > 0 ? done / config.goalQuestions : 0
  const paceGap    = timeRatio - questRatio
  const paceColor  = goalMet        ? '#4a7c59'
                   : paceGap <= 0.1 ? '#4a7c59'
                   : paceGap <= 0.3 ? '#d4a017'
                   :                  '#c0392b'
  const paceLabel  = goalMet        ? 'Meta batida! 🏆'
                   : paceGap <= 0.1 ? 'No ritmo ✓'
                   : paceGap <= 0.3 ? 'Ligeiramente atrasado'
                   :                  'Atrás do ritmo'

  const actualPct   = Math.min((done / config.goalQuestions) * 100, 100)
  const expectedPct = Math.min(timeRatio * 100, 100)
  const timerColor  = remaining <= 60 ? '#c0392b' : remaining <= 300 ? '#d4a017' : 'rgb(var(--color-text))'

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center gap-8 py-10">

      {/* Timer */}
      <div className="text-center space-y-1">
        <div className="text-[72px] font-black tabular-nums leading-none" style={{ color: timerColor }}>
          {fmt(remaining)}
        </div>
        <div className="text-[11px] text-muted">
          {config.disc
            ? `${config.mat || config.disc}${config.banca ? ` · ${config.banca}` : ''}`
            : 'Sessão livre'
          }
        </div>
      </div>

      {/* Progress */}
      <div className="text-center space-y-1">
        <div className="text-[22px] font-black text-text">
          {done} <span className="text-muted font-normal text-[16px]">de {config.goalQuestions}</span>
        </div>
        <div className="text-[12px] text-muted">
          <span style={{ color: '#4a7c59' }}>{correct} acertos</span>
          {' · '}
          <span style={{ color: '#c0392b' }}>{done - correct} erros</span>
        </div>
      </div>

      {/* Flash de feedback da última questão */}
      <div className={`text-[13px] font-black h-6 transition-opacity ${flash ? 'opacity-100' : 'opacity-0'}`}
        style={{ color: flash === 'correct' ? '#4a7c59' : '#c0392b' }}>
        {flash === 'correct' ? '✓ Acerto registrado!' : flash === 'wrong' ? '✗ Erro registrado!' : ''}
      </div>

      {/* Aguardando (estado inicial) */}
      {done === 0 && (
        <div className="flex items-center gap-2 text-[12px] text-muted">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          Aguardando questões do QConcursos...
        </div>
      )}

      {/* Rhythm bar */}
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted">Ritmo</span>
          <span className="font-bold" style={{ color: paceColor }}>{paceLabel}</span>
        </div>
        <div className="relative w-full h-3 bg-surface3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${actualPct}%`, background: paceColor }}
          />
          {/* marcador de posição esperada */}
          <div
            className="absolute top-0 bottom-0 w-0.5 opacity-40"
            style={{ left: `${Math.min(expectedPct, 98)}%`, background: 'rgb(var(--color-text))' }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-dim">
          <span>0q</span>
          <span>{config.goalQuestions}q</span>
        </div>
      </div>

      <button
        onClick={onFinish}
        className={`w-full py-2.5 rounded-card text-[13px] font-bold transition-all ${
          goalMet
            ? 'text-white hover:opacity-90'
            : 'border border-border/50 text-muted hover:text-text hover:border-border'
        }`}
        style={goalMet ? { background: '#4a7c59' } : {}}
      >
        {goalMet ? '✓ Finalizar e Ver Relatório' : 'Finalizar Sessão'}
      </button>

    </div>
  )
}
