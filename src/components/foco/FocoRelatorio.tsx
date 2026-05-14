import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import type { SprintConfig } from './types'

interface Props {
  config:    SprintConfig
  startTime: number
  endTime:   number
  onNew:     () => void
}

export function FocoRelatorio({ config, startTime, endTime, onNew }: Props) {
  const sessions = useStore(s => s.sessions)
  const navigate  = useNavigate()

  // sessões capturadas durante o sprint (buffer de 5s para atrasos de rede)
  const sprint = useMemo(() =>
    sessions.filter(s => s.ts >= startTime && s.ts <= endTime + 5000),
    [sessions, startTime, endTime]
  )

  const totalQ   = sprint.reduce((sum, s) => sum + s.total,   0)
  const correct  = sprint.reduce((sum, s) => sum + s.correct, 0)
  const errors   = totalQ - correct
  const taxa     = totalQ > 0 ? Math.round((correct / totalQ) * 100) : 0
  const goalMet  = totalQ >= config.goalQuestions

  const elapsedMin = (endTime - startTime) / 60000
  const mins       = Math.floor(elapsedMin)
  const secs       = Math.round((elapsedMin - mins) * 60)
  const elapsedStr = secs > 0 ? `${mins}min ${secs}s` : `${mins}min`
  const avgMin     = totalQ > 0 ? (elapsedMin / totalQ).toFixed(1) : '—'

  return (
    <div className="max-w-md mx-auto space-y-5 py-6">
      <div className="text-[15px] font-black text-text">Relatório de Desempenho</div>

      {/* A. Status da Meta */}
      <div className="bg-surface border border-border rounded-card p-4 space-y-4">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted">A. Status da Meta</div>

        <div className="flex items-center gap-2">
          <span className="text-[20px]">{goalMet ? '🏆' : '⚠️'}</span>
          <span className="text-[16px] font-black" style={{ color: goalMet ? '#4a7c59' : '#d4a017' }}>
            {goalMet ? 'Meta Batida!' : 'Meta não atingida'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface2 rounded-sm p-3">
            <div className="text-[10px] text-muted mb-0.5">Questões resolvidas</div>
            <div className="text-[16px] font-black text-text">
              {totalQ}
              <span className="text-[11px] font-normal text-muted ml-1">de {config.goalQuestions}</span>
            </div>
          </div>
          <div className="bg-surface2 rounded-sm p-3">
            <div className="text-[10px] text-muted mb-0.5">Tempo total</div>
            <div className="text-[16px] font-black text-text">{elapsedStr}</div>
          </div>
          <div className="bg-surface2 rounded-sm p-3">
            <div className="text-[10px] text-muted mb-0.5">Média por questão</div>
            <div className="text-[16px] font-black text-text">
              {avgMin}
              <span className="text-[11px] font-normal text-muted ml-1">min/q</span>
            </div>
          </div>
          <div className="bg-surface2 rounded-sm p-3">
            <div className="text-[10px] text-muted mb-0.5">Taxa de acerto</div>
            <div className="text-[16px] font-black"
              style={{ color: taxa >= 70 ? '#4a7c59' : taxa >= 50 ? '#d4a017' : '#c0392b' }}>
              {taxa}%
            </div>
          </div>
        </div>
      </div>

      {/* B. Breakdown */}
      <div className="bg-surface border border-border rounded-card p-4 space-y-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted">B. Breakdown de Acertos/Erros</div>

        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-muted uppercase tracking-wider border-b border-border/50">
              <th className="text-left font-bold pb-2">Categoria</th>
              <th className="text-right font-bold pb-2">Quantidade</th>
              <th className="text-right font-bold pb-2">Porcentagem</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/30">
              <td className="py-2 text-[12px] text-muted">Total de Questões</td>
              <td className="py-2 text-[12px] text-right font-bold text-text">{totalQ}</td>
              <td className="py-2 text-[12px] text-right font-bold text-text">100%</td>
            </tr>
            <tr className="border-b border-border/30">
              <td className="py-2 text-[12px] font-semibold" style={{ color: '#4a7c59' }}>Acertos</td>
              <td className="py-2 text-[12px] text-right font-bold" style={{ color: '#4a7c59' }}>{correct}</td>
              <td className="py-2 text-[12px] text-right font-bold" style={{ color: '#4a7c59' }}>{taxa}%</td>
            </tr>
            <tr>
              <td className="py-2 text-[12px] font-semibold" style={{ color: '#c0392b' }}>Erros</td>
              <td className="py-2 text-[12px] text-right font-bold" style={{ color: '#c0392b' }}>{errors}</td>
              <td className="py-2 text-[12px] text-right font-bold" style={{ color: '#c0392b' }}>
                {totalQ > 0 ? 100 - taxa : 0}%
              </td>
            </tr>
          </tbody>
        </table>

        {totalQ > 0 && (
          <div className="flex h-2 rounded-full overflow-hidden">
            <div style={{ width: `${taxa}%`, background: '#4a7c59' }} />
            <div style={{ width: `${100 - taxa}%`, background: '#c0392b' }} />
          </div>
        )}
      </div>

      {/* Sessões já salvas pela extensão — só oferece navegação */}
      {totalQ === 0 && (
        <div className="text-[12px] text-muted text-center py-2">
          Nenhuma questão detectada nessa sessão.
        </div>
      )}

      <div className="flex gap-2">
        {totalQ > 0 && (
          <button
            onClick={() => navigate('/historico')}
            className="flex-1 py-2.5 rounded-card text-[13px] font-bold border text-primary transition-all hover:bg-primary/10"
            style={{ borderColor: 'rgba(74,124,89,0.4)' }}
          >
            Ver no Histórico →
          </button>
        )}
        <button
          onClick={onNew}
          className="flex-1 py-2.5 rounded-card text-[13px] font-bold border border-border text-muted transition-all hover:text-text hover:border-border/80"
        >
          Nova Sessão
        </button>
      </div>
    </div>
  )
}
