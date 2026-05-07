import { Tags } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'
import type { PromotionRow } from '../../types'

export function PromotionsModule({ promotions, name, code, value, loading, onName, onCode, onValue, onCreate }: {
  promotions: PromotionRow[]
  name: string
  code: string
  value: string
  loading: boolean
  onName: (value: string) => void
  onCode: (value: string) => void
  onValue: (value: string) => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_180px_140px_auto]">
        <Input placeholder="Nombre de promocion" value={name} onChange={(event) => onName(event.target.value)} />
        <Input placeholder="Codigo" value={code} onChange={(event) => onCode(event.target.value.toUpperCase())} />
        <Input placeholder="% descuento" type="number" value={value} onChange={(event) => onValue(event.target.value)} />
        <Button onClick={onCreate} disabled={loading}><Tags size={18} /> Guardar</Button>
      </Card>
      <DataCard title="Promociones" empty="No hay promociones configuradas.">
        {promotions.map((promotion) => (
          <div key={promotion.id} className="grid grid-cols-[1fr_140px_140px_100px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{promotion.name}</span>
            <span>{promotion.code}</span>
            <span>{promotion.discount_value}{promotion.discount_type === 'percent' ? '%' : ''}</span>
            <span className={promotion.is_active ? 'text-[#0088cc]' : 'text-slate-500'}>{promotion.is_active ? 'Activa' : 'Pausada'}</span>
          </div>
        ))}
      </DataCard>
    </div>
  )
}
