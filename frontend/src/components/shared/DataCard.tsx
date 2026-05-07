import type { ReactNode } from 'react'
import { Card } from '../ui/card'
import { Empty } from './Empty'

export function DataCard({ title, empty, children }: { title: string; empty: string; children: ReactNode }) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <Card className="overflow-hidden">
      <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">{title}</div>
      {hasRows ? children : <Empty text={empty} />}
    </Card>
  )
}
