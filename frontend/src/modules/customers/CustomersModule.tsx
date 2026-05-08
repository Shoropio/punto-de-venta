import { Edit3, Plus, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { currency } from '../../lib/utils'
import type { Customer, CustomerForm } from '../../types'
import { Empty } from '../../components/shared/Empty'
import { SelectBox } from '../../components/shared/SelectBox'

export function CustomersModule({
  customers,
  loading,
  form,
  onFormChange,
  onSave,
  onCancel,
  onEdit,
  onDelete,
}: {
  customers: Customer[]
  loading: boolean
  form: CustomerForm
  onFormChange: (form: CustomerForm) => void
  onSave: () => void
  onCancel: () => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="mb-3 text-lg font-bold">{form.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Input className="md:col-span-2" placeholder="Nombre del cliente" value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} />
          <Input placeholder="Telefono" value={form.phone} onChange={(event) => onFormChange({ ...form, phone: event.target.value })} />
          <Input placeholder="Email" value={form.email} onChange={(event) => onFormChange({ ...form, email: event.target.value })} />
          <SelectBox value={form.identification_type} onChange={(value) => onFormChange({ ...form, identification_type: value })}>
            <option value="01">Fisica</option>
            <option value="02">Juridica</option>
            <option value="03">DIMEX</option>
            <option value="04">NITE</option>
          </SelectBox>
          <Input placeholder="Identificacion" value={form.identification_number} onChange={(event) => onFormChange({ ...form, identification_number: event.target.value })} />
          <Input placeholder="Limite credito" type="number" value={form.credit_limit} onChange={(event) => onFormChange({ ...form, credit_limit: event.target.value })} />
          <Input placeholder="Direccion" value={form.address} onChange={(event) => onFormChange({ ...form, address: event.target.value })} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={onSave} disabled={loading}>
            {form.id ? <Edit3 size={18} /> : <Plus size={18} />}
            {form.id ? 'Actualizar' : 'Crear'}
          </Button>
          {form.id && <Button variant="secondary" onClick={onCancel}>Cancelar</Button>}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_140px_100px_100px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Cliente</span>
          <span>Telefono</span>
          <span>Identificacion</span>
          <span>Saldo</span>
          <span>Acciones</span>
        </div>
        {customers.map((customer) => (
          <div key={customer.id} className="grid grid-cols-[1fr_140px_140px_100px_100px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{customer.name}</span>
            <span className="text-slate-500">{customer.phone ?? 'Sin telefono'}</span>
            <span className="text-slate-500">{customer.identification_number ?? '-'}</span>
            <span>{currency.format(Number(customer.balance ?? 0))}</span>
            <span className="flex gap-1">
              <Button aria-label={`Editar ${customer.name}`} className="h-8 px-2" variant="ghost" onClick={() => onEdit(customer)}><Edit3 size={14} /></Button>
              <Button aria-label={`Eliminar ${customer.name}`} className="h-8 px-2" variant="ghost" onClick={() => onDelete(customer)}><Trash2 size={14} /></Button>
            </span>
          </div>
        ))}
        {customers.length === 0 && <Empty text="Aun no hay clientes registrados." />}
      </Card>
    </div>
  )
}
