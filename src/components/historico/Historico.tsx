import { useState } from 'react'
import { useStore } from '@/store'
import { localDate } from '@/lib/utils'
import type { Session } from '@/types'
import { HistoricoQuestoes } from './HistoricoQuestoes'

type Filter = 'todas' | 'qconcursos' | 'manual' | 'invalidas'
type SubTab = 'sessoes' | 'questoes'

// ── Source badge ──────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source?: string }) {
  if (source === 'QConcursos')
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30">QC</span>
  if (source === 'flashcard')
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-warning/20 text-warning border border-warning/30">FC</span>
  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface3 text-muted border border-border">manual</span>
}

// ── Edit modal ────────────────────────────────────────────────────────────────

interface EditForm {
  date:    string
  disc:    string
  mat:     string
  banca:   string
  correct: string
  total:   string
  tema:    string
}

function EditModal({
  session,
  onClose,
  onSave,
}: {
  session: Session
  onClose: () => void
  onSave:  (updates: Partial<Pick<Session, 'correct' | 'total' | 'disc' | 'mat' | 'banca' | 'date' | 'tema' | 'error_type'>>) => void
}) {
  const sessions      = useStore(s => s.sessions)
  const discMap       = useStore(s => s.disc)
  const existingTemas = [...new Set(sessions.map(s => s.tema).filter((t): t is string => Boolean(t)))].sort()

  const [form, setForm] = useState<EditForm>({
    date:    session.date,
    disc:    session.disc,
    mat:     session.mat,
    banca:   session.banca,
    correct: String(session.correct),
    total:   String(session.total),
    tema:    session.tema ?? '',
  })

  const mats = form.disc ? (discMap[form.disc] ?? []) : []

  function set(k: keyof EditForm, v: string) {
    setForm(prev => ({ ...prev, [k]: v, ...(k === 'disc' ? { mat: '' } : {}) }))
  }

  const correct  = parseInt(form.correct) || 0
  const total    = parseInt(form.total)   || 0
  const valid    = total > 0 && correct >= 0 && correct <= total && form.disc.trim() && form.mat.trim()
  const acc      = total > 0 ? Math.round((correct / total) * 100) : 0
  const accColor = acc >= 75 ? '#4a7c59' : acc >= 50 ? '#d4a017' : '#c0392b'

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    onSave({
      date:    form.date,
      disc:    form.disc.trim(),
      mat:     form.mat.trim(),
      banca:   form.banca.trim(),
      correct,
      total,
      tema:    form.tema.trim() || null,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-card shadow-xl border border-border w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <div className="text-[14px] font-black text-text">✎ Editar Sessão</div>
            <div className="text-[11px] text-muted mt-0.5">{session.disc} · {session.mat}</div>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text text-lg leading-none">✕</button>
        </div>

        <form onSubmit={submit} className="px-5 py-4 space-y-4">
          <div
            className="rounded-card p-4 space-y-3"
            style={{ background: 'rgba(74,124,89,0.06)', border: '1.5px solid rgba(74,124,89,0.25)' }}
          >
            <div className="text-[10px] font-black tracking-wider text-primary uppercase">Resultado da sessão</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Acertos</label>
                <input
                  type="number" min={0} max={form.total || 9999}
                  value={form.correct}
                  onChange={e => set('correct', e.target.value)}
                  className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[18px] font-black text-text outline-none focus:border-primary tabular-nums text-center"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Total de questões</label>
                <input
                  type="number" min={1}
                  value={form.total}
                  onChange={e => set('total', e.target.value)}
                  className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[18px] font-black text-text outline-none focus:border-primary tabular-nums text-center"
                />
              </div>
            </div>
            {total > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-surface3 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${acc}%`, background: accColor }} />
                </div>
                <span className="text-[13px] font-black tabular-nums" style={{ color: accColor }}>{acc}%</span>
              </div>
            )}
            {correct > total && total > 0 && (
              <div className="text-[10px] text-danger">Acertos não pode ser maior que o total.</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Data</label>
              <input
                type="date"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[12px] text-text outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Banca</label>
              <input
                value={form.banca}
                onChange={e => set('banca', e.target.value)}
                className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[12px] text-text outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Disciplina</label>
            <select
              value={form.disc}
              onChange={e => set('disc', e.target.value)}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[12px] text-text outline-none focus:border-primary"
            >
              <option value="">Selecione...</option>
              {Object.keys(discMap).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">Matéria</label>
            <select
              value={form.mat}
              onChange={e => set('mat', e.target.value)}
              disabled={!form.disc}
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[12px] text-text outline-none focus:border-primary disabled:opacity-40"
            >
              <option value="">Selecione...</option>
              {mats.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted uppercase tracking-wider">
              Temática <span className="normal-case font-normal opacity-60">(opcional)</span>
            </label>
            <input
              list="edit-temas-list"
              value={form.tema}
              onChange={e => set('tema', e.target.value)}
              placeholder="Ex: equivalência, negação…"
              className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[12px] text-text outline-none focus:border-primary"
            />
            <datalist id="edit-temas-list">
              {existingTemas.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-sm text-[12px] font-bold text-muted border border-border hover:bg-surface2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!valid}
              className="px-6 py-2 rounded-sm text-[12px] font-black text-white disabled:opacity-40 transition-opacity"
              style={{ background: '#4a7c59' }}
            >
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Delete confirmation ────────────────────────────────────────────────────────

function DeleteConfirm({
  session,
  onClose,
  onConfirm,
}: {
  session:   Session
  onClose:   () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-card shadow-xl border border-danger/30 w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 space-y-3">
          <div className="text-[14px] font-black text-danger">Remover sessão?</div>
          <div className="text-[12px] text-muted leading-relaxed">
            <span className="font-bold text-text">{session.disc} · {session.mat}</span>
            <br />
            {session.date} · {session.correct}/{session.total} acertos · {session.banca}
          </div>
          <div className="text-[11px] text-danger/80 bg-danger/05 border border-danger/20 rounded px-3 py-2">
            Esta ação não pode ser desfeita. As métricas serão recalculadas imediatamente.
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[12px] font-bold text-muted border border-border rounded-sm hover:bg-surface2 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => { onConfirm(); onClose() }}
              className="px-4 py-2 text-[12px] font-black text-white rounded-sm transition-opacity"
              style={{ background: '#c0392b' }}
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({
  s,
  onEdit,
  onDelete,
}: {
  s:        Session
  onEdit:   () => void
  onDelete: () => void
}) {
  const acc      = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
  const accColor = acc >= 75 ? 'text-success' : acc >= 50 ? 'text-warning' : 'text-danger'

  return (
    <div className="group grid grid-cols-[90px_1fr_1fr_60px_50px_56px_56px] gap-2 items-center px-3 py-2 border-b border-border/50 hover:bg-surface2/60 transition-colors text-[12px]">
      <span className="text-muted font-mono">{s.date}</span>
      <span className="text-text font-medium truncate">{s.disc}</span>
      <span className="truncate">
        <span className="text-muted">{s.mat}</span>
        {s.tema && (
          <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
            {s.tema}
          </span>
        )}
      </span>
      <span className="text-muted text-center truncate">{s.banca}</span>
      <span className={`font-bold text-center tabular-nums ${accColor}`}>
        {s.correct}/{s.total}
      </span>
      <div className="flex justify-center">
        <SourceBadge source={s.source} />
      </div>
      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          title="Editar sessão"
          className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-primary hover:bg-primary/10 transition-colors text-[12px]"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          title="Remover sessão"
          className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors text-[11px]"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Sessões subtab ────────────────────────────────────────────────────────────

const PAGE_SIZE = 50

function HistoricoSessoes() {
  const sessions         = useStore(s => s.sessions)
  const hasMore          = useStore(s => s.hasMoreSessions)
  const updateSession    = useStore(s => s.updateSession)
  const removeSession    = useStore(s => s.removeSession)
  const loadMoreSessions = useStore(s => s.loadMoreSessions)

  const [filter,    setFilter]    = useState<Filter>('todas')
  const [search,    setSearch]    = useState('')
  const [page,      setPage]      = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [editing,   setEditing]   = useState<Session | null>(null)
  const [deleting,  setDeleting]  = useState<Session | null>(null)

  const filtered = sessions
    .filter(s => {
      if (filter === 'qconcursos') return s.source === 'QConcursos'
      if (filter === 'manual') return !s.source || s.source === 'manual'
      return true
    })
    .filter(s => {
      if (!search) return true
      const q = search.toLowerCase()
      return s.disc.toLowerCase().includes(q)
        || s.mat.toLowerCase().includes(q)
        || s.banca.toLowerCase().includes(q)
        || (s.tema ?? '').toLowerCase().includes(q)
    })

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages - 1)
  const pageItems   = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const isLastPage  = currentPage >= totalPages - 1

  // Volta para a primeira página ao mudar filtro/busca
  const handleFilter = (f: Filter) => { setFilter(f); setPage(0) }
  const handleSearch = (v: string) => { setSearch(v);  setPage(0) }

  async function handleLoadMore() {
    setLoading(true)
    await loadMoreSessions()
    setLoading(false)
  }

  const qcCount    = sessions.filter(s => s.source === 'QConcursos').length
  const totalToday = sessions.filter(s => s.date === localDate()).length

  return (
    <>
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-card px-4 py-3 text-center">
            <div className="text-xl font-black text-text">{sessions.length}</div>
            <div className="text-[11px] text-muted mt-0.5">Sessões carregadas</div>
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

        <div className="flex gap-2 flex-wrap items-center">
          {(['todas', 'qconcursos', 'manual'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => handleFilter(f)}
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
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar disciplina, matéria, tema…"
            className="ml-auto text-[12px] bg-surface border border-border rounded-lg px-3 py-1.5 text-text placeholder:text-muted outline-none focus:border-primary w-52"
          />
        </div>

        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="grid grid-cols-[90px_1fr_1fr_60px_50px_56px_56px] gap-2 px-3 py-2 bg-surface2 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider">
            <span>Data</span>
            <span>Disciplina</span>
            <span>Matéria</span>
            <span className="text-center">Banca</span>
            <span className="text-center">Acertos</span>
            <span className="text-center">Origem</span>
            <span className="text-center">Ações</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              {sessions.length === 0
                ? 'Nenhuma sessão registrada ainda.'
                : 'Nenhuma sessão encontrada com esse filtro.'}
            </div>
          ) : (
            pageItems.map(s => (
              <SessionRow
                key={s.id}
                s={s}
                onEdit={()   => setEditing(s)}
                onDelete={() => setDeleting(s)}
              />
            ))
          )}
        </div>

        {/* Paginação */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-3 py-1.5 text-[11px] font-bold rounded border border-border text-muted hover:text-text hover:bg-surface2 disabled:opacity-30 transition-colors"
            >
              ← Anterior
            </button>

            <span className="text-[11px] text-muted">
              Página <span className="text-text font-bold">{currentPage + 1}</span> de{' '}
              <span className="text-text font-bold">{totalPages}</span>
              {' '}·{' '}
              <span className="text-muted">{filtered.length} sessão(ões)</span>
            </span>

            {isLastPage && hasMore ? (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-3 py-1.5 text-[11px] font-bold rounded border border-primary/50 text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Carregando…' : 'Carregar mais ↓'}
              </button>
            ) : (
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 text-[11px] font-bold rounded border border-border text-muted hover:text-text hover:bg-surface2 disabled:opacity-30 transition-colors"
              >
                Próxima →
              </button>
            )}
          </div>
        )}

        <div className="text-[11px] text-muted text-center">
          <span className="text-accent font-bold">QC</span> = QConcursos ·{' '}
          <span className="text-warning font-bold">FC</span> = Flashcard ·{' '}
          passe o mouse sobre uma linha para editar ou remover
        </div>
      </div>

      {editing && (
        <EditModal
          session={editing}
          onClose={() => setEditing(null)}
          onSave={updates => updateSession(editing.id, updates)}
        />
      )}
      {deleting && (
        <DeleteConfirm
          session={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => removeSession(deleting.id)}
        />
      )}
    </>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function Historico() {
  const [subTab, setSubTab] = useState<SubTab>('sessoes')

  return (
    <div className="space-y-3">
      {/* SubTabs */}
      <div className="flex gap-1 bg-surface2 rounded-card p-1 w-fit">
        {([
          { value: 'sessoes',  label: 'Sessões' },
          { value: 'questoes', label: 'Questões' },
        ] as { value: SubTab; label: string }[]).map(t => (
          <button
            key={t.value}
            onClick={() => setSubTab(t.value)}
            className={`px-4 py-1.5 rounded text-[12px] font-bold transition-colors ${
              subTab === t.value
                ? 'bg-surface text-text shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'sessoes' ? <HistoricoSessoes /> : <HistoricoQuestoes />}
    </div>
  )
}
