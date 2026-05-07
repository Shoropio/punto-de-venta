import { Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Input } from '../ui/input'
import type { NamedCatalog } from '../../types'
import { Empty } from './Empty'

export function CatalogCard({
  title,
  value,
  items,
  placeholder,
  onValue,
  onCreate,
}: {
  title: string
  value: string
  items: NamedCatalog[]
  placeholder: string
  onValue: (value: string) => void
  onCreate: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-4">
        <h2 className="mb-3 text-lg font-bold">{title}</h2>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input placeholder={placeholder} value={value} onChange={(event) => onValue(event.target.value)} />
          <Button onClick={onCreate}><Plus size={18} /></Button>
        </div>
      </div>
      <div className="max-h-56 overflow-auto">
        {items.map((item) => (
          <div key={item.id} className="border-t border-slate-100 px-4 py-2 text-sm font-medium">{item.name}</div>
        ))}
        {items.length === 0 && <Empty text="Sin elementos." />}
      </div>
    </Card>
  )
}
