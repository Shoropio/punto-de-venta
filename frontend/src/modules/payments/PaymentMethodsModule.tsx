import { CreditCard } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'
import { SelectBox } from '../../components/shared/SelectBox'
import type { PaymentMethodRow } from '../../types'

export function PaymentMethodsModule({ methods, code, name, type, loading, onCode, onName, onType, onCreate }: {
  methods: PaymentMethodRow[]
  code: string
  name: string
  type: PaymentMethodRow['type']
  loading: boolean
  onCode: (value: string) => void
  onName: (value: string) => void
  onType: (value: PaymentMethodRow['type']) => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 md:grid-cols-[160px_1fr_160px_auto]">
        <Input placeholder="Codigo" value={code} onChange={(event) => onCode(event.target.value.toLowerCase())} />
        <Input placeholder="Nombre" value={name} onChange={(event) => onName(event.target.value)} />
        <SelectBox value={type} onChange={(value) => onType(value as PaymentMethodRow['type'])}>
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="transfer">Transferencia</option>
          <option value="credit">Credito</option>
          <option value="other">Otro</option>
        </SelectBox>
        <Button onClick={onCreate} disabled={loading}><CreditCard size={18} /> Guardar</Button>
      </Card>
      <DataCard title="Formas de pago" empty="No hay formas de pago.">
        {methods.map((method) => (
          <div key={method.id} className="grid grid-cols-[1fr_120px_120px_90px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{method.name}</span>
            <span>{method.code}</span>
            <span>{method.type}</span>
            <span className={method.is_active ? 'text-[#0088cc]' : 'text-slate-500'}>{method.is_active ? 'Activa' : 'Inactiva'}</span>
          </div>
        ))}
      </DataCard>
    </div>
  )
}
