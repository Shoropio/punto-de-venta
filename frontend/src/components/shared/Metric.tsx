import { Card } from '../ui/card'

export function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'danger' }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <strong className={tone === 'danger' ? 'text-2xl text-red-600' : 'text-2xl text-slate-950'}>{value}</strong>
    </Card>
  )
}
