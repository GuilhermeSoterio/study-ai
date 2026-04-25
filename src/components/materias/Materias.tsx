import { useState } from 'react'
import { useStore } from '@/store'

function MatChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] bg-surface3 border border-border text-text px-2 py-0.5 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="text-muted hover:text-danger transition-colors leading-none ml-0.5"
        title="Remover matéria"
      >
        ×
      </button>
    </span>
  )
}

function DiscCard({
  name,
  mats,
  onRemoveMat,
  onAddMat,
  onRemoveDisc,
}: {
  name: string
  mats: string[]
  onRemoveMat: (mat: string) => void
  onAddMat: (mat: string) => void
  onRemoveDisc: () => void
}) {
  const [newMat, setNewMat] = useState('')
  const [adding, setAdding] = useState(false)

  function submitMat(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newMat.trim()
    if (!trimmed || mats.includes(trimmed)) return
    onAddMat(trimmed)
    setNewMat('')
    setAdding(false)
  }

  return (
    <div className="bg-surface border border-border rounded-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-text">{name}</span>
        <button
          onClick={onRemoveDisc}
          className="text-[11px] text-danger border border-danger/30 px-2.5 py-1 rounded hover:bg-danger/10 transition-colors shrink-0"
        >
          Apagar disciplina
        </button>
      </div>

      {/* Chips de matérias */}
      <div className="flex flex-wrap gap-1.5">
        {mats.length === 0 && (
          <span className="text-[11px] text-muted italic">Nenhuma matéria</span>
        )}
        {mats.map(m => (
          <MatChip key={m} label={m} onRemove={() => onRemoveMat(m)} />
        ))}
      </div>

      {/* Adicionar matéria */}
      {adding ? (
        <form onSubmit={submitMat} className="flex gap-2">
          <input
            autoFocus
            value={newMat}
            onChange={e => setNewMat(e.target.value)}
            placeholder="Nome da matéria..."
            className="flex-1 text-[12px] bg-surface2 border border-border rounded px-2.5 py-1.5 text-text focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="text-[12px] font-bold text-white bg-primary px-3 py-1.5 rounded hover:opacity-90 transition-opacity"
          >
            Adicionar
          </button>
          <button
            type="button"
            onClick={() => { setAdding(false); setNewMat('') }}
            className="text-[12px] text-muted border border-border px-2.5 py-1.5 rounded hover:text-text transition-colors"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-[11px] text-primary border border-primary/30 px-3 py-1.5 rounded hover:bg-primary/10 transition-colors"
        >
          + Adicionar matéria
        </button>
      )}
    </div>
  )
}

export function Materias() {
  const disc     = useStore(s => s.disc)
  const saveDisc = useStore(s => s.saveDisc)

  const [newDiscName, setNewDiscName] = useState('')
  const [addingDisc, setAddingDisc] = useState(false)
  const [saving, setSaving] = useState(false)

  async function persist(updated: Record<string, string[]>) {
    setSaving(true)
    await saveDisc(updated)
    setSaving(false)
  }

  function addDisc(e: React.FormEvent) {
    e.preventDefault()
    const name = newDiscName.trim()
    if (!name || disc[name]) return
    persist({ ...disc, [name]: [] })
    setNewDiscName('')
    setAddingDisc(false)
  }

  function removeDisc(name: string) {
    const updated = { ...disc }
    delete updated[name]
    persist(updated)
  }

  function addMat(discName: string, mat: string) {
    persist({ ...disc, [discName]: [...(disc[discName] ?? []), mat] })
  }

  function removeMat(discName: string, mat: string) {
    persist({ ...disc, [discName]: (disc[discName] ?? []).filter(m => m !== mat) })
  }

  const discNames = Object.keys(disc)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[13px] font-bold text-text">Disciplinas e Matérias</div>
          <div className="text-[11px] text-muted mt-0.5">
            {discNames.length} disciplina{discNames.length !== 1 ? 's' : ''} ·{' '}
            {Object.values(disc).reduce((s, m) => s + m.length, 0)} matérias no total
          </div>
        </div>
        {saving && (
          <span className="text-[11px] text-accent animate-pulse font-semibold">Salvando…</span>
        )}
      </div>

      {/* Cards de disciplinas */}
      <div className="space-y-3">
        {discNames.map(name => (
          <DiscCard
            key={name}
            name={name}
            mats={disc[name] ?? []}
            onAddMat={mat => addMat(name, mat)}
            onRemoveMat={mat => removeMat(name, mat)}
            onRemoveDisc={() => removeDisc(name)}
          />
        ))}
      </div>

      {/* Adicionar disciplina */}
      {addingDisc ? (
        <form onSubmit={addDisc} className="flex gap-2 mt-2">
          <input
            autoFocus
            value={newDiscName}
            onChange={e => setNewDiscName(e.target.value)}
            placeholder="Nome da disciplina..."
            className="flex-1 text-[13px] bg-surface border border-border rounded-card px-3 py-2 text-text focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="text-[13px] font-bold text-white bg-primary px-4 py-2 rounded-card hover:opacity-90 transition-opacity"
          >
            Criar
          </button>
          <button
            type="button"
            onClick={() => { setAddingDisc(false); setNewDiscName('') }}
            className="text-[13px] text-muted border border-border px-3 py-2 rounded-card hover:text-text transition-colors"
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button
          onClick={() => setAddingDisc(true)}
          className="w-full text-[13px] font-bold text-primary border border-primary/30 border-dashed px-4 py-3 rounded-card hover:bg-primary/5 transition-colors"
        >
          + Nova disciplina
        </button>
      )}
    </div>
  )
}
