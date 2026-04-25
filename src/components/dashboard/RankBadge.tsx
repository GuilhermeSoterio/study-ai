import { useEffect, useState } from 'react'
import { useRank, type RankInfo } from '@/hooks/useRank'

const LS_KEY = 'studybi_rank'

function RankPromoModal({ rank, onClose }: { rank: RankInfo; onClose: () => void }) {
  return (
    <div className="rank-promo-bg" onClick={onClose}>
      <div className="rank-promo-box" onClick={e => e.stopPropagation()}>
        <div className="rank-promo-insig" style={{ color: rank.color }}>
          {rank.insig}
        </div>
        <div className="text-[10px] font-bold tracking-widest text-muted uppercase mb-1">
          Promoção
        </div>
        <div
          className="text-[28px] font-black tracking-widest mb-2"
          style={{ color: rank.color }}
        >
          {rank.name}
        </div>
        <div className="text-[13px] text-muted text-center mb-6 max-w-xs leading-relaxed">
          {rank.sub}
        </div>
        <button
          onClick={onClose}
          className="px-8 py-2.5 rounded-sm font-black text-[12px] tracking-widest text-white"
          style={{ background: rank.color }}
        >
          ASSUMIR POSTO
        </button>
      </div>
    </div>
  )
}

export function RankBadge() {
  const rank = useRank()
  const [showPromo, setShowPromo] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY)
    if (saved !== null && saved !== rank.name) {
      setShowPromo(true)
    }
    localStorage.setItem(LS_KEY, rank.name)
  }, [rank.name])

  return (
    <>
      <div className="rank-badge" style={{ borderColor: rank.color }}>
        <span className="rank-insig" style={{ color: rank.color }}>
          {rank.insig}
        </span>
        <div>
          <div className="rank-name-lbl" style={{ color: rank.color }}>
            {rank.name}
          </div>
          {rank.next ? (
            <div className="rank-next-txt">
              → {rank.next.name} em {rank.next.min - rank.goalPct}%
            </div>
          ) : (
            <div className="rank-next-txt font-bold" style={{ color: rank.color }}>
              Posto máximo atingido
            </div>
          )}
        </div>
      </div>

      {showPromo && (
        <RankPromoModal rank={rank} onClose={() => setShowPromo(false)} />
      )}
    </>
  )
}
