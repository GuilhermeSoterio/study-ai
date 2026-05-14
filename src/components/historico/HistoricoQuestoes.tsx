import { useMemo, useState } from 'react'
import { useStore } from '@/store'
import { localDate } from '@/lib/utils'
import type { Questao } from '@/types'

type ErrorType = 'nao_sabia' | 'interpretacao' | 'distracao' | 'pegadinha' | 'tempo'
type QFilter   = 'todas' | 'erros' | 'sem_tema'

const ERROR_OPTIONS: { value: ErrorType; label: string; desc: string; color: string }[] = [
  { value: 'nao_sabia',     label: 'Não sabia',    desc: 'Conteúdo desconhecido',         color: 'border-danger/60 bg-danger/10 text-danger'      },
  { value: 'interpretacao', label: 'Interpretação', desc: 'Sabia, mas não soube resolver', color: 'border-cyan-500/60 bg-cyan-500/10 text-cyan-400' },
  { value: 'distracao',     label: 'Distração',    desc: 'Li errado ou me enganei',       color: 'border-warning/60 bg-warning/10 text-warning'   },
  { value: 'pegadinha',     label: 'Pegadinha',    desc: 'A banca induziu ao erro',       color: 'border-accent/60 bg-accent/10 text-accent'      },
  { value: 'tempo',         label: 'Tempo',        desc: 'Não tive tempo suficiente',     color: 'border-muted/60 bg-surface2 text-muted'         },
]

