import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { localDate } from '@/lib/utils'
import type { DiaryEntry } from '@/types'

// ── Utils ─────────────────────────────────────────────────────────────────────

const today = () => localDate()

function formatDate(date: string) {
  const d  = new Date(date + 'T12:00:00')
  const wd = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()]
  return `${wd} · ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
}

function daysSince(date: string) {
  const diff = Math.floor((Date.now() - new Date(date + 'T12:00:00').getTime()) / 86400000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'ontem'
  return `há ${diff} dias`
}

// ── Field ─────────────────────────────────────────────────────────────────────

const FIELDS = [
  { key: 'atacou',   icon: '⚔️', label: 'O que atacou hoje',        placeholder: 'Matérias estudadas, questões resolvidas, novos tópicos…' },
  { key: 'resistiu', icon: '🛡️', label: 'O que resistiu',            placeholder: 'O que foi difícil, onde você travou, conceitos que não fixaram…' },
  { key: 'reforco',  icon: '🔧', label: 'O que precisa de reforço',  placeholder: 'Pontos fracos identificados, o que revisar amanhã…' },
] as const

type FieldKey = 'atacou' | 'resistiu' | 'reforco'

// ── Entry Form ────────────────────────────────────────────────────────────────

function EntryForm({
  date = today(),
  initial,
  onSaved,
}: {
  date?: string
  initial?: DiaryEntry
  onSaved: (entry: DiaryEntry) => void
}) {
  const userId  = useStore(s => s.userId)
  const [form, setForm]   = useState({ atacou: '', resistiu: '', reforco: '', ...initial })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)

  useEffect(() => {
    setForm({ atacou: initial?.atacou ?? '', resistiu: initial?.resistiu ?? '', reforco: initial?.reforco ?? '' })
  }, [initial?.id, date])

  const valid = form.atacou.trim() && form.resistiu.trim() && form.reforco.trim()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || !valid) return
    setSaving(true)

    const payload = {
      user_id:    userId,
      date,
      atacou:     form.atacou.trim(),
      resistiu:   form.resistiu.trim(),
      reforco:    form.reforco.trim(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('diary_entries')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single()

    setSaving(false)
    if (!error && data) {
      onSaved(data as DiaryEntry)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  function set(key: FieldKey, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  const isEdit = !!initial
  const isToday = date === today()

  return (
    <form onSubmit={submit} className="space-y-3">
      {FIELDS.map(f => (
        <div key={f.key} className="space-y-1">
          <label className="flex items-center gap-1.5 text-[11px] font-black tracking-wider text-muted uppercase">
            <span>{f.icon}</span>
            {f.label}
          </label>
          <textarea
            value={form[f.key]}
            onChange={e => set(f.key, e.target.value)}
            placeholder={f.placeholder}
            rows={3}
            maxLength={500}
            className="w-full bg-surface2 border border-border rounded-sm px-3 py-2 text-[13px] text-text outline-none focus:border-primary resize-none placeholder:text-muted leading-relaxed"
          />
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[10px] text-muted">
          {isEdit
            ? `✎ Editando · ${formatDate(date)}`
            : `+ Nova entrada · ${formatDate(date)}${isToday ? '' : ' (retroativo)'}`}
        </span>
        <button
          type="submit"
          disabled={!valid || saving}
          className="px-5 py-2 rounded-sm text-[12px] font-black tracking-wider text-white disabled:opacity-40 transition-opacity"
          style={{ background: isToday ? '#4a7c59' : '#b8860b' }}
        >
          {saving ? 'Salvando…' : saved ? '✓ Salvo!' : isEdit ? 'Atualizar' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}

// ── Past Entry Card ───────────────────────────────────────────────────────────

function EntryCard({ entry, onEdit }: { entry: DiaryEntry; onEdit?: () => void }) {
  const [open, setOpen] = useState(false)
  const isToday = entry.date === today()

  return (
    <div
      className="rounded-card overflow-hidden"
      style={{
        border: isToday ? '1.5px solid rgba(74,124,89,0.4)' : '1px solid rgb(var(--color-border))',
        background: isToday ? 'rgba(74,124,89,0.04)' : 'rgb(var(--color-surface))',
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface2/50 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3">
          {isToday && (
            <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full text-white"
              style={{ background: '#4a7c59' }}>
              HOJE
            </span>
          )}
          <div>
            <div className="text-[13px] font-bold text-text">{formatDate(entry.date)}</div>
            {!isToday && (
              <div className="text-[10px] text-muted">{daysSince(entry.date)}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit() }}
              className="text-[10px] text-muted hover:text-text px-2 py-0.5 border border-border rounded-sm transition-colors"
            >
              ✎ editar
            </button>
          )}
          <span className="text-muted text-[12px]">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Collapsed preview */}
      {!open && (
        <div className="px-4 pb-3 grid grid-cols-3 gap-3">
          {FIELDS.map(f => (
            <div key={f.key} className="min-w-0">
              <div className="text-[9px] font-bold text-muted uppercase tracking-wider mb-0.5">
                {f.icon} {f.label.split(' ').slice(0, 2).join(' ')}
              </div>
              <div className="text-[11px] text-text line-clamp-2 leading-snug">
                {entry[f.key] || <span className="text-muted italic">—</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded full view */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/40 pt-3">
          {FIELDS.map(f => (
            <div key={f.key}>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted mb-1">
                <span>{f.icon}</span>
                {f.label}
              </div>
              <div className="text-[13px] text-text leading-relaxed whitespace-pre-wrap bg-surface2 rounded-sm px-3 py-2.5">
                {entry[f.key] || <span className="italic text-muted">Não preenchido.</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

const yesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localDate(d)
}

export function Diario() {
  const userId = useStore(s => s.userId)

  const [entries,    setEntries]    = useState<DiaryEntry[]>([])
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(false)
  const [search,     setSearch]     = useState('')
  const [error,      setError]      = useState<string | null>(null)
  const [retroOpen,  setRetroOpen]  = useState(false)
  const [retroDate,  setRetroDate]  = useState(yesterday)
  const [editingEntry, setEditingEntry] = useState<string | null>(null)  // date string

  const todayEntry = entries.find(e => e.date === today())
  const showForm   = !todayEntry || editing
  const retroEntry = entries.find(e => e.date === retroDate)

  useEffect(() => {
    if (!userId) return
    supabase
      .from('diary_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.code === '42P01'
            ? 'Tabela não encontrada — execute o SQL de criação no Supabase.'
            : error.message)
        } else {
          setEntries((data ?? []) as DiaryEntry[])
        }
        setLoading(false)
      })
  }, [userId])

  function handleSaved(entry: DiaryEntry) {
    setEntries(prev => {
      const without = prev.filter(e => e.date !== entry.date)
      return [entry, ...without].sort((a, b) => b.date.localeCompare(a.date))
    })
    setEditing(false)
    setRetroOpen(false)
    setEditingEntry(null)
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(e =>
      e.atacou.toLowerCase().includes(q) ||
      e.resistiu.toLowerCase().includes(q) ||
      e.reforco.toLowerCase().includes(q) ||
      e.date.includes(q)
    )
  }, [entries, search])

  const streak = useMemo(() => {
    const set = new Set(entries.map(e => e.date))
    let s = 0
    const d = new Date()
    while (true) {
      const key = localDate(d)
      if (!set.has(key)) break
      s++
      d.setDate(d.getDate() - 1)
    }
    return s
  }, [entries])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted text-sm gap-2">
        <span className="animate-spin">⏳</span> Carregando diário…
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-danger/10 border border-danger/30 rounded-card p-5 text-sm text-danger space-y-2">
        <div className="font-bold">Erro ao carregar o diário</div>
        <div className="text-muted">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[20px] font-black text-text tracking-tight">📔 Diário de Operações</div>
          <div className="text-[12px] text-muted mt-0.5">Log diário de guerra — o que atacou, o que resistiu, o que reforçar</div>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-card text-[11px] font-black"
              style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', color: '#d4a017' }}
            >
              🔥 {streak}d consecutivo{streak > 1 ? 's' : ''}
            </div>
          )}
          <div className="text-right">
            <div className="text-[11px] text-muted">{entries.length} entrada{entries.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      {/* Today's form */}
      <div
        className="rounded-card p-5 space-y-4"
        style={{
          background: showForm ? 'rgba(74,124,89,0.04)' : undefined,
          border: showForm ? '1.5px solid rgba(74,124,89,0.3)' : '1px solid rgb(var(--color-border))',
        }}
      >
        {showForm ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest text-success uppercase">
                ★ Entrada de hoje · {formatDate(today())}
              </span>
              {editing && (
                <button onClick={() => setEditing(false)} className="text-[10px] text-muted hover:text-text ml-auto">
                  cancelar
                </button>
              )}
            </div>
            <EntryForm date={today()} initial={todayEntry} onSaved={handleSaved} />
          </>
        ) : (
          todayEntry && <EntryCard entry={todayEntry} onEdit={() => setEditing(true)} />
        )}
      </div>

      {/* ── Entrada retroativa ─────────────────────────────────────────────── */}
      {!retroOpen ? (
        <button
          onClick={() => setRetroOpen(true)}
          className="w-full py-2 rounded-sm border border-dashed text-[11px] font-bold tracking-wider transition-colors text-muted hover:text-text hover:border-accent"
          style={{ borderColor: 'rgba(212,160,23,0.30)' }}
        >
          ↩ Registrar dia anterior
        </button>
      ) : (
        <div
          className="rounded-card p-5 space-y-4"
          style={{ border: '1.5px solid rgba(212,160,23,0.35)', background: 'rgba(212,160,23,0.03)' }}
        >
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#d4a017' }}>
              ↩ Entrada retroativa
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={retroDate}
                max={yesterday()}
                min={(() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return localDate(d) })()}
                onChange={e => setRetroDate(e.target.value)}
                className="text-[12px] bg-surface2 border border-border rounded-sm px-2.5 py-1 text-text outline-none focus:border-accent"
                style={{ colorScheme: 'dark' }}
              />
              <button
                onClick={() => setRetroOpen(false)}
                className="text-[11px] text-muted hover:text-text transition-colors"
              >
                cancelar
              </button>
            </div>
          </div>
          {retroEntry && (
            <div className="text-[10px] text-accent font-bold">
              ⚠ Já existe uma entrada para este dia — ela será sobrescrita ao salvar.
            </div>
          )}
          <EntryForm date={retroDate} initial={retroEntry} onSaved={handleSaved} />
        </div>
      )}

      {/* Search + log */}
      {entries.filter(e => e.date !== today()).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-bold text-text">Log de guerra</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar no diário…"
              className="text-[12px] bg-surface border border-border rounded-lg px-3 py-1.5 text-text placeholder:text-muted outline-none focus:border-primary w-52"
            />
          </div>

          {filtered.filter(e => e.date !== today()).length === 0 ? (
            <div className="text-center text-muted text-sm py-8">Nenhuma entrada encontrada.</div>
          ) : (
            <div className="space-y-2">
              {filtered
                .filter(e => e.date !== today())
                .map(entry => (
                  editingEntry === entry.date ? (
                    <div
                      key={entry.id}
                      className="rounded-card p-5 space-y-4"
                      style={{ border: '1.5px solid rgba(212,160,23,0.35)', background: 'rgba(212,160,23,0.03)' }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: '#d4a017' }}>
                          ✎ Editando · {formatDate(entry.date)}
                        </span>
                        <button onClick={() => setEditingEntry(null)} className="text-[10px] text-muted hover:text-text ml-auto">
                          cancelar
                        </button>
                      </div>
                      <EntryForm date={entry.date} initial={entry} onSaved={handleSaved} />
                    </div>
                  ) : (
                    <EntryCard key={entry.id} entry={entry} onEdit={() => setEditingEntry(entry.date)} />
                  )
                ))
              }
            </div>
          )}
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center text-muted text-sm py-8">
          Primeira entrada do seu diário de operações. Registre o dia acima.
        </div>
      )}
    </div>
  )
}
