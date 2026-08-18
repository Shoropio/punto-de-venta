import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import type { Customer } from '../types'

interface CustomerSelectionDialogProps {
  isDarkTheme: boolean
  customers: Customer[]
  selectedCustomerId: string
  setSelectedCustomerId: (v: string) => void
  setMessage: (v: string) => void
  onDismiss: () => void
}

export function CustomerSelectionDialog({
  isDarkTheme, customers, selectedCustomerId, setSelectedCustomerId, setMessage, onDismiss,
}: CustomerSelectionDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
      <Card className={isDarkTheme ? 'max-h-[88vh] w-full max-w-2xl overflow-auto border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'max-h-[88vh] w-full max-w-2xl overflow-auto p-5'}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Cliente de la venta</p>
            <h2 className="text-2xl font-bold">Seleccionar cliente</h2>
          </div>
          <Button variant="ghost" onClick={onDismiss}>Cerrar</Button>
        </div>
        <div className="grid gap-2">
          <button
            className={isDarkTheme ? 'border border-[#4b4b4b] bg-[#242424] px-3 py-3 text-left text-sm hover:bg-[#303030]' : 'border border-stone-200 px-3 py-3 text-left text-sm hover:bg-stone-50'}
            onClick={() => {
              setSelectedCustomerId('')
              onDismiss()
              setMessage('Venta sin cliente asociado.')
            }}
          >
            Consumidor final
          </button>
          {customers.map((customer) => (
            <button
              key={customer.id}
              className={String(customer.id) === selectedCustomerId ? 'border border-[#0088cc] bg-[#0088cc] px-3 py-3 text-left text-sm text-white' : isDarkTheme ? 'border border-[#4b4b4b] bg-[#242424] px-3 py-3 text-left text-sm hover:bg-[#303030]' : 'border border-stone-200 px-3 py-3 text-left text-sm hover:bg-stone-50'}
              onClick={() => {
                setSelectedCustomerId(String(customer.id))
                onDismiss()
                setMessage(`${customer.name} asociado a la venta.`)
              }}
            >
              <span className="block font-bold">{customer.name}</span>
              <span className={String(customer.id) === selectedCustomerId ? 'text-white/80' : 'text-slate-500'}>{customer.identification_number ?? 'Sin identificacion'} {customer.email ? `- ${customer.email}` : ''}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
