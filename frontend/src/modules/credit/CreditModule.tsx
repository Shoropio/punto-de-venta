import { WalletCards } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'
import { Metric } from '../../components/shared/Metric'
import { SelectBox } from '../../components/shared/SelectBox'
import { currency } from '../../lib/utils'
import type { CreditPaymentRow, Customer } from '../../types'

export function CreditModule({ customers, payments, customerId, amount, loading, onCustomer, onAmount, onCreate }: {
  customers: Customer[]
  payments: CreditPaymentRow[]
  customerId: string
  amount: string
  loading: boolean
  onCustomer: (value: string) => void
  onAmount: (value: string) => void
  onCreate: () => void
}) {
  const debtors = customers.filter((customer) => Number(customer.balance ?? 0) > 0)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Clientes con saldo" value={debtors.length.toString()} />
        <Metric label="Cuentas por cobrar" value={currency.format(customers.reduce((sum, customer) => sum + Number(customer.balance ?? 0), 0))} />
        <Metric label="Abonos recientes" value={payments.length.toString()} />
      </div>
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_180px_auto]">
        <SelectBox value={customerId} onChange={onCustomer}>
          <option value="">Selecciona cliente</option>
          {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} - {currency.format(Number(customer.balance ?? 0))}</option>)}
        </SelectBox>
        <Input placeholder="Monto a pagar" type="number" value={amount} onChange={(event) => onAmount(event.target.value)} />
        <Button onClick={onCreate} disabled={loading}><WalletCards size={18} /> Abonar</Button>
      </Card>
      <DataCard title="Ultimos abonos" empty="Aun no hay pagos a credito.">
        {payments.map((payment) => (
          <div key={payment.id} className="grid grid-cols-[1fr_120px_120px_160px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{payment.customer?.name ?? 'Cliente'}</span>
            <span>{currency.format(Number(payment.amount))}</span>
            <span>{payment.method}</span>
            <span className="text-slate-500">{new Date(payment.created_at).toLocaleString()}</span>
          </div>
        ))}
      </DataCard>
    </div>
  )
}
