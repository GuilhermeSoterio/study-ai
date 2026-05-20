import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { backendApi } from '@/lib/backendApi'
import { DEFAULT_CONFIG, DEFAULT_DISC, DEFAULT_BANCAS } from './defaults'
import type { TNode } from '@/components/personagem/types'
import type { CharacterData, Session, Flashcard, SessionStat } from '@/types'
import { createAuthSlice }       from './slices/authSlice'
import { createSessionsSlice }   from './slices/sessionsSlice'
import { createFlashcardsSlice } from './slices/flashcardsSlice'
import { createRankCardsSlice }  from './slices/rankCardsSlice'
import { createConceitosSlice }  from './slices/conceitosSlice'
import { createConfigSlice }     from './slices/configSlice'
import { createPurgeSlice }      from './slices/purgeSlice'
import { createUiSlice }         from './slices/uiSlice'
import { createQuestoesSlice }   from './slices/questoesSlice'
import { toast }                 from './toastStore'
import type { AppState } from './types'

let realtimeChannel: ReturnType<typeof supabase.channel> | null = null
let lastSyncTs = Date.now()
let visibilityListenerAttached = false

export { type AppState }

function discFromTree(nodes: TNode[]): Record<string, string[]> {
  const map: Record<string, string[]> = {}
  function walk(node: TNode) {
    if (node.disc && node.mat) {
      if (!map[node.disc]) map[node.disc] = []
      if (!map[node.disc].includes(node.mat)) map[node.disc].push(node.mat)
    }
    node.children?.forEach(walk)
  }
  nodes.forEach(walk)
  return map
}

// Normaliza chaves de disc para bater com as formas canônicas (DEFAULT_DISC ou treeDisc),
// evitando duplicatas por diferença de capitalização ("Direito constitucional" vs "Direito Constitucional").
function canonicalizeDiscKeys(
  data: Record<string, string[]>,
  canonical: Record<string, string[]>,
): Record<string, string[]> {
  const normToCanon = new Map<string, string>()
  for (const k of Object.keys(canonical)) {
    normToCanon.set(k.toLowerCase().trim(), k)
  }
  const result: Record<string, string[]> = {}
  for (const [k, mats] of Object.entries(data)) {
    const canon = normToCanon.get(k.toLowerCase().trim()) ?? k
    if (!result[canon]) result[canon] = []
    for (const m of mats) {
      if (!result[canon].includes(m)) result[canon].push(m)
    }
  }
  return result
}

// Mescla treeDisc (fonte primária) com extra (disciplines ou DEFAULT_DISC):
// - disciplinas que só existem em extra são adicionadas ao resultado
// - disciplinas presentes em ambos: mantém as matérias do tree e acrescenta as de extra que faltarem
function mergeDisc(
  tree: Record<string, string[]>,
  extra: Record<string, string[]> | null,
): Record<string, string[]> {
  if (!extra || Object.keys(extra).length === 0) return tree
  const normTreeKeys = new Map<string, string>()
  for (const k of Object.keys(tree)) normTreeKeys.set(k.toLowerCase().trim(), k)

  const result: Record<string, string[]> = { ...tree }
  for (const [k, mats] of Object.entries(extra)) {
    const canon = normTreeKeys.get(k.toLowerCase().trim())
    if (canon) {
      // disciplina já existe no tree: só acrescenta matérias ausentes
      for (const m of mats) {
        if (!result[canon].includes(m)) result[canon].push(m)
      }
    } else {
      // disciplina exclusiva do extra: adiciona inteira
      result[k] = [...mats]
    }
  }
  return result
}

