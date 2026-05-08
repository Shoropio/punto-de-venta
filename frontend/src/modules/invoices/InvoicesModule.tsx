import { FileCode2, RefreshCw, ReceiptText, Send, Signature } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'
import { SelectBox } from '../../components/shared/SelectBox'
import { currency } from '../../lib/utils'
import { translateStatus } from '../../lib/pos-utils'
import type { InvoiceRow, SaleListItem } from '../../types'

export function InvoicesModule({ sales, invoices, saleId, taxId, legalName, email, loading, onSale, onTaxId, onLegalName, onEmail, onCreate, onGenerateXml, onSign, onSubmit, onCheckStatus }: {
  sales: SaleListItem[]
  invoices: InvoiceRow[]
  saleId: string
  taxId: string
  legalName: string
  email: string
  loading: boolean
  onSale: (value: string) => void
  onTaxId: (value: string) => void
  onLegalName: (value: string) => void
  onEmail: (value: string) => void
  onCreate: () => void
  onGenerateXml: (invoiceId: number) => void
  onSign: (invoiceId: number) => void
  onSubmit: (invoiceId: number) => void
  onCheckStatus: (invoiceId: number) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_160px_1fr_1fr_auto]">
        <SelectBox value={saleId} onChange={onSale}>
          <option value="">Venta a facturar</option>
          {sales.map((sale) => <option key={sale.id} value={sale.id}>{sale.folio} - {currency.format(Number(sale.total))}</option>)}
        </SelectBox>
        <Input placeholder="RFC / Tax ID" value={taxId} onChange={(event) => onTaxId(event.target.value.toUpperCase())} />
        <Input placeholder="Razon social" value={legalName} onChange={(event) => onLegalName(event.target.value)} />
        <Input placeholder="Email" value={email} onChange={(event) => onEmail(event.target.value)} />
        <Button onClick={onCreate} disabled={loading}><ReceiptText size={18} /> Facturar</Button>
      </Card>
      <DataCard title="Facturas" empty="No hay facturas registradas.">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="grid grid-cols-[170px_1fr_150px_90px_115px_184px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{invoice.numero_consecutivo ?? invoice.folio}</span>
            <span>{invoice.legal_name}</span>
            <span>{invoice.tax_id}</span>
            <span>{invoice.schema_version ? `v${invoice.schema_version}` : '-'}</span>
            <span className="text-[#0088cc]">{translateStatus(invoice.hacienda_status ?? invoice.status)}</span>
            <div className="grid grid-cols-4 gap-1">
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50" title="Generar XML" disabled={loading} onClick={() => onGenerateXml(invoice.id)}><FileCode2 size={15} /></button>
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50" title="Firmar XML" disabled={loading} onClick={() => onSign(invoice.id)}><Signature size={15} /></button>
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50" title="Enviar Hacienda" disabled={loading} onClick={() => onSubmit(invoice.id)}><Send size={15} /></button>
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50" title="Consultar estado" disabled={loading} onClick={() => onCheckStatus(invoice.id)}><RefreshCw size={15} /></button>
            </div>
          </div>
        ))}
      </DataCard>
    </div>
  )
}
