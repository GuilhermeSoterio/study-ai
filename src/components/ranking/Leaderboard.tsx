import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store'
import { RANKS } from '@/hooks/useRank'

interface RankingEntry {
  user_id:         string
  display_name:    string
  avatar_url:      string | null
  total_questions: number
  total_correct:   number
  accuracy:        number
  sessions_count:  number
  big_goal:        number
}

function rankFromTotal(total: number, bigGoal: number) {
  const pct = bigGoal > 0 ? Math.min(100, Math.round((total / bigGoal) * 100)) : 0
  let r = RANKS[0]
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (pct >= RANKS[i].min) { r = RANKS[i]; break }
  }
  return { ...r, pct }
}

const POS_ICON  = ['🥇', '🥈', '🥉']
const POS_COLOR = ['#d4a017', '#b0b5bc', '#c8832a']

export function Leaderboard() {
  const userId    = useStore(s => s.userId)
  const userEmail = useStore(s => s.userEmail)

  const [entries,     setEntries]     = useState<RankingEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [editingName, setEditingName] = useState(false)
  const [nameValue,   setNameValue]   = useState('')
  const [saving,      setSaving]      = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function loadRanking() {
    setLoading(true)
    setError(null)
    const { data, error: rpcError } = await supabase.rpc('get_ranking')
    if (rpcError) {
      setError('Função get_ranking não encontrada. Execute o SQL de migração no Supabase.')
    } else {
      setEntries((data as RankingEntry[]) ?? [])
    }
    setLoading(false)
  }

  async function ensureProfile() {
    if (!userId) return

    const { data: existing } = await supabase
      .from('user_profiles')
      .select('display_name')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing?.display_name) return // já tem nome definido, não sobrescreve

    // Busca email direto do auth (mais confiável que o store)
    const { data: { user } } = await supabase.auth.getUser()
    const defaultName = (user?.email ?? userEmail ?? '').split('@')[0]
    if (!defaultName) return

    await supabase
      .from('user_profiles')
      .upsert(
        { user_id: userId, display_name: defaultName, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
  }

  useEffect(() => {
    ensureProfile().then(loadRanking)
  }, [userId])

  useEffect(() => {
    if (editingName) inputRef.current?.focus()
  }, [editingName])

  async function saveName() {
    if (!userId || !nameValue.trim()) return
    setSaving(true)
    await supabase
      .from('user_profiles')
      .upsert({ user_id: userId, display_name: nameValue.trim(), updated_at: new Date().toISOString() },
              { onConflict: 'user_id' })
    setSaving(false)
    setEditingName(false)
    loadRanking()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[22px] font-black text-text tracking-tight">Ranking</div>
          <div className="text-[12px] text-muted mt-0.5">Competição geral entre todos os usuários</div>
        </div>
        <button
          onClick={loadRanking}
          disabled={loading}
          className="text-[11px] text-muted hover:text-text border border-border rounded-sm px-3 py-1.5 transition-colors disabled:opacity-40"
        >
          {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {/* Estado de erro (migração não aplicada) */}
      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-sm p-4 text-[12px] text-danger leading-relaxed">
          <div className="font-bold mb-1">Configuração necessária</div>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="text-center py-16 text-muted text-[12px]">Carregando ranking…</div>
      )}

      {/* Lista vazia */}
      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-16 text-muted text-[12px]">
          Nenhum usuário com sessões registradas ainda.
        </div>
      )}

      {/* Ranking */}
      {!loading && !error && entries.length > 0 && (
        <div className="space-y-2">
          {entries.map((entry, i) => {
            const isMe    = entry.user_id === userId
            const rank    = rankFromTotal(entry.total_questions, entry.big_goal)
            const posColor = i < 3 ? POS_COLOR[i] : 'rgb(var(--color-dim))'
            const posLabel = i < 3 ? POS_ICON[i]  : `#${i + 1}`

            return (
              <div
                key={entry.user_id}
                className="bg-surface border rounded-sm p-4 flex items-center gap-4 transition-all"
                style={{
                  borderColor: isMe ? '#4a7c59' : 'rgb(var(--color-border))',
                  boxShadow:   isMe ? '0 0 0 1px rgba(74,124,89,0.25)' : undefined,
                }}
              >
                {/* Posição */}
                <div
                  className="w-8 text-center font-black shrink-0 select-none"
                  style={{ fontSize: i < 3 ? 22 : 14, color: posColor }}
                >
                  {posLabel}
                </div>

                {/* Foto de perfil / avatar da patente */}
                <div className="relative w-10 h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-[22px] select-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `2px solid ${isMe ? '#4a7c59' : posColor}`,
                  }}
                >
                  {rank.avatar}
                  {entry.avatar_url && (
                    <img src={entry.avatar_url} alt={entry.display_name} className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>

                {/* Nome + patente */}
                <div className="flex-1 min-w-0">
                  {isMe && editingName ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        ref={inputRef}
                        value={nameValue}
                        onChange={e => setNameValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  saveName()
                          if (e.key === 'Escape') setEditingName(false)
                        }}
                        maxLength={30}
                        className="bg-surface2 border border-primary rounded-sm px-2 py-1 text-[12px] text-text outline-none w-36"
                        placeholder="Seu nome"
                      />
                      <button
                        onClick={saveName}
                        disabled={saving}
                        className="text-[11px] text-primary font-bold disabled:opacity-40"
                      >
                        {saving ? '…' : 'Salvar'}
                      </button>
                      <button
                        onClick={() => setEditingName(false)}
                        className="text-[11px] text-muted hover:text-text"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-bold text-[13px] truncate"
                        style={{ color: isMe ? '#4a7c59' : 'rgb(var(--color-text))' }}
                      >
                        {entry.display_name}
                        {isMe && <span className="font-normal text-muted text-[11px] ml-1">(você)</span>}
                      </span>
                      {isMe && (
                        <button
                          onClick={() => { setNameValue(entry.display_name); setEditingName(true) }}
                          className="text-[10px] text-dim hover:text-muted shrink-0 border border-border rounded px-1.5 py-0.5"
                        >
                          renomear
                        </button>
                      )}
                    </div>
                  )}
                  <div className="text-[11px] mt-0.5 font-bold" style={{ color: rank.color }}>
                    {rank.insig} {rank.name}
                    <span className="font-normal text-muted ml-1.5">{rank.pct}% da meta</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-5 shrink-0 text-right">
                  <div>
                    <div className="text-[20px] font-black text-text tabular-nums leading-none">
                      {entry.total_questions.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-[9px] text-muted uppercase tracking-wider mt-0.5">questões</div>
                  </div>
                  <div>
                    <div
                      className="text-[20px] font-black tabular-nums leading-none"
                      style={{
                        color: entry.accuracy >= 75 ? '#4a7c59'
                             : entry.accuracy >= 50 ? '#d4a017'
                             : '#c0392b',
                      }}
                    >
                      {entry.accuracy}%
                    </div>
                    <div className="text-[9px] text-muted uppercase tracking-wider mt-0.5">acerto</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Nota de rodapé */}
      {!loading && !error && entries.length > 0 && (
        <div className="text-[10px] text-dim text-center">
          Ordenado por total de questões · Patente calculada com base na meta individual de cada usuário
        </div>
      )}

    </div>
  )
}