export const useStore = create<AppState>()((...a) => ({
  ...createAuthSlice(...a),
  ...createSessionsSlice(...a),
  ...createFlashcardsSlice(...a),
  ...createRankCardsSlice(...a),
  ...createConceitosSlice(...a),
  ...createConfigSlice(...a),
  ...createPurgeSlice(...a),
  ...createUiSlice(...a),
  ...createQuestoesSlice(...a),

  loadAll: async () => {
    const [set, get] = a

    // Fix #2 — não recarrega se já foi carregado na sessão atual
    if (get().loaded) return

    set({ loading: true })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { set({ loading: false }); return }

    set({ userId: user.id, userEmail: user.email ?? null })

    const [sr, ssR, cr, rankR, concR, cfgR, bancasR, discR, discSupaR, treeR, charR, purgeR, questR] = await Promise.all([
      supabase.from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('ts', { ascending: false })
        .limit(500),
      supabase.from('sessions')
        .select('id,date,total,correct,disc,mat,tema')
        .eq('user_id', user.id),
      supabase.from('flashcards').select('*').eq('user_id', user.id).limit(2000),
      supabase.from('rank_cards').select('*').eq('user_id', user.id).limit(2000),
      supabase.from('conceitos').select('*').eq('user_id', user.id).order('ts', { ascending: false }),
      supabase.from('user_config').select('*').eq('user_id', user.id).single(),
      supabase.from('bancas').select('*').eq('user_id', user.id).single(),
      backendApi.get<{ data: Record<string, string[]> }>('/v1/disciplines').catch(() => null),
      supabase.from('disciplines').select('data').eq('user_id', user.id).single(),
      backendApi.get<{ data: TNode[] }>('/v1/skill-tree').catch(() => null),
      // Fix #1 — character carregado aqui uma vez, não a cada mount do PersonagemV2
      backendApi.get<{ data: CharacterData }>('/v1/character').catch(() => null),
      supabase.from('purge_records').select('*').eq('user_id', user.id),
      supabase.from('questoes').select('*').eq('user_id', user.id).order('ts', { ascending: false }).limit(2000),
    ])

    let cfgData    = cfgR.data
    let bancasData = bancasR.data
    // Supabase disciplines takes priority over backend (always up-to-date after saveDisc)
    let discData: Record<string, string[]> | null =
      (discSupaR.data as { data: Record<string, string[]> } | null)?.data
      ?? discR?.data
      ?? null
    const treeData = treeR?.data ?? []
    const charData = charR?.data ?? null

    if (!cfgData) {
      await backendApi.post('/v1/onboarding', {}).catch(e => {
        console.error('[onboarding] falhou:', e.message)
      })

      const [cfgRefetch, bancasRefetch, discRefetch, discSupaRefetch] = await Promise.all([
        supabase.from('user_config').select('*').eq('user_id', user.id).single(),
        supabase.from('bancas').select('*').eq('user_id', user.id).single(),
        backendApi.get<{ data: Record<string, string[]> }>('/v1/disciplines').catch(() => null),
        supabase.from('disciplines').select('data').eq('user_id', user.id).single(),
      ])
      cfgData    = cfgRefetch.data
      bancasData = bancasRefetch.data
      discData   = (discSupaRefetch.data as { data: Record<string, string[]> } | null)?.data
                   ?? discRefetch?.data
                   ?? null
    }

    const treeDisc = discFromTree(treeData)
    const hasTree  = Object.keys(treeDisc).length > 0

    set({
      sessions:        sr.data ?? [],
      hasMoreSessions: (sr.data?.length ?? 0) >= 500,
      sessionStats:    ssR.data ?? [],
      flashcards:      (cr.data ?? []).map(c => ({ ...c, reviews: c.reviews ?? [] })),
      rankCards:       (rankR.data ?? []).map(c => ({ ...c, reviews: c.reviews ?? [] })),
      conceitos:       (concR.data ?? []).map(c => ({ ...c, reviews: c.reviews ?? [] })),
      config:       cfgData    ?? { ...DEFAULT_CONFIG, user_id: user.id },
      bancas:       bancasData?.data ?? DEFAULT_BANCAS,
      skillTree:    treeData,
      character:    charData,
      purgeRecords: purgeR.data ?? [],
      questoes:     questR.data ?? [],
      disc:         hasTree
                      ? mergeDisc(treeDisc, discData ?? DEFAULT_DISC)
                      : (discData && Object.keys(discData).length > 0)
                        ? canonicalizeDiscKeys(discData, DEFAULT_DISC)
                        : DEFAULT_DISC,
      loading: false,
      loaded:  true,
    })

    // ── Sincronização com a extensão ─────────────────────────────────────────

    function ingestSession(session: Session) {
      if (get().sessions.find(s => s.id === session.id)) return
      const stat: SessionStat = {
        id: session.id, date: session.date, total: session.total,
        correct: session.correct, disc: session.disc, mat: session.mat, tema: session.tema,
      }
      set(s => ({ sessions: [session, ...s.sessions], sessionStats: [stat, ...s.sessionStats] }))
      const icon = session.correct > 0 ? '✅' : '❌'
      toast.success(`${icon} ${session.disc} › ${session.mat} — registrada via QConcursos`)
      backendApi.get<{ data: CharacterData }>('/v1/character')
        .then(r => { if (r?.data) set({ character: r.data }) })
        .catch(() => {})
    }

    function ingestFlashcard(card: Flashcard) {
      if (get().flashcards.find(f => f.id === card.id)) return
      set(s => ({ flashcards: [{ ...card, reviews: card.reviews ?? [] }, ...s.flashcards] }))
    }

    // Estratégia 1: Supabase Realtime (instantâneo se habilitado no projeto)
    if (!realtimeChannel) {
      realtimeChannel = supabase
        .channel('extension-sync')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'sessions', filter: `user_id=eq.${user.id}` },
          payload => ingestSession(payload.new as Session)
        )
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'flashcards', filter: `user_id=eq.${user.id}` },
          payload => ingestFlashcard(payload.new as Flashcard)
        )
        .subscribe()
    }

    // Estratégia 2: visibilitychange — ao voltar para a aba busca o que chegou
    if (!visibilityListenerAttached) {
      visibilityListenerAttached = true
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState !== 'visible') return
        const since = lastSyncTs
        lastSyncTs = Date.now()

        const [newSessions, newCards] = await Promise.all([
          supabase.from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .eq('source', 'QConcursos')
            .gt('ts', since)
            .order('ts', { ascending: false }),
          supabase.from('flashcards')
            .select('*')
            .eq('user_id', user.id)
            .gt('ts', since),
        ])

        for (const s of newSessions.data ?? []) ingestSession(s as Session)
        for (const c of newCards.data   ?? []) ingestFlashcard(c as Flashcard)
      })
    }
  },
}))
