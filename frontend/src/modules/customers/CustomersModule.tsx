import { Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { currency } from '../../lib/utils'
import type { Customer } from '../../types'
import { Empty } from '../../components/shared/Empty'

export function CustomersModule({
  customers,
  loading,
  name,
  phone,
  onName,
  onPhone,
  onCreate,
}: {
  customers: Customer[]
  loading: boolean
  name: string
  phone: string
  onName: (value: string) => void
  onPhone: (value: string) => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_180px_auto]">
        <Input placeholder="Nombre del cliente" value={name} onChange={(event) => onName(event.target.value)} />
        <Input placeholder="Teléfono" value={phone} onChange={(event) => onPhone(event.target.value)} />
        <Button onClick={onCreate} disabled={loading}>
          <Plus size={18} />
          Crear
        </Button>
      </Card>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_100px_80px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Cliente</span>
          <span>Teléfono</span>
          <span>Saldo</span>
          <span>Puntos</span>
        </div>
        {customers.map((customer) => (
          <div key={customer.id} className="grid grid-cols-[1fr_140px_100px_80px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{customer.name}</span>
            <span className="text-slate-500">{customer.phone ?? 'Sin teléfono'}</span>
            <span>{currency.format(Number(customer.balance ?? 0))}</span>
            <span>{customer.loyalty_points ?? 0}</span>
          </div>
        ))}
        {customers.length === 0 && <Empty text="Aún no hay clientes registrados." />}
      </Card>
    </div>
  )
}
