import { useState, useEffect } from 'react'
import { useStats } from '@/hooks/useStats'

interface Operation {
  name: string
  goal: number
  date: string
}

const LS_KEY = 'studybi_op'
const today  = () => new Date().toISOString().slice(0, 10)

function loadOp(): Operation | null {
  try {
    const s = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null')
    return s?.date === today() ? s : null
  } catch { return null }
}

function useCountdown() {
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() {
      const now = new Date()
      const end = new Date(); end.setHours(23, 59, 59, 999)
      const d   = Math.max(0, end.getTime() - now.getTime())
      const h   = Math.floor(d / 3600000)
      const m   = Math.floor((d % 3600000) / 60000)
      const s   = Math.floor((d % 60000) / 1000)
      setTime(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

// ── Form ──────────────────────────────────────────────────────────────────────

function OperationForm({ onStart }: { onStart: (name: string, goal: number) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('40')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const g = parseInt(goal) || 0
    if (!name.trim() || g < 1) return
    onStart(name.trim(), g)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full border border-dashed border-border rounded-card py-3 text-[12px] text-muted hover:text-text hover:border-primary transition-colors flex items-center justify-center gap-2"
      >
        <span>🎯</span>
        Iniciar Operação do Dia
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="bg-surface border border-primary/30 rounded-card p-4 space-y-3"
      style={{ borderLeft: '4px solid #4a7c59' }}
    >
      <div className="text-[10px] font-black tracking-widest text-primary uppercase">
        ★ Nova Operação
      </div>

      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder='Ex: "Iniciar Direito Administrativo"'
        className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary placeholder:text-muted"
      />

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={goal}
          onChange={e => setGoal(e.target.value)}
          className="w-24 bg-surface2 border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
        />
        <span className="text-[12px] text-muted flex-1">questões-alvo</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] text-muted hover:text-text px-3 py-1.5 border border-border rounded-sm transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="text-[11px] font-black px-4 py-1.5 rounded-sm text-white transition-colors tracking-wider"
          style={{ background: '#4a7c59' }}
        >
          INICIAR
        </button>
      </div>
    </form>
  )
}

// ── Active Banner ─────────────────────────────────────────────────────────────

function ActiveOperation({ op, todayTotal, onAbort }: {
  op: Operation
  todayTotal: number
  onAbort: () => void
}) {
  const countdown = useCountdown()
  const done      = Math.min(todayTotal, op.goal)
  const pct       = Math.min(100, Math.round((done / op.goal) * 100))
  const completed = done >= op.goal

  const accentColor = completed ? '#4a7c59' : pct >= 50 ? '#d4a017' : '#c0392b'
  const borderColor = completed ? '#4a7c5966' : '#d4a01766'
  const bgColor     = completed ? 'rgba(74,124,89,0.07)' : 'rgba(212,160,23,0.05)'

  return (
    <div
      className="rounded-card p-4 space-y-3"
      style={{ background: bgColor, border: `1.5px solid ${borderColor}`, borderLeft: `4px solid ${accentColor}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black tracking-widest uppercase mb-0.5" style={{ color: accentColor }}>
            {completed ? '⭐ Missão Cumprida' : '★ Operação em Campo'}
          </div>
          <div className="text-[16px] font-black text-text leading-tight">
            {op.name}
          </div>
        </div>

        {!completed && (
          <div className="text-right shrink-0">
            <div className="text-[9px] font-bold tracking-widest text-muted uppercase">Tempo Restante</div>
            <div className="text-[17px] font-black tabular-nums font-mono text-text">
              {countdown}
            </div>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] text-muted uppercase tracking-wider font-bold">Terreno conquistado</span>
          <span className="text-[22px] font-black tabular-nums leading-none" style={{ color: accentColor }}>
            {pct}%
          </span>
        </div>

        {/* Bar segmentada */}
        <div className="relative h-3.5 bg-surface3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: completed
                ? 'linear-gradient(90deg, #4a7c59, #6b8e5a)'
                : 'linear-gradient(90deg, #c0392b, #d4a017)',
            }}
          />
          {[25, 50, 75].map(mark => (
            <div
              key={mark}
              className="absolute top-0 h-full w-px"
              style={{ left: `${mark}%`, background: 'rgba(255,255,255,0.4)' }}
            />
          ))}
        </div>

        <div className="flex justify-between text-[11px] text-muted">
          <span>
            <span className="font-bold text-text">{done}</span> questões feitas
          </span>
          <span>meta: <span className="font-bold text-text">{op.goal}q</span></span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-0.5">
        {completed ? (
          <span className="text-[12px] font-bold text-success">
            🎖️ {done} / {op.goal} — Meta alcançada!
          </span>
        ) : (
          <span className="text-[11px] text-muted">
            Faltam{' '}
            <span className="font-black text-text">{op.goal - done}</span> questões para concluir
          </span>
        )}
        <button
          onClick={onAbort}
          className="text-[10px] text-muted hover:text-danger border border-border/60 hover:border-danger/40 px-2.5 py-1 rounded-sm transition-colors"
        >
          Encerrar operação
        </button>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function OperationMode() {
  const [op, setOp]    = useState<Operation | null>(loadOp)
  const { todayTotal } = useStats()

  function startOperation(name: string, goal: number) {
    const newOp = { name, goal, date: today() }
    localStorage.setItem(LS_KEY, JSON.stringify(newOp))
    setOp(newOp)
  }

  function abortOperation() {
    localStorage.removeItem(LS_KEY)
    setOp(null)
  }

  if (!op) return <OperationForm onStart={startOperation} />

  return <ActiveOperation op={op} todayTotal={todayTotal} onAbort={abortOperation} />
}
