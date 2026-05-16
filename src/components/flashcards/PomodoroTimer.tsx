import { useState, useEffect, useRef } from 'react'

let _ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === 'closed') _ctx = new AudioContext()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function playBeep(type: 'study-end' | 'rest-end') {
  try {
    const ctx = getCtx()
    const now = ctx.currentTime
    // study-end: 3 ascending tones (celebratory)
    // rest-end: 2 descending tones (alerting)
    const notes = type === 'study-end'
      ? [{ f: 660, t: 0 }, { f: 784, t: 0.18 }, { f: 1047, t: 0.36 }]
      : [{ f: 523, t: 0 }, { f: 392, t: 0.22 }]

    for (const { f, t } of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = f
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, now + t)
      gain.gain.linearRampToValueAtTime(0.22, now + t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.3)
      osc.start(now + t)
      osc.stop(now + t + 0.32)
    }
  } catch {
    // AudioContext not available (e.g. browser policy)
  }
}

function fmt(s: number): string {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export interface PomodoroState {
  enabled: boolean
  phase: 'study' | 'rest'
  secondsLeft: number
  cycle: number
  studyMins: number
  restMins: number
  enable: () => void
  disable: () => void
  skip: () => void
  adjustStudy: (delta: number) => void
  adjustRest: (delta: number) => void
}

export function usePomodoro(): PomodoroState {
  const [enabled, setEnabled] = useState(false)
  const [phase, setPhase] = useState<'study' | 'rest'>('study')
  const [studyMins, setStudyMins] = useState(25)
  const [restMins, setRestMins] = useState(5)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [cycle, setCycle] = useState(0)

  // refs so effects always read latest values without re-subscribing
  const phaseRef = useRef(phase)
  const studyRef = useRef(studyMins)
  const restRef = useRef(restMins)
  phaseRef.current = phase
  studyRef.current = studyMins
  restRef.current = restMins

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [enabled])

  useEffect(() => {
    if (!enabled || secondsLeft > 0) return
    const next: 'study' | 'rest' = phaseRef.current === 'study' ? 'rest' : 'study'
    playBeep(phaseRef.current === 'study' ? 'study-end' : 'rest-end')
    setPhase(next)
    if (next === 'rest') setCycle(c => c + 1)
    setSecondsLeft((next === 'study' ? studyRef.current : restRef.current) * 60)
  }, [secondsLeft, enabled])

  function enable() {
    setEnabled(true)
    setPhase('study')
    setSecondsLeft(studyMins * 60)
    setCycle(0)
  }

  function disable() {
    setEnabled(false)
    setPhase('study')
    setSecondsLeft(studyMins * 60)
    setCycle(0)
  }

  function skip() {
    const next: 'study' | 'rest' = phase === 'study' ? 'rest' : 'study'
    playBeep(phase === 'study' ? 'study-end' : 'rest-end')
    setPhase(next)
    if (next === 'rest') setCycle(c => c + 1)
    setSecondsLeft((next === 'study' ? studyMins : restMins) * 60)
  }

  function adjustStudy(delta: number) {
    const n = Math.max(5, Math.min(60, studyMins + delta))
    setStudyMins(n)
    if (!enabled) setSecondsLeft(n * 60)
  }

  function adjustRest(delta: number) {
    setRestMins(n => Math.max(1, Math.min(30, n + delta)))
  }

  return { enabled, phase, secondsLeft, cycle, studyMins, restMins, enable, disable, skip, adjustStudy, adjustRest }
}

export function PomodoroBar({ p }: { p: PomodoroState }) {
  const totalSecs = p.phase === 'study' ? p.studyMins * 60 : p.restMins * 60
  const pct = totalSecs > 0 ? ((totalSecs - p.secondsLeft) / totalSecs) * 100 : 0
  const isStudy = p.phase === 'study'

  if (!p.enabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-surface2 border border-border rounded-sm">
        <span className="text-[13px]">🍅</span>
        <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Pomodoro</span>
        <div className="flex items-center gap-0.5 ml-1">
          <button onClick={() => p.adjustStudy(-5)} className="w-5 h-5 flex items-center justify-center text-[12px] text-muted hover:text-text transition-colors">−</button>
          <span className="text-[12px] text-text font-bold w-8 text-center">{p.studyMins}m</span>
          <button onClick={() => p.adjustStudy(5)} className="w-5 h-5 flex items-center justify-center text-[12px] text-muted hover:text-text transition-colors">+</button>
        </div>
        <span className="text-[10px] text-dim">/</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => p.adjustRest(-1)} className="w-5 h-5 flex items-center justify-center text-[12px] text-muted hover:text-text transition-colors">−</button>
          <span className="text-[11px] text-muted w-6 text-center">{p.restMins}m</span>
          <button onClick={() => p.adjustRest(1)} className="w-5 h-5 flex items-center justify-center text-[12px] text-muted hover:text-text transition-colors">+</button>
        </div>
        <button
          onClick={p.enable}
          className="ml-auto px-3 py-1 bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold rounded-sm hover:bg-primary/20 transition-all"
        >
          Ativar ▶
        </button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-sm border ${
      isStudy ? 'bg-primary/5 border-primary/20' : 'bg-success/5 border-success/20'
    }`}>
      <span className="text-[14px] shrink-0">{isStudy ? '🍅' : '☕'}</span>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isStudy ? 'text-primary' : 'text-success'}`}>
            {isStudy ? 'Estudo' : 'Descanso'}
          </span>
          <span className={`text-[14px] font-mono font-bold tabular-nums ${isStudy ? 'text-primary' : 'text-success'}`}>
            {fmt(p.secondsLeft)}
          </span>
        </div>
        <div className="bg-surface3 rounded-full h-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isStudy ? 'bg-primary' : 'bg-success'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {p.cycle > 0 && (
        <span className="text-[10px] text-muted shrink-0 font-bold">🍅×{p.cycle}</span>
      )}
      <button
        onClick={p.skip}
        title={isStudy ? 'Pular para descanso' : 'Pular para estudo'}
        className="text-[12px] text-muted hover:text-text transition-colors shrink-0 px-0.5"
      >
        ⏭
      </button>
      <button
        onClick={p.disable}
        title="Desativar Pomodoro"
        className="text-[11px] text-muted hover:text-danger transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  )
}
