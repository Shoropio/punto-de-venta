import { Loader2, ReceiptText } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { currency } from '../lib/utils'
import type { SaleResponse } from '../types'

interface InvoicePromptDialogProps {
  isDarkTheme: boolean
  loading: boolean
  sale: SaleResponse['data']
  quickInvoiceTaxId: string
  setQuickInvoiceTaxId: (v: string) => void
  quickInvoiceLegalName: string
  setQuickInvoiceLegalName: (v: string) => void
  quickInvoiceEmail: string
  setQuickInvoiceEmail: (v: string) => void
  closeInvoicePrompt: () => void
  createInvoiceFromPaidSale: () => void
}

export function InvoicePromptDialog({
  isDarkTheme, loading, sale,
  quickInvoiceTaxId, setQuickInvoiceTaxId,
  quickInvoiceLegalName, setQuickInvoiceLegalName,
  quickInvoiceEmail, setQuickInvoiceEmail,
  closeInvoicePrompt, createInvoiceFromPaidSale,
}: InvoicePromptDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
      <Card className={isDarkTheme ? 'w-full max-w-lg border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'w-full max-w-lg p-5'}>
        <div className="mb-4">
          <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Venta cobrada e impresa</p>
          <h2 className="text-2xl font-bold">Desea factura electronica?</h2>
          <p className={isDarkTheme ? 'mt-1 text-sm text-stone-300' : 'mt-1 text-sm text-stone-600'}>
            Venta {sale.folio} por {currency.format(Number(sale.total))}.
          </p>
        </div>

        <div className="grid gap-3">
          <Input placeholder="Identificacion fiscal" value={quickInvoiceTaxId} onChange={(event) => setQuickInvoiceTaxId(event.target.value)} />
          <Input placeholder="Razon social" value={quickInvoiceLegalName} onChange={(event) => setQuickInvoiceLegalName(event.target.value)} />
          <Input placeholder="Correo para factura" value={quickInvoiceEmail} onChange={(event) => setQuickInvoiceEmail(event.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={closeInvoicePrompt} disabled={loading}>No emitir</Button>
            <Button onClick={createInvoiceFromPaidSale} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ReceiptText size={18} />}
              Emitir factura
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