const ERROR_BADGE: Record<ErrorType, { label: string; cls: string }> = {
  nao_sabia:     { label: 'Não sabia',    cls: 'bg-danger/10 text-danger border-danger/30'        },
  interpretacao: { label: 'Interpretação', cls: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  distracao:     { label: 'Distração',    cls: 'bg-warning/10 text-warning border-warning/30'     },
  pegadinha:     { label: 'Pegadinha',    cls: 'bg-accent/10 text-accent border-accent/30'        },
  tempo:         { label: 'Tempo',        cls: 'bg-muted/10 text-muted border-muted/30'           },
}

// ── Registro rápido ────────────────────────────────────────────────────────────

function QuickRegisterForm({ existingTemas }: { existingTemas: string[] }) {
  const disc       = useStore(s => s.disc)
  const bancas     = useStore(s => s.bancas)
  const addQuestao = useStore(s => s.addQuestao)
  const userId     = useStore(s => s.userId)

  const [selectedDisc, setSelectedDisc] = useState('')
  const [selectedMat,  setSelectedMat]  = useState('')
  const [correto,      setCorreto]      = useState<boolean | null>(null)
  const [banca,        setBanca]        = useState('')
  const [tema,         setTema]         = useState('')
  const [enunciado,    setEnunciado]    = useState('')
  const [errorType,    setErrorType]    = useState<ErrorType | null>(null)
  const [showDetails,  setShowDetails]  = useState(false)
  const [saved,        setSaved]        = useState(false)

  const mats    = selectedDisc ? (disc[selectedDisc] ?? []) : []
  const isErro  = correto === false
  const valid   = Boolean(selectedDisc && selectedMat && correto !== null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !userId) return

    addQuestao({
      id:         crypto.randomUUID(),
      user_id:    userId,
      ts:         Date.now(),
      date:       localDate(),
      disc:       selectedDisc,
      mat:        selectedMat,
      banca:      banca || 'Não informada',
      enunciado:  enunciado.trim() || null,
      correto:    correto!,
      error_type: isErro ? errorType : null,
      tema:       tema.trim() || null,
    })

    // Mantém disc/mat/banca para registrar a próxima questão rapidamente
    setCorreto(null)
    setEnunciado('')
    setTema('')
    setErrorType(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-card p-4 space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Registrar questão</div>

      {/* Disc + Mat */}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={selectedDisc}
          onChange={e => { setSelectedDisc(e.target.value); setSelectedMat('') }}
          className="bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
        >
          <option value="">Disciplina…</option>
          {Object.keys(disc).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          value={selectedMat}
          onChange={e => setSelectedMat(e.target.value)}
          disabled={!selectedDisc}
          className="bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary disabled:opacity-40"
        >
          <option value="">Matéria…</option>
          {mats.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Acertei / Errei */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setCorreto(true)}
          className={`py-2.5 rounded-sm font-black text-[13px] border transition-all ${
            correto === true
              ? 'bg-success/15 border-success/50 text-success'
              : 'bg-surface border-border text-muted hover:text-text'
          }`}
        >
          ✓ Acertei
        </button>
        <button
          type="button"
          onClick={() => setCorreto(false)}
          className={`py-2.5 rounded-sm font-black text-[13px] border transition-all ${
            correto === false
              ? 'bg-danger/15 border-danger/50 text-danger'
              : 'bg-surface border-border text-muted hover:text-text'
          }`}
        >
          ✗ Errei
        </button>
      </div>

      {/* Tipo de erro — aparece quando errou */}
      {isErro && (
        <div className="grid grid-cols-2 gap-1.5">
          {ERROR_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setErrorType(errorType === opt.value ? null : opt.value)}
              className={`px-2 py-2 rounded-sm border text-left transition-all ${
                errorType === opt.value ? opt.color : 'border-border bg-surface text-muted hover:text-text'
              }`}
            >
              <div className="text-[11px] font-bold">{opt.label}</div>
              <div className="text-[10px] opacity-60">{opt.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Toggle mais detalhes */}
      <button
        type="button"
        onClick={() => setShowDetails(v => !v)}
        className="text-[11px] text-muted hover:text-text transition-colors"
      >
        {showDetails ? '▾ ocultar detalhes' : '▸ banca · tema · enunciado'}
      </button>

      {showDetails && (
        <div className="space-y-2">
          <select
            value={banca}
            onChange={e => setBanca(e.target.value)}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
          >
            <option value="">Banca (opcional)…</option>
            {bancas.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <input
            list="qform-temas"
            value={tema}
            onChange={e => setTema(e.target.value)}
            placeholder="Temática (ex: equivalência, negação…)"
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary"
          />
          <datalist id="qform-temas">
            {existingTemas.map(t => <option key={t} value={t} />)}
          </datalist>
          <textarea
            value={enunciado}
            onChange={e => setEnunciado(e.target.value)}
            placeholder="Enunciado da questão (opcional — pode adicionar depois)…"
            rows={3}
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary resize-y leading-relaxed"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!valid}
        className="w-full py-2.5 rounded-sm font-black text-[13px] bg-gradient-to-r from-primary to-cyan-600 text-white disabled:opacity-40 transition-opacity"
      >
        {saved ? '✓ Registrada!' : 'Registrar questão'}
      </button>
    </form>
  )
}

// ── Painel de classificação (inline) ──────────────────────────────────────────

function ClassifyPanel({
  questao,
  existingTemas,
  onSave,
  onClose,
}: {
  questao:       Questao
  existingTemas: string[]
  onSave:        (updates: Partial<Questao>) => void
  onClose:       () => void
}) {
  const [enunciado, setEnunciado] = useState(questao.enunciado ?? '')
  const [tema,      setTema]      = useState(questao.tema ?? '')
  const [errorType, setErrorType] = useState<ErrorType | null>(
    (questao.error_type as ErrorType | null) ?? null
  )

  function save() {
    onSave({
      enunciado:  enunciado.trim() || null,
      tema:       tema.trim() || null,
      error_type: !questao.correto ? errorType : null,
    })
    onClose()
  }

  return (
    <div className="border-b border-border bg-surface2/30 px-4 py-4 space-y-3">
      {/* Enunciado */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
          Enunciado <span className="normal-case font-normal opacity-60">(cole o texto da questão)</span>
        </label>
        <textarea
          value={enunciado}
          onChange={e => setEnunciado(e.target.value)}
          placeholder="Cole ou escreva o enunciado para referência futura…"
          rows={4}
          className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[12px] text-text outline-none focus:border-primary resize-y leading-relaxed"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Tema */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Temática</label>
          <input
            list="classify-temas"
            value={tema}
            onChange={e => setTema(e.target.value)}
            placeholder="Ex: equivalência, negação…"
            className="w-full bg-surface border border-border rounded-sm px-3 py-2 text-[12px] text-text outline-none focus:border-primary"
          />
          <datalist id="classify-temas">
            {existingTemas.map(t => <option key={t} value={t} />)}
          </datalist>
        </div>

        {/* Tipo de erro */}
        {!questao.correto && (
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Tipo de erro</label>
            <div className="grid grid-cols-2 gap-1">
              {ERROR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.desc}
                  onClick={() => setErrorType(errorType === opt.value ? null : opt.value)}
                  className={`px-2 py-1.5 rounded-sm border text-left transition-all ${
                    errorType === opt.value ? opt.color : 'border-border bg-surface text-muted hover:text-text'
                  }`}
                >
                  <div className="text-[10px] font-bold leading-none">{opt.label}</div>
                  <div className="text-[9px] opacity-60 mt-0.5 leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-[11px] font-bold text-muted border border-border rounded-sm hover:bg-surface transition-colors"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          className="px-4 py-1.5 text-[11px] font-black text-white rounded-sm"
          style={{ background: '#4a7c59' }}
        >
          Salvar
        </button>
      </div>
    </div>
  )
}

// ── Linha de questão ──────────────────────────────────────────────────────────

function QuestaoRow({
  q,
  isExpanded,
  onToggle,
  onDelete,
}: {
  q:          Questao
  isExpanded: boolean
  onToggle:   () => void
  onDelete:   () => void
}) {
  const errorInfo = q.error_type ? ERROR_BADGE[q.error_type as ErrorType] : null

  return (
    <div
      onClick={onToggle}
      title={q.enunciado ? q.enunciado.slice(0, 140) + (q.enunciado.length > 140 ? '…' : '') : 'Clique para classificar'}
      className={`group grid grid-cols-[80px_1fr_28px_120px_80px_36px] gap-2 items-center px-3 py-2.5 border-b border-border/50 text-[12px] cursor-pointer select-none transition-colors ${
        isExpanded ? 'bg-surface2/70' : 'hover:bg-surface2/40'
      }`}
    >
      <span className="text-muted font-mono text-[11px]">{q.date}</span>

      <span className="truncate min-w-0">
        <span className="text-text font-medium">{q.disc}</span>
        <span className="text-muted"> › {q.mat}</span>
        {q.enunciado && (
          <span className="ml-1.5 text-[10px] text-muted/50 italic truncate hidden group-hover:inline">
            "{q.enunciado.slice(0, 50)}{q.enunciado.length > 50 ? '…' : ''}"
          </span>
        )}
      </span>

      <div className="flex justify-center">
        {q.correto
          ? <span className="text-success font-black text-[14px]">✓</span>
          : <span className="text-danger font-black text-[14px]">✗</span>
        }
      </div>

      <div className="flex items-center min-w-0">
        {q.tema
          ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25 truncate max-w-full">{q.tema}</span>
          : <span className="text-[10px] text-muted/40">—</span>
        }
      </div>

      <div className="flex items-center min-w-0">
        {errorInfo
          ? <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border truncate ${errorInfo.cls}`}>{errorInfo.label}</span>
          : !q.correto
            ? <span className="text-[10px] text-muted/40">—</span>
            : null
        }
      </div>

      <div
        className="flex justify-center"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onDelete}
          title="Remover questão"
          className="w-6 h-6 flex items-center justify-center rounded text-muted hover:text-danger hover:bg-danger/10 transition-colors text-[11px] opacity-0 group-hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Delete confirmation ────────────────────────────────────────────────────────

function DeleteQuestao({ questao, onClose, onConfirm }: { questao: Questao; onClose: () => void; onConfirm: () => void }) {
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
          <div className="text-[14px] font-black text-danger">Remover questão?</div>
          <div className="text-[12px] text-muted leading-relaxed">
            <span className="font-bold text-text">{questao.disc} › {questao.mat}</span>
            <br />
            {questao.date} · {questao.correto ? '✓ Acertou' : '✗ Errou'}
            {questao.enunciado && (
              <><br /><span className="italic opacity-70">"{questao.enunciado.slice(0, 80)}{questao.enunciado.length > 80 ? '…' : ''}"</span></>
            )}
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button onClick={onClose} className="px-4 py-2 text-[12px] font-bold text-muted border border-border rounded-sm hover:bg-surface2 transition-colors">
              Cancelar
            </button>
            <button
              onClick={() => { onConfirm(); onClose() }}
              className="px-4 py-2 text-[12px] font-black text-white rounded-sm"
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

// ── Root ──────────────────────────────────────────────────────────────────────

export function HistoricoQuestoes() {
  const questoes      = useStore(s => s.questoes)
  const updateQuestao = useStore(s => s.updateQuestao)
  const removeQuestao = useStore(s => s.removeQuestao)

  const [qfilter,  setQFilter]  = useState<QFilter>('todas')
  const [search,   setSearch]   = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Questao | null>(null)

  const existingTemas = useMemo(
    () => [...new Set(questoes.map(q => q.tema).filter((t): t is string => Boolean(t)))].sort(),
    [questoes],
  )

  const filtered = useMemo(() => questoes
    .filter(q => {
      if (qfilter === 'erros')    return !q.correto
      if (qfilter === 'sem_tema') return !q.tema
      return true
    })
    .filter(q => {
      if (!search) return true
      const s = search.toLowerCase()
      return q.disc.toLowerCase().includes(s)
        || q.mat.toLowerCase().includes(s)
        || (q.tema ?? '').toLowerCase().includes(s)
        || (q.enunciado ?? '').toLowerCase().includes(s)
    }),
  [questoes, qfilter, search])

  const semTemaCount = questoes.filter(q => !q.tema).length
  const errosCount   = questoes.filter(q => !q.correto).length

  return (
    <>
      <div className="space-y-3">
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface border border-border rounded-card px-4 py-3 text-center">
            <div className="text-xl font-black text-text">{questoes.length}</div>
            <div className="text-[11px] text-muted mt-0.5">Total registradas</div>
          </div>
          <div className="bg-surface border border-border rounded-card px-4 py-3 text-center">
            <div className="text-xl font-black text-danger">{errosCount}</div>
            <div className="text-[11px] text-muted mt-0.5">Com erros</div>
          </div>
          <div className="bg-surface border border-border rounded-card px-4 py-3 text-center">
            <div className={`text-xl font-black ${semTemaCount > 0 ? 'text-warning' : 'text-success'}`}>
              {semTemaCount}
            </div>
            <div className="text-[11px] text-muted mt-0.5">Sem tema</div>
          </div>
        </div>

        {/* Formulário de registro */}
        <QuickRegisterForm existingTemas={existingTemas} />

        {/* Filtros + busca */}
        <div className="flex gap-2 flex-wrap items-center">
          {([
            { value: 'todas',    label: 'Todas' },
            { value: 'erros',    label: `Só erros (${errosCount})` },
            { value: 'sem_tema', label: `Sem tema (${semTemaCount})` },
          ] as { value: QFilter; label: string }[]).map(f => (
            <button
              key={f.value}
              onClick={() => setQFilter(f.value)}
              className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
                qfilter === f.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-muted hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar disc, matéria, tema, enunciado…"
            className="ml-auto text-[12px] bg-surface border border-border rounded-lg px-3 py-1.5 text-text placeholder:text-muted outline-none focus:border-primary w-60"
          />
        </div>

        {/* Lista */}
        <div className="bg-surface border border-border rounded-card overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_28px_120px_80px_36px] gap-2 px-3 py-2 bg-surface2 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider">
            <span>Data</span>
            <span>Disc › Matéria</span>
            <span className="text-center">R</span>
            <span>Tema</span>
            <span>Erro</span>
            <span />
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted text-sm">
              {questoes.length === 0
                ? 'Nenhuma questão registrada ainda.'
                : 'Nenhuma questão encontrada com esse filtro.'}
            </div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: 520 }}>
              {filtered.map(q => (
                <div key={q.id}>
                  <QuestaoRow
                    q={q}
                    isExpanded={expanded === q.id}
                    onToggle={() => setExpanded(prev => prev === q.id ? null : q.id)}
                    onDelete={() => setDeleting(q)}
                  />
                  {expanded === q.id && (
                    <ClassifyPanel
                      questao={q}
                      existingTemas={existingTemas}
                      onClose={() => setExpanded(null)}
                      onSave={updates => updateQuestao(q.id, updates)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-[11px] text-muted text-center">
          {filtered.length} questão(ões) · clique em uma linha para classificar
          {semTemaCount > 0 && (
            <span> · <button onClick={() => setQFilter('sem_tema')} className="text-warning font-bold hover:underline">{semTemaCount} sem tema</button></span>
          )}
        </div>
      </div>

      {deleting && (
        <DeleteQuestao
          questao={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => removeQuestao(deleting.id)}
        />
      )}
    </>
  )
}
