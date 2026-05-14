import { useState } from 'react'
import { FocoSetup } from './FocoSetup'
import { FocoSession } from './FocoSession'
import { FocoRelatorio } from './FocoRelatorio'
import type { SprintConfig } from './types'

type Phase = 'setup' | 'active' | 'report'

export function Foco() {
  const [phase,     setPhase]     = useState<Phase>('setup')
  const [config,    setConfig]    = useState<SprintConfig | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [endTime,   setEndTime]   = useState(0)

  function start(cfg: SprintConfig) {
    setConfig(cfg)
    setStartTime(Date.now())
    setPhase('active')
  }

  function finish() {
    setEndTime(Date.now())
    setPhase('report')
  }

  function reset() {
    setPhase('setup')
    setConfig(null)
  }

  if (phase === 'setup')
    return <FocoSetup onStart={start} />

  if (phase === 'active' && config)
    return <FocoSession config={config} startTime={startTime} onFinish={finish} />

  if (phase === 'report' && config)
    return <FocoRelatorio config={config} startTime={startTime} endTime={endTime} onNew={reset} />

  return null
}
