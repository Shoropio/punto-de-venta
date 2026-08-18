import { Loader2, WalletCards } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Users, UserPlus } from 'lucide-react'
import { currency } from '../lib/utils'
import type { Customer, CustomerForm } from '../types'

interface PaymentDialogProps {
  isDarkTheme: boolean
  total: number
  loading: boolean
  paymentMethod: string
  setPaymentMethod: (m: string) => void
  cashReceived: string
  setCashReceived: (v: string) => void
  closePaymentDialog: () => void
  confirmPayment: () => void
  requiresCashAmount: boolean
  paymentChange: number
  creditCustomerMode: string
  setCreditCustomerMode: (m: 'existing' | 'new') => void
  paymentCustomerId: string
  setPaymentCustomerId: (v: string) => void
  selectedCustomerId: string
  setSelectedCustomerId: (v: string) => void
  customers: Customer[]
  creditCustomerForm: CustomerForm
  setCreditCustomerForm: (f: CustomerForm) => void
}

export function PaymentDialog({
  isDarkTheme, total, loading, paymentMethod, setPaymentMethod,
  cashReceived, setCashReceived, closePaymentDialog, confirmPayment,
  requiresCashAmount, paymentChange, creditCustomerMode, setCreditCustomerMode,
  paymentCustomerId, setPaymentCustomerId, selectedCustomerId, setSelectedCustomerId,
  customers, creditCustomerForm, setCreditCustomerForm,
}: PaymentDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
      <Card className={isDarkTheme ? 'w-full max-w-lg border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'w-full max-w-lg p-5'}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Cobro de venta</p>
            <h2 className="text-2xl font-bold">{currency.format(total)}</h2>
          </div>
          <Button variant="ghost" onClick={closePaymentDialog} disabled={loading}>Cancelar</Button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-1">
            {([
              ['cash', 'Efectivo'],
              ['card', 'Tarjeta'],
              ['transfer', 'SINPE'],
              ['credit', 'Credito'],
            ] as const).map(([method, label]) => (
              <button
                key={method}
                className={paymentMethod === method
                  ? 'border border-[#0088cc] bg-[#0088cc] px-2 py-2 text-xs font-bold text-white'
                  : isDarkTheme
                    ? 'border border-[#575757] bg-[#1f1f1f] px-2 py-2 text-xs font-semibold text-stone-200 hover:bg-[#303030]'
                    : 'border border-stone-300 bg-white px-2 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100'}
                onClick={() => {
                  setPaymentMethod(method)
                  setCashReceived(method === 'cash' ? '' : total.toFixed(2))
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={isDarkTheme ? 'grid grid-cols-2 gap-2 bg-[#242424] p-3 text-sm' : 'grid grid-cols-2 gap-2 bg-stone-100 p-3 text-sm'}>
            <span>Metodo</span>
            <strong className="text-right">{paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : paymentMethod === 'transfer' ? 'Transferencia' : paymentMethod === 'credit' ? 'Credito' : 'Mixto'}</strong>
            <span>Total</span>
            <strong className="text-right">{currency.format(total)}</strong>
            {requiresCashAmount && (
              <>
                <span>Vuelto</span>
                <strong className="text-right">{currency.format(paymentChange)}</strong>
              </>
            )}
          </div>

          {requiresCashAmount && (
            <Input
              autoFocus
              inputMode="decimal"
              placeholder="Monto recibido en efectivo"
              value={cashReceived}
              onChange={(event) => setCashReceived(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') confirmPayment()
                if (event.key === 'Escape') closePaymentDialog()
              }}
            />
          )}

          {paymentMethod === 'credit' && (
            <div className={isDarkTheme ? 'space-y-3 border border-[#4b4b4b] bg-[#242424] p-3' : 'space-y-3 border border-stone-300 bg-stone-50 p-3'}>
              <div className="grid grid-cols-2 gap-2">
                <Button className="h-9" variant={creditCustomerMode === 'existing' ? 'primary' : 'secondary'} onClick={() => setCreditCustomerMode('existing')}>
                  <Users size={16} />
                  Cliente
                </Button>
                <Button className="h-9" variant={creditCustomerMode === 'new' ? 'primary' : 'secondary'} onClick={() => setCreditCustomerMode('new')}>
                  <UserPlus size={16} />
                  Crear
                </Button>
              </div>

              {creditCustomerMode === 'existing' ? (
                <select
                  className="h-10 w-full rounded-none border border-stone-300 bg-white px-3 text-sm outline-none focus:border-[#0088cc] dark:border-[#4b4b4b] dark:bg-[#1f1f1f] dark:text-stone-100"
                  value={paymentCustomerId || selectedCustomerId}
                  onChange={(event) => {
                    setPaymentCustomerId(event.target.value)
                    setSelectedCustomerId(event.target.value)
                  }}
                >
                  <option value="">Selecciona cliente para credito</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} {customer.identification_number ? `- ${customer.identification_number}` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid gap-2">
                  <Input placeholder="Nombre del cliente" value={creditCustomerForm.name} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, name: event.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Telefono" value={creditCustomerForm.phone} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, phone: event.target.value })} />
                    <Input placeholder="Email" value={creditCustomerForm.email} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, email: event.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Identificacion" value={creditCustomerForm.identification_number} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, identification_number: event.target.value })} />
                    <Input placeholder="Limite credito" type="number" value={creditCustomerForm.credit_limit} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, credit_limit: event.target.value })} />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={closePaymentDialog} disabled={loading}>Cancelar</Button>
            <Button onClick={confirmPayment} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <WalletCards size={18} />}
              Aceptar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
