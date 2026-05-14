import { useState, useEffect, useMemo, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Underline } from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Note {
  id:         string
  title:      string
  content:    string
  disc:       string
  mat:        string
  created_at: string
  updated_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function wordCount(html: string) {
  const text = stripHtml(html)
  return text ? text.split(' ').length : 0
}

function formatRelative(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return 'agora'
  if (diff < 3600)  return `${Math.floor(diff / 60)} min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// ── Color / Highlight presets ─────────────────────────────────────────────────

const TEXT_COLORS = [
  { label: 'Padrão',   value: 'inherit' },
  { label: 'Verde',    value: '#4a7c59' },
  { label: 'Âmbar',   value: '#d4a017' },
  { label: 'Vermelho', value: '#c0392b' },
  { label: 'Azul',     value: '#2563eb' },
  { label: 'Roxo',     value: '#7c3aed' },
  { label: 'Cinza',    value: '#64748b' },
]

const HIGHLIGHT_COLORS = [
  { label: 'Amarelo', value: '#fef08a' },
  { label: 'Verde',   value: '#bbf7d0' },
  { label: 'Rosa',    value: '#fecdd3' },
  { label: 'Azul',    value: '#bfdbfe' },
  { label: 'Laranja', value: '#fed7aa' },
  { label: 'Roxo',    value: '#e9d5ff' },
]

// ── Toolbar button ─────────────────────────────────────────────────────────────

function ToolBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?:  boolean
  onClick:  () => void
  title:    string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded text-[12px] font-bold transition-all"
      style={
        active
          ? { background: 'rgba(74,124,89,0.15)', color: '#4a7c59' }
          : { color: '#64748b' }
      }
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgb(var(--color-surface2))' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

// ── Color menu ────────────────────────────────────────────────────────────────

function ColorMenu({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false)
  if (!editor) return null

  return (
    <div className="relative">
      <button
        type="button"
        title="Cor do texto"
        onClick={() => setOpen(v => !v)}
        className="w-7 h-7 flex flex-col items-center justify-center gap-0.5 rounded transition-colors hover:bg-surface3"
      >
        <span className="text-[11px] font-black text-text leading-none">A</span>
        <span
          className="h-1 w-4 rounded-full"
          style={{ background: editor.getAttributes('textStyle').color ?? '#0f172a' }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-surface border border-border rounded-card shadow-lg p-2 flex flex-col gap-1 min-w-[120px]">
            {TEXT_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  if (c.value === 'inherit') editor.chain().focus().unsetColor().run()
                  else editor.chain().focus().setColor(c.value).run()
                  setOpen(false)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface2 text-left text-[11px] text-text transition-colors"
              >
                <span
                  className="w-4 h-4 rounded-full border border-border/60 shrink-0"
                  style={{ background: c.value === 'inherit' ? 'rgb(var(--color-surface2))' : c.value }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Highlight menu ────────────────────────────────────────────────────────────

function HighlightMenu({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false)
  if (!editor) return null

  const active = editor.isActive('highlight')

  return (
    <div className="relative">
      <button
        type="button"
        title="Realce de texto"
        onClick={() => setOpen(v => !v)}
        className="w-7 h-7 flex flex-col items-center justify-center gap-0.5 rounded transition-colors hover:bg-surface3"
        style={active ? { background: 'rgba(212,160,23,0.15)' } : {}}
      >
        <span className="text-[11px] leading-none">🖊</span>
        <span
          className="h-1 w-4 rounded-full"
          style={{ background: editor.getAttributes('highlight').color ?? '#fef08a' }}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-surface border border-border rounded-card shadow-lg p-2 space-y-1 min-w-[120px]">
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => {
                  editor.chain().focus().setHighlight({ color: c.value }).run()
                  setOpen(false)
                }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface2 text-left text-[11px] text-text w-full transition-colors"
              >
                <span className="w-4 h-4 rounded border border-border/40 shrink-0" style={{ background: c.value }} />
                {c.label}
              </button>
            ))}
            <div className="border-t border-border/40 pt-1">
              <button
                type="button"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setOpen(false) }}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface2 text-left text-[11px] text-muted w-full transition-colors"
              >
                <span className="w-4 h-4 rounded border border-border/60 bg-surface3 shrink-0" />
                Remover realce
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Toolbar separator ──────────────────────────────────────────────────────────

function Sep() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />
}

// ── Symbol menu ───────────────────────────────────────────────────────────────

const SYMBOL_GROUPS = [
  {
    label: 'Lógica proposicional',
    symbols: [
      { sym: '¬', title: 'Negação (NOT)'         },
      { sym: '∧', title: 'Conjunção (AND)'        },
      { sym: '∨', title: 'Disjunção (OR)'         },
      { sym: '→', title: 'Implicação'             },
      { sym: '↔', title: 'Bicondicional'          },
      { sym: '⊕', title: 'Disjunção exclusiva (XOR)' },
      { sym: '⊤', title: 'Tautologia (Verdadeiro)' },
      { sym: '⊥', title: 'Contradição (Falso)'   },
      { sym: '∴', title: 'Portanto'               },
      { sym: '∵', title: 'Porque'                 },
    ],
  },
  {
    label: 'Conjuntos',
    symbols: [
      { sym: '∈', title: 'Pertence a'             },
      { sym: '∉', title: 'Não pertence a'         },
      { sym: '⊂', title: 'Subconjunto próprio'    },
      { sym: '⊆', title: 'Subconjunto'            },
      { sym: '⊃', title: 'Superconjunto próprio'  },
      { sym: '∩', title: 'Interseção'             },
      { sym: '∪', title: 'União'                  },
      { sym: '∅', title: 'Conjunto vazio'         },
      { sym: '∀', title: 'Para todo'              },
      { sym: '∃', title: 'Existe'                 },
    ],
  },
  {
    label: 'Matemática',
    symbols: [
      { sym: '≠', title: 'Diferente de'           },
      { sym: '≤', title: 'Menor ou igual'         },
      { sym: '≥', title: 'Maior ou igual'         },
      { sym: '≈', title: 'Aproximadamente'        },
      { sym: '±', title: 'Mais ou menos'          },
      { sym: '√', title: 'Raiz quadrada'          },
      { sym: '∞', title: 'Infinito'               },
      { sym: 'Σ', title: 'Somatório'              },
      { sym: 'Π', title: 'Produtório'             },
      { sym: '²', title: 'Quadrado (²)'           },
      { sym: '³', title: 'Cubo (³)'               },
      { sym: 'ⁿ', title: 'Potência n'             },
      { sym: '½', title: 'Um meio'                },
      { sym: '¼', title: 'Um quarto'              },
      { sym: '¾', title: 'Três quartos'           },
    ],
  },
  {
    label: 'Letras gregas',
    symbols: [
      { sym: 'α', title: 'alfa'   }, { sym: 'β', title: 'beta'   },
      { sym: 'γ', title: 'gama'   }, { sym: 'δ', title: 'delta'  },
      { sym: 'ε', title: 'épsilon'}, { sym: 'θ', title: 'teta'   },
      { sym: 'λ', title: 'lambda' }, { sym: 'μ', title: 'mi'     },
      { sym: 'π', title: 'pi'     }, { sym: 'σ', title: 'sigma'  },
      { sym: 'φ', title: 'fi'     }, { sym: 'ω', title: 'ômega'  },
      { sym: 'Δ', title: 'Delta'  }, { sym: 'Γ', title: 'Gama'   },
      { sym: 'Λ', title: 'Lambda' }, { sym: 'Ω', title: 'Ômega'  },
    ],
  },
]

function SymbolMenu({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open, setOpen] = useState(false)
  if (!editor) return null

  function insert(sym: string) {
    editor.chain().focus().insertContent(sym).run()
    // keep panel open so user can insert multiple symbols
  }

  return (
    <div className="relative">
      <button
        type="button"
        title="Símbolos matemáticos e lógicos"
        onClick={() => setOpen(v => !v)}
        className="px-1.5 h-7 flex items-center justify-center rounded text-[11px] font-bold transition-colors hover:bg-surface3 text-muted whitespace-nowrap"
        style={open ? { background: 'rgba(74,124,89,0.12)', color: '#4a7c59' } : {}}
      >
        Ω ¬
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 mt-1 z-20 bg-surface border border-border rounded-card shadow-xl p-3 space-y-3"
            style={{ width: 300 }}
          >
            <div className="text-[10px] font-black tracking-wider text-muted uppercase">
              Símbolos — clique para inserir
            </div>
            {SYMBOL_GROUPS.map(group => (
              <div key={group.label} className="space-y-1.5">
                <div className="text-[9px] font-bold text-muted uppercase tracking-wider border-b border-border/50 pb-0.5">
                  {group.label}
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.symbols.map(({ sym, title }) => (
                    <button
                      key={sym}
                      type="button"
                      title={title}
                      onClick={() => insert(sym)}
                      className="w-8 h-8 flex items-center justify-center rounded border border-border text-[15px] hover:border-primary hover:bg-primary/10 transition-colors font-mono tabular-nums"
                      style={{ fontFamily: "'Noto Serif', 'Georgia', serif" }}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-[9px] text-muted pt-1 border-t border-border/40">
              Dica: passe o mouse para ver o nome do símbolo
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Table menu ────────────────────────────────────────────────────────────────

const GRID_ROWS = 6
const GRID_COLS = 6

function TableMenu({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [open,     setOpen]     = useState(false)
  const [hoverRow, setHoverRow] = useState(0)
  const [hoverCol, setHoverCol] = useState(0)
  if (!editor) return null

  const inTable = editor.isActive('table')

  function insertTable() {
    if (hoverRow < 1 || hoverCol < 1) return
    editor.chain().focus().insertTable({ rows: hoverRow, cols: hoverCol, withHeaderRow: true }).run()
    setOpen(false)
    setHoverRow(0)
    setHoverCol(0)
  }

  function cmd(fn: () => void) {
    fn()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        title={inTable ? 'Editar tabela' : 'Inserir tabela'}
        onClick={() => setOpen(v => !v)}
        className="px-1.5 h-7 flex items-center justify-center rounded text-[12px] transition-colors hover:bg-surface3 text-muted whitespace-nowrap"
        style={(inTable || open) ? { background: 'rgba(74,124,89,0.12)', color: '#4a7c59' } : {}}
      >
        ⊞
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-surface border border-border rounded-card shadow-xl p-3 space-y-2.5" style={{ minWidth: 210 }}>
            {inTable ? (
              <>
                <div className="text-[9px] font-black tracking-wider text-muted uppercase">Editar tabela</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: '↑ Linha acima',   fn: () => editor.chain().focus().addRowBefore().run(),    danger: false },
                    { label: '↓ Linha abaixo',  fn: () => editor.chain().focus().addRowAfter().run(),     danger: false },
                    { label: '← Col. à esq.',   fn: () => editor.chain().focus().addColumnBefore().run(), danger: false },
                    { label: '→ Col. à dir.',   fn: () => editor.chain().focus().addColumnAfter().run(),  danger: false },
                    { label: '✕ Apagar linha',  fn: () => editor.chain().focus().deleteRow().run(),       danger: true  },
                    { label: '✕ Apagar coluna', fn: () => editor.chain().focus().deleteColumn().run(),    danger: true  },
                  ].map(({ label, fn, danger }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => cmd(fn)}
                      className="text-[10px] px-2 py-1.5 rounded border text-left transition-colors"
                      style={{
                        borderColor: danger ? 'rgba(192,57,43,0.35)' : 'rgb(var(--color-border))',
                        color: danger ? '#c0392b' : 'rgb(var(--color-text))',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = danger ? 'rgba(192,57,43,0.08)' : 'rgb(var(--color-surface2))' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => cmd(() => editor.chain().focus().toggleHeaderRow().run())}
                    className="col-span-2 text-[10px] px-2 py-1.5 rounded border text-left transition-colors text-text"
                    style={{ borderColor: 'rgb(var(--color-border))' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgb(var(--color-surface2))' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    ⬚ Alternar cabeçalho
                  </button>
                  <button
                    type="button"
                    onClick={() => cmd(() => editor.chain().focus().deleteTable().run())}
                    className="col-span-2 text-[10px] px-2 py-1.5 rounded border text-left font-bold transition-colors"
                    style={{ borderColor: 'rgba(192,57,43,0.45)', color: '#c0392b' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(192,57,43,0.08)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    🗑 Excluir tabela
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-[9px] font-black tracking-wider text-muted uppercase">
                  {hoverRow > 0 && hoverCol > 0 ? `${hoverRow} × ${hoverCol}` : 'Inserir tabela'}
                </div>
                <div
                  className="grid gap-0.5"
                  style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
                  onMouseLeave={() => { setHoverRow(0); setHoverCol(0) }}
                >
                  {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
                    const row = Math.floor(i / GRID_COLS) + 1
                    const col = (i % GRID_COLS) + 1
                    const active = row <= hoverRow && col <= hoverCol
                    return (
                      <button
                        key={i}
                        type="button"
                        className="w-7 h-7 rounded border transition-colors"
                        style={{
                          background:   active ? 'rgba(74,124,89,0.18)' : 'rgb(var(--color-surface2))',
                          borderColor:  active ? 'rgba(74,124,89,0.50)' : 'rgb(var(--color-border))',
                        }}
                        onMouseEnter={() => { setHoverRow(row); setHoverCol(col) }}
                        onClick={insertTable}
                      />
                    )
                  })}
                </div>
                <div className="text-[9px] text-muted">Passe o mouse e clique para inserir</div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Menu bar ──────────────────────────────────────────────────────────────────

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border bg-surface2/70 flex-wrap shrink-0">
      {/* Text style */}
      <ToolBtn active={editor.isActive('bold')}      onClick={() => editor.chain().focus().toggleBold().run()}          title="Negrito (Ctrl+B)">B</ToolBtn>
      <ToolBtn active={editor.isActive('italic')}    onClick={() => editor.chain().focus().toggleItalic().run()}        title="Itálico (Ctrl+I)"><em>I</em></ToolBtn>
      <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}     title="Sublinhado (Ctrl+U)"><u>U</u></ToolBtn>
      <ToolBtn active={editor.isActive('strike')}    onClick={() => editor.chain().focus().toggleStrike().run()}        title="Tachado"><s>S</s></ToolBtn>

      <Sep />

      {/* Headings */}
      <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Título 1">H1</ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">H2</ToolBtn>
      <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Título 3">H3</ToolBtn>

      <Sep />

      {/* Lists */}
      <ToolBtn active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="Lista com marcadores">• ≡</ToolBtn>
      <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">1. ≡</ToolBtn>
      <ToolBtn active={editor.isActive('blockquote')}  onClick={() => editor.chain().focus().toggleBlockquote().run()}  title="Citação / destaque">" "</ToolBtn>

      <Sep />

      {/* Color + Highlight */}
      <ColorMenu editor={editor} />
      <HighlightMenu editor={editor} />

      <Sep />

      {/* Table */}
      <TableMenu editor={editor} />

      <Sep />

      {/* Symbols */}
      <SymbolMenu editor={editor} />

      <Sep />

      {/* Undo / Redo */}
      <ToolBtn active={false} onClick={() => editor.chain().focus().undo().run()} title="Desfazer (Ctrl+Z)">↩</ToolBtn>
      <ToolBtn active={false} onClick={() => editor.chain().focus().redo().run()} title="Refazer (Ctrl+Y)">↪</ToolBtn>

      <Sep />

      {/* Horizontal rule */}
      <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linha divisória">—</ToolBtn>
    </div>
  )
}

// ── Note Editor ───────────────────────────────────────────────────────────────

function NoteEditor({
  note,
  discList,
  onUpdated,
  onDelete,
}: {
  note:      Note
  discList:  string[]
  onUpdated: (n: Note) => void
  onDelete:  () => void
}) {
  const userId      = useStore(s => s.userId)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [title,      setTitle]      = useState(note.title)
  const [disc,       setDisc]       = useState(note.disc)
  const [mat,        setMat]        = useState(note.mat)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'dirty' | 'saving'>('saved')
  const [confirmDel, setConfirmDel] = useState(false)

  function schedSave(fn: () => void) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(fn, 1400)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: 'Comece a escrever…' }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: note.content || '',
    onUpdate: () => setSaveStatus('dirty'),
  })

  // Sync when note changes
  useEffect(() => {
    setTitle(note.title)
    setDisc(note.disc)
    setMat(note.mat)
    setSaveStatus('saved')
    setConfirmDel(false)
    if (editor && note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content || '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  // Auto-save
  useEffect(() => {
    if (saveStatus !== 'dirty' || !userId || !editor) return
    schedSave(() => {
      setSaveStatus('saving')
      const content    = editor.getHTML()
      const updated_at = new Date().toISOString()
      supabase
        .from('notes')
        .update({ title, content, disc, mat, updated_at })
        .eq('id', note.id)
        .then(({ error }) => {
          if (!error) {
            setSaveStatus('saved')
            onUpdated({ ...note, title, content, disc, mat, updated_at })
          }
        })
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveStatus, title, disc, mat])

  // Title / disc / mat changes also trigger save
  function changeField(setter: (v: string) => void) {
    return (v: string) => { setter(v); setSaveStatus('dirty') }
  }

  const words = wordCount(editor?.getHTML() ?? '')

  return (
    <div className="flex flex-col h-full">
      {/* Top meta bar */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-border bg-surface2/60 shrink-0 flex-wrap">
        <input
          list="disc-datalist"
          value={disc}
          onChange={e => changeField(setDisc)(e.target.value)}
          placeholder="Disciplina"
          className="text-[11px] font-bold bg-surface border border-border rounded px-2 py-1 text-text outline-none focus:border-primary w-36"
        />
        <datalist id="disc-datalist">
          {discList.map(d => <option key={d} value={d} />)}
        </datalist>
        {disc && <span className="text-muted text-[10px]">›</span>}
        {disc && (
          <input
            value={mat}
            onChange={e => changeField(setMat)(e.target.value)}
            placeholder="Matéria"
            className="text-[11px] bg-surface border border-border rounded px-2 py-1 text-text outline-none focus:border-primary w-36"
          />
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] tabular-nums">
            {saveStatus === 'saving' ? (
              <span className="text-primary animate-pulse">● salvando…</span>
            ) : saveStatus === 'dirty' ? (
              <span className="text-warning">● não salvo</span>
            ) : (
              <span className="text-success">✓ salvo · {formatRelative(note.updated_at)}</span>
            )}
          </span>
          {!confirmDel ? (
            <button
              onClick={() => setConfirmDel(true)}
              className="text-[10px] text-muted hover:text-danger transition-colors px-2 py-1 rounded hover:bg-danger/10"
            >
              🗑 excluir
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-danger font-bold">Confirmar?</span>
              <button onClick={onDelete} className="text-[10px] font-black text-white px-2 py-0.5 rounded" style={{ background: '#c0392b' }}>Sim</button>
              <button onClick={() => setConfirmDel(false)} className="text-[10px] text-muted hover:text-text">Não</button>
            </div>
          )}
        </div>
      </div>

      {/* Formatting toolbar */}
      <MenuBar editor={editor} />

      {/* Title */}
      <div className="px-8 pt-5 pb-2 shrink-0">
        <input
          value={title}
          onChange={e => changeField(setTitle)(e.target.value)}
          placeholder="Título da nota…"
          className="w-full text-[26px] font-black text-text bg-transparent outline-none placeholder:text-muted/40 border-none leading-tight"
        />
        {(disc || mat) && (
          <div className="flex items-center gap-1.5 mt-2">
            {disc && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,124,89,0.1)', color: '#4a7c59', border: '1px solid rgba(74,124,89,0.25)' }}>{disc}</span>}
            {mat  && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,160,23,0.1)', color: '#d4a017', border: '1px solid rgba(212,160,23,0.25)' }}>{mat}</span>}
          </div>
        )}
        <div className="border-b border-border/40 mt-4" />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-8 py-4 cursor-text" onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} className="min-h-full" />
      </div>

      {/* Footer */}
      <div className="px-8 py-2 border-t border-border/40 shrink-0 flex items-center justify-between">
        <span className="text-[10px] text-muted tabular-nums">
          {words} palavra{words !== 1 ? 's' : ''}
        </span>
        <span className="text-[10px] text-muted">
          {new Date(note.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>
    </div>
  )
}

// ── Sidebar list item ──────────────────────────────────────────────────────────

function NoteItem({ note, selected, onClick }: { note: Note; selected: boolean; onClick: () => void }) {
  const preview = stripHtml(note.content).slice(0, 80)

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-card transition-all"
      style={
        selected
          ? { background: 'rgba(74,124,89,0.12)', border: '1px solid rgba(74,124,89,0.30)' }
          : { background: 'transparent', border: '1px solid transparent' }
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-bold text-[12px] text-text truncate leading-tight flex-1">
          {note.title || <span className="text-muted italic">Sem título</span>}
        </div>
        <div className="text-[9px] text-muted shrink-0 mt-0.5 tabular-nums">{formatRelative(note.updated_at)}</div>
      </div>
      {preview && <div className="text-[10px] text-muted mt-0.5 truncate">{preview}</div>}
      {note.mat && <div className="text-[9px] font-bold mt-1" style={{ color: '#d4a017' }}>{note.mat}</div>}
    </button>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ notes, selectedId, search, creating, onSearch, onSelect, onCreate }: {
  notes: Note[]; selectedId: string | null; search: string; creating: boolean
  onSearch: (q: string) => void; onSelect: (id: string) => void; onCreate: () => void
}) {
  const grouped = useMemo(() => {
    const q = search.toLowerCase()
    const filtered = notes.filter(n =>
      !q || [n.title, n.content, n.disc, n.mat].some(s => stripHtml(s).toLowerCase().includes(q))
    )
    const map = new Map<string, Note[]>()
    for (const n of filtered) {
      const key = n.disc || '— Sem disciplina'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(n)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [notes, search])

  return (
    <div className="flex flex-col h-full border-r border-border bg-surface2/40">
      <div className="px-3 pt-4 pb-3 space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="text-[13px] font-black text-text">📓 Caderno</div>
          <span className="text-[10px] text-muted">{notes.length} nota{notes.length !== 1 ? 's' : ''}</span>
        </div>
        <button
          onClick={onCreate}
          disabled={creating}
          className="w-full py-2 rounded-card text-[11px] font-black text-white transition-opacity disabled:opacity-50"
          style={{ background: '#4a7c59' }}
        >
          + Nova nota
        </button>
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Buscar notas…"
          className="w-full text-[11px] bg-surface border border-border rounded px-2.5 py-1.5 text-text placeholder:text-muted outline-none focus:border-primary"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
        {grouped.length === 0 ? (
          <div className="text-center text-[11px] text-muted py-6 px-3 whitespace-pre-line">
            {search ? 'Nenhuma nota encontrada.' : 'Nenhuma nota ainda.\nCrie a primeira acima.'}
          </div>
        ) : grouped.map(([disc, group]) => (
          <div key={disc} className="space-y-0.5">
            <div className="px-3 py-1 text-[9px] font-black tracking-widest text-muted uppercase">{disc}</div>
            {group.map(n => (
              <NoteItem key={n.id} note={n} selected={n.id === selectedId} onClick={() => onSelect(n.id)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onCreate, creating }: { onCreate: () => void; creating: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="text-[48px] select-none">📓</div>
      <div>
        <div className="text-[16px] font-black text-text">Seu caderno está vazio</div>
        <div className="text-[12px] text-muted mt-1 max-w-xs leading-relaxed">
          Crie notas por matéria para organizar conceitos, leis, súmulas e macetes.
        </div>
      </div>
      <button
        onClick={onCreate}
        disabled={creating}
        className="px-6 py-2.5 rounded-card text-[12px] font-black text-white disabled:opacity-50"
        style={{ background: '#4a7c59' }}
      >
        + Criar primeira nota
      </button>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function Caderno() {
  const userId   = useStore(s => s.userId)
  const discMap  = useStore(s => s.disc)
  const discList = Object.keys(discMap).sort()

  const [notes,      setNotes]      = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search,     setSearch]     = useState('')
  const [loading,    setLoading]    = useState(true)
  const [creating,   setCreating]   = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const selectedNote = notes.find(n => n.id === selectedId) ?? null

  useEffect(() => {
    if (!userId) return
    supabase
      .from('notes').select('*').eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.code === '42P01'
            ? 'Tabela não encontrada — execute o SQL de criação no Supabase.'
            : error.message)
        } else {
          const rows = (data ?? []) as Note[]
          setNotes(rows)
          if (rows.length > 0) setSelectedId(rows[0].id)
        }
        setLoading(false)
      })
  }, [userId])

  async function createNote() {
    if (!userId || creating) return
    setCreating(true)
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: userId, title: '', content: '', disc: '', mat: '', updated_at: new Date().toISOString() })
      .select().single()
    setCreating(false)
    if (!error && data) {
      const note = data as Note
      setNotes(prev => [note, ...prev])
      setSelectedId(note.id)
    }
  }

  async function deleteNote() {
    if (!selectedId) return
    await supabase.from('notes').delete().eq('id', selectedId)
    const remaining = notes.filter(n => n.id !== selectedId)
    setNotes(remaining)
    setSelectedId(remaining.length > 0 ? remaining[0].id : null)
  }

  function handleUpdated(updated: Note) {
    setNotes(prev =>
      prev.map(n => n.id === updated.id ? updated : n)
          .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted text-sm gap-2">
        <span className="animate-spin">⏳</span> Carregando caderno…
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto mt-12 bg-danger/10 border border-danger/30 rounded-card p-5 space-y-3">
        <div className="font-bold text-danger text-sm">Erro ao carregar o caderno</div>
        <div className="text-muted text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="flex rounded-card border border-border overflow-hidden bg-surface" style={{ height: 'calc(100vh - 48px)' }}>
      <div className="w-64 shrink-0">
        <Sidebar
          notes={notes} selectedId={selectedId} search={search} creating={creating}
          onSearch={setSearch} onSelect={setSelectedId} onCreate={createNote}
        />
      </div>
      <div className="flex-1 min-w-0">
        {selectedNote
          ? <NoteEditor key={selectedNote.id} note={selectedNote} discList={discList} onUpdated={handleUpdated} onDelete={deleteNote} />
          : <EmptyState onCreate={createNote} creating={creating} />
        }
      </div>
    </div>
  )
}
