import { useState } from 'react'
import { useStore } from '@/store'
import type { Session } from '@/types'

type Filter = 'todas' | 'qconcursos' | 'manual'

function SourceBadge({ source }: { source?: string }) {
  if (source === 'QConcursos') {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">
        QC
      </span>
    )
  }
  if (source === 'flashcard') {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning/20 text-warning border border-warning/30">
        FC
      </span>
    )
  }
  return (
    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface3 text-muted border border-border">
      manual
    </span>
  )
}

function SessionRow({ s }: { s: Session }) {
  const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
  const accColor = acc >= 75 ? 'text-success' : acc >= 50 ? 'text-warning' : 'text-danger'

  return (
    <div className="grid grid-cols-[90px_1fr_1fr_60px_50px_60px] gap-2 items-center px-3 py-2 border-b border-border/50 hover:bg-surface2/50 transition-colors text-[12px]">
      <span className="text-muted font-mono">{s.date}</span>
      <span className="text-text font-medium truncate">{s.disc}</span>
      <span className="text-muted truncate">{s.mat}</span>
      <span className="text-muted text-center">{s.banca}</span>
      <span className={`font-bold text-center tabular-nums ${accColor}`}>
        {s.correct}/{s.total}
      </span>
      <div className="flex justify-center">
        <SourceBadge source={s.source} />
      </div>
    </div>
  )
}

export function Historico() {
  const sessions = useStore(s => s.sessions)
  const [filter, setFilter] = useState<Filter>('todas')
  const [search, setSearch] = useState('')

  const filtered = sessions
    .filter(s => {
      if (filter === 'qconcursos') return s.source === 'QConcursos'
      if (filter === 'manual') return !s.source || s.source === 'manual'
      return true
    })
    .filter(s => {
      if (!search) return true
      const q = search.toLowerCase()
      return s.disc.toLowerCase().includes(q) || s.mat.toLowerCase().includes(q) || s.banca.toLowerCase().includes(q)
    })

  const qcCount = sessions.filter(s => s.source === 'QConcursos').length
  const totalToday = sessions.filter(s => s.date === new Date().toISOString().slice(0, 10)).length

  return (
    <div className="space-y-3">
      {/* Resumo rápido */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-surface border border-border rounded-card px-4 py-3 text-center">
          <div className="text-xl font-black text-text">{sessions.length}</div>
          <div className="text-[11px] text-muted mt-0.5">Sessões total</div>
        </div>
        <div className="bg-surface border border-border rounded-card px-4 py-3 text-center">
          <div className="text-xl font-black text-accent">{qcCount}</div>
          <div className="text-[11px] text-muted mt-0.5">Via extensão</div>
        </div>
        <div className="bg-surface border border-border rounded-card px-4 py-3 text-center">
          <div className="text-xl font-black text-success">{totalToday}</div>
          <div className="text-[11px] text-muted mt-0.5">Hoje</div>
        </div>
      </div>

      {/* Filtros + busca */}
      <div className="flex gap-2 flex-wrap items-center">
        {(['todas', 'qconcursos', 'manual'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors capitalize ${
              filter === f
                ? 'bg-primary text-white border-primary'
                : 'bg-surface border-border text-muted hover:text-text'
            }`}
          >
            {f === 'qconcursos' ? 'QConcursos' : f}
          </button>
        ))}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar disciplina, matéria…"
          className="ml-auto text-[12px] bg-surface border border-border rounded-lg px-3 py-1.5 text-text placeholder:text-muted outline-none focus:border-primary w-52"
        />
      </div>

      {/* Tabela */}
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[90px_1fr_1fr_60px_50px_60px] gap-2 px-3 py-2 bg-surface2 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider">
          <span>Data</span>
          <span>Disciplina</span>
          <span>Matéria</span>
          <span className="text-center">Banca</span>
          <span className="text-center">Acertos</span>
          <span className="text-center">Origem</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted text-sm">
            {sessions.length === 0
              ? 'Nenhuma sessão registrada ainda.'
              : 'Nenhuma sessão encontrada com esse filtro.'}
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: 480 }}>
            {filtered.map(s => <SessionRow key={s.id} s={s} />)}
          </div>
        )}
      </div>

      <div className="text-[11px] text-muted text-center">
        {filtered.length} sessão(ões) · <span className="text-accent font-bold">QC</span> = QConcursos ·{' '}
        <span className="text-warning font-bold">FC</span> = Flashcard
      </div>
    </div>
  )
}
