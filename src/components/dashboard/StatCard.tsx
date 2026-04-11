import { Card, CardLabel } from '@/components/ui/Card'

interface Props {
  label: string
  value: string | number
  sub?: string
  color: string
}

export function StatCard({ label, value, sub, color }: Props) {
  return (
    <Card>
      <CardLabel>{label}</CardLabel>
      <div className={`text-4xl font-black leading-none tracking-tight mb-1 ${color}`}>
        {value}
      </div>
      {sub && <div className="text-[11px] text-dim">{sub}</div>}
    </Card>
  )
}
