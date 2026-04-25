import { useState, useMemo } from 'react'
import { useStore } from '@/store'
import type { Flashcard, Session } from '@/types'
import { WeeklyReport } from './WeeklyReport'

type Tab = 'semana' | 'questoes'

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

function AccBar({ value, empty }: { value: number; empty?: boolean }) {
  if (empty) return <span className="text-muted text-[11px] text-center block">—</span>
  const color = value >= 75 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-danger'
  const text  = value >= 75 ? 'text-success' : value >= 50 ? 'text-warning' : 'text-danger'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-surface3 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-[11px] font-bold tabular-nums w-8 text-right ${text}`}>{value}%</span>
    </div>
  )
}

function ratingLabel(r: 1 | 2 | 3) {
  return r === 3 ? 'Fácil' : r === 2 ? 'Normal' : 'Difícil'
}
function ratingColor(r: 1 | 2 | 3) {
  return r === 3 ? 'bg-success/20 text-success border-success/30'
       : r === 2 ? 'bg-warning/20 text-warning border-warning/30'
       :           'bg-danger/20  text-danger  border-danger/30'
}

function StatCard({ label, value, color = 'text-text' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-surface border border-border rounded-card px-4 py-3 text-center">
      <div className={`text-xl font-black ${color}`}>{value}</div>
      <div className="text-[11px] text-muted mt-0.5">{label}</div>
    </div>
  )
}

const COLS = '1.6fr 90px 80px 60px 52px 52px 60px 76px 72px 20px'

// ─── Linha de flashcard ───────────────────────────────────────────────────────

function FlashcardRow({ card, expanded, onToggle }: {
  card: Flashcard; expanded: boolean; onToggle: () => void
}) {
  const hasReviews = card.reviews.length > 0
  const total      = card.reviews.length
  const acertos    = card.reviews.filter(r => r.rating >= 2).length
  const erros      = card.reviews.filter(r => r.rating === 1).length
  const taxa       = pct(acertos, total)
  const last       = hasReviews ? card.reviews[card.reviews.length - 1] : null

  return (
    <div className="border-b border-border/50 last:border-0">
      <div
        className="grid gap-2 px-3 py-2.5 hover:bg-surface2/50 cursor-pointer transition-colors text-[12px] items-center"
        style={{ gridTemplateColumns: COLS }}
        onClick={onToggle}
      >
        <span className="text-text font-medium truncate pr-2">{card.q}</span>
        <span className="text-muted truncate">{card.disc}</span>
        <span className="text-muted truncate">{card.mat}</span>
        <span className="text-muted text-center">{card.banca || '—'}</span>
        <span className={`font-bold text-center tabular-nums ${hasReviews ? 'text-success' : 'text-muted'}`}>
          {hasReviews ? acertos : '—'}
        </span>
        <span className={`font-bold text-center tabular-nums ${hasReviews ? 'text-danger' : 'text-muted'}`}>
          {hasReviews ? erros : '—'}
        </span>
        <AccBar value={taxa} empty={!hasReviews} />
        <span className="text-muted font-mono text-[11px] text-center">
          {last ? new Date(last.ts).toLocaleDateString('pt-BR') : '—'}
        </span>
        {last
          ? <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border text-center ${ratingColor(last.rating)}`}>
              {ratingLabel(last.rating)}
            </span>
          : <span className="text-muted text-center text-[11px]">—</span>
        }
        <span className="text-muted text-center select-none">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 bg-surface2/30">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Enunciado</div>
              <div className="text-[13px] text-text leading-relaxed whitespace-pre-wrap bg-surface border border-border rounded-sm px-3 py-2">{card.q}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Resposta</div>
              <div className="text-[13px] text-text leading-relaxed whitespace-pre-wrap bg-surface border border-border rounded-sm px-3 py-2">{card.a}</div>
            </div>
          </div>
          {hasReviews ? (
            <>
              <div className="flex gap-4 text-[11px]">
                <span className="text-muted">Fácil/Normal: <span className="text-success font-bold">{acertos}</span></span>
                <span className="text-muted">Difícil: <span className="text-danger font-bold">{erros}</span></span>
                <span className="text-muted">Total revisões: <span className="text-text font-bold">{total}</span></span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {card.reviews.map((r, i) => (
                  <span key={i} title={new Date(r.ts).toLocaleString('pt-BR')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ratingColor(r.rating)}`}
                  >
                    {ratingLabel(r.rating)}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="text-[12px] text-muted italic">Ainda não revisado.</div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Linha de sessão (QConcursos / manual) ────────────────────────────────────

function SessionRow({ s, expanded, onToggle }: {
  s: Session; expanded: boolean; onToggle: () => void
}) {
  const acertos = s.correct
  const erros   = s.total - s.correct
  const taxa    = pct(acertos, s.total)

  return (
    <div className="border-b border-border/50 last:border-0">
      <div
        className="grid gap-2 px-3 py-2.5 hover:bg-surface2/50 cursor-pointer transition-colors text-[12px] items-center"
        style={{ gridTemplateColumns: COLS }}
        onClick={onToggle}
      >
        <span className="text-dim italic truncate pr-2">Sem enunciado</span>
        <span className="text-muted truncate">{s.disc}</span>
        <span className="text-muted truncate">{s.mat}</span>
        <span className="text-muted text-center">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            s.source === 'QConcursos'
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-surface3 text-muted border border-border'
          }`}>
            {s.source === 'QConcursos' ? 'QC' : s.banca || '—'}
          </span>
        </span>
        <span className="text-success font-bold text-center tabular-nums">{acertos}</span>
        <span className="text-danger font-bold text-center tabular-nums">{erros}</span>
        <AccBar value={taxa} />
        <span className="text-muted font-mono text-[11px] text-center">{s.date}</span>
        <span className="text-muted text-center text-[11px]">—</span>
        <span className="text-muted text-center select-none">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-4 pb-3 pt-1 bg-surface2/30 text-[12px] text-muted space-y-1">
          <div>Disciplina: <span className="text-text">{s.disc}</span> · Matéria: <span className="text-text">{s.mat}</span></div>
          <div>Banca: <span className="text-text">{s.banca || '—'}</span> · Origem: <span className="text-text">{s.source ?? 'manual'}</span></div>
          <div className="italic">Enunciado não armazenado — registrado via {s.source === 'QConcursos' ? 'extensão QConcursos' : 'registro manual'}.</div>
        </div>
      )}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

type SortKey = 'criacao' | 'erros' | 'taxa_asc' | 'taxa_desc' | 'revisoes'

type Row =
  | { kind: 'flashcard'; card: Flashcard; disc: string; mat: string; ts: number; acertos: number; erros: number }
  | { kind: 'session';   session: Session; disc: string; mat: string; ts: number; acertos: number; erros: number }

export function Relatorio() {
  const flashcards = useStore(s => s.flashcards)
  const sessions   = useStore(s => s.sessions)

  const [tab, setTab] = useState<Tab>('semana')
  const [search, setSearch]         = useState('')
  const [discFilter, setDiscFilter] = useState('todas')
  const [sort, setSort]             = useState<SortKey>('criacao')
  const [expanded, setExpanded]     = useState<Set<string>>(new Set())

  // Sessões que não são oriundas de revisão de flashcard
  const externalSessions = useMemo(() =>
    sessions.filter(s => s.source !== 'flashcard'),
    [sessions]
  )

  const allRows = useMemo((): Row[] => [
    ...flashcards.map(c => ({
      kind: 'flashcard' as const,
      card: c,
      disc: c.disc,
      mat:  c.mat,
      ts:   c.ts,
      acertos: c.reviews.filter(r => r.rating >= 2).length,
      erros:   c.reviews.filter(r => r.rating === 1).length,
    })),
    ...externalSessions.map(s => ({
      kind: 'session' as const,
      session: s,
      disc: s.disc,
      mat:  s.mat,
      ts:   s.ts,
      acertos: s.correct,
      erros:   s.total - s.correct,
    })),
  ], [flashcards, externalSessions])

  const discs = useMemo(() =>
    ['todas', ...[...new Set(allRows.map(r => r.disc))].filter(Boolean).sort()],
    [allRows]
  )

  const filtered = useMemo(() => {
    let list = allRows
    if (discFilter !== 'todas') list = list.filter(r => r.disc === discFilter)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r => {
        if (r.kind === 'flashcard') {
          return r.card.q.toLowerCase().includes(q) || r.mat.toLowerCase().includes(q) || r.card.banca.toLowerCase().includes(q)
        }
        return r.disc.toLowerCase().includes(q) || r.mat.toLowerCase().includes(q) || r.session.banca.toLowerCase().includes(q)
      })
    }
    return list.slice().sort((a, b) => {
      if (sort === 'erros')     return b.erros - a.erros
      if (sort === 'taxa_asc')  return pct(a.acertos, a.acertos + a.erros) - pct(b.acertos, b.acertos + b.erros)
      if (sort === 'taxa_desc') return pct(b.acertos, b.acertos + b.erros) - pct(a.acertos, a.acertos + a.erros)
      if (sort === 'revisoes')  return (b.kind === 'flashcard' ? b.card.reviews.length : 0) - (a.kind === 'flashcard' ? a.card.reviews.length : 0)
      return b.ts - a.ts
    })
  }, [allRows, discFilter, search, sort])

  const totals = useMemo(() => {
    const acertos = filtered.reduce((s, r) => s + r.acertos, 0)
    const erros   = filtered.reduce((s, r) => s + r.erros, 0)
    const semRevisao = filtered.filter(r => r.kind === 'flashcard' && r.card.reviews.length === 0).length
    return { total: filtered.length, acertos, erros, semRevisao, taxa: pct(acertos, acertos + erros) }
  }, [filtered])

  function toggle(id: string) {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function downloadCsv() {
    const date = new Date().toISOString().slice(0, 10)
    const rows: string[][] = [
      ['Enunciado', 'Resposta', 'Disciplina', 'Matéria', 'Banca', 'Origem', 'Acertos', 'Erros', 'Taxa (%)', 'Última Revisão', 'Último Rating'],
      ...filtered.map(r => {
        if (r.kind === 'flashcard') {
          const c        = r.card
          const last     = c.reviews.length > 0 ? c.reviews[c.reviews.length - 1] : null
          const acertos  = c.reviews.filter(rv => rv.rating >= 2).length
          const erros    = c.reviews.filter(rv => rv.rating === 1).length
          return [c.q, c.a, c.disc, c.mat, c.banca, 'flashcard', String(acertos), String(erros),
            String(pct(acertos, c.reviews.length)),
            last ? new Date(last.ts).toLocaleDateString('pt-BR') : '',
            last ? ratingLabel(last.rating) : '']
        }
        const s = r.session
        return ['', '', s.disc, s.mat, s.banca, s.source ?? 'manual',
          String(s.correct), String(s.total - s.correct), String(pct(s.correct, s.total)), s.date, '']
      }),
    ]
    const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`
    const csv    = rows.map(row => row.map(escape).join(',')).join('\r\n')
    const blob   = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    a.href = url; a.download = `studybi-questoes-${date}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const taxaColor = totals.taxa >= 75 ? 'text-success' : totals.taxa >= 50 ? 'text-warning' : 'text-danger'

  return (
    <div className="space-y-4">
      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-border pb-0">
        {([['semana', '📊 Relatório Semanal'], ['questoes', '📋 Questões & Flashcards']] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[12px] font-bold rounded-t-sm transition-colors -mb-px border ${
              tab === t
                ? 'bg-surface border-border border-b-surface text-text'
                : 'bg-transparent border-transparent text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'semana' && <WeeklyReport />}

      {tab === 'questoes' && <div className="space-y-3">
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Total"          value={totals.total} />
        <StatCard label="Sem revisão"    value={totals.semRevisao}  color="text-muted" />
        <StatCard label="Acertos"        value={totals.acertos}     color="text-success" />
        <StatCard label="Erros"          value={totals.erros}       color="text-danger" />
        <StatCard label="Aproveitamento" value={`${totals.taxa}%`}  color={taxaColor} />
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {discs.map(d => (
          <button key={d} onClick={() => setDiscFilter(d)}
            className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
              discFilter === d ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-muted hover:text-text'
            }`}
          >{d}</button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar enunciado, matéria, banca…"
          className="ml-auto text-[12px] bg-surface border border-border rounded-lg px-3 py-1.5 text-text placeholder:text-muted outline-none focus:border-primary w-56"
        />
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
          className="text-[11px] bg-surface border border-border rounded-lg px-2 py-1.5 text-muted outline-none focus:border-primary"
        >
          <option value="criacao">Mais recentes</option>
          <option value="erros">Mais erros</option>
          <option value="taxa_asc">Menor taxa</option>
          <option value="taxa_desc">Maior taxa</option>
          <option value="revisoes">Mais revisadas</option>
        </select>
        <button onClick={downloadCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] font-bold bg-surface2 border border-border text-muted hover:text-text hover:border-primary2 transition-all"
        >
          ↓ Exportar CSV
        </button>
      </div>

      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <div className="grid gap-2 px-3 py-2 bg-surface2 border-b border-border text-[10px] font-bold text-muted uppercase tracking-wider"
          style={{ gridTemplateColumns: COLS }}
        >
          <span>Enunciado</span>
          <span>Disciplina</span>
          <span>Matéria</span>
          <span className="text-center">Banca</span>
          <span className="text-center text-success">Acertos</span>
          <span className="text-center text-danger">Erros</span>
          <span className="text-center">Taxa</span>
          <span className="text-center">Data</span>
          <span className="text-center">Últ. Rating</span>
          <span />
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-muted text-sm">
            {allRows.length === 0 ? 'Nenhuma questão registrada ainda.' : 'Nenhuma questão encontrada com esse filtro.'}
          </div>
        ) : (
          <div className="overflow-y-auto" style={{ maxHeight: 540 }}>
            {filtered.map(r =>
              r.kind === 'flashcard'
                ? <FlashcardRow key={r.card.id}      card={r.card}       expanded={expanded.has(r.card.id)}      onToggle={() => toggle(r.card.id)} />
                : <SessionRow   key={r.session.id}   s={r.session}       expanded={expanded.has(r.session.id)}   onToggle={() => toggle(r.session.id)} />
            )}
          </div>
        )}
      </div>

      <div className="text-[11px] text-muted text-center">
        {filtered.length} questão(ões) · clique em uma linha para expandir
      </div>
      </div>}
    </div>
  )
}
