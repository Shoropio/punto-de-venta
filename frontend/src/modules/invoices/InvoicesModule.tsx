import { FileCode2, FileDown, MessageCircle, RefreshCw, ReceiptText, Send, Signature } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'
import { SelectBox } from '../../components/shared/SelectBox'
import { currency } from '../../lib/utils'
import { translateStatus } from '../../lib/pos-utils'
import type { InvoiceRow, SaleListItem } from '../../types'

export function InvoicesModule({ sales, invoices, saleId, documentType, taxId, legalName, email, loading, onSale, onDocumentType, onTaxId, onLegalName, onEmail, onCreate, onGenerateXml, onSign, onSubmit, onCheckStatus, onDownloadPdf, onSendWhatsApp }: {
  sales: SaleListItem[]
  invoices: InvoiceRow[]
  saleId: string
  documentType: string
  taxId: string
  legalName: string
  email: string
  loading: boolean
  onSale: (value: string) => void
  onDocumentType: (value: string) => void
  onTaxId: (value: string) => void
  onLegalName: (value: string) => void
  onEmail: (value: string) => void
  onCreate: () => void
  onGenerateXml: (invoiceId: number) => void
  onSign: (invoiceId: number) => void
  onSubmit: (invoiceId: number) => void
  onCheckStatus: (invoiceId: number) => void
  onDownloadPdf: (invoiceId: number) => void
  onSendWhatsApp: (invoice: InvoiceRow) => void
}) {
  const documentSupport = [
    ['01', 'Factura electronica', 'XML listo'],
    ['04', 'Tiquete electronico', 'XML listo'],
    ['02', 'Nota de debito electronica', 'XML listo'],
    ['03', 'Nota de credito electronica', 'XML listo'],
    ['08', 'Factura electronica de compra', 'XML listo'],
    ['09', 'Factura electronica de exportacion', 'XML listo'],
    ['10', 'Recibo electronico de pago', 'XML listo'],
  ]

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Soporte Hacienda v4.4</div>
        <div className="grid gap-0 md:grid-cols-2 xl:grid-cols-3">
          {documentSupport.map(([code, name, status]) => (
            <div key={code} className="grid grid-cols-[42px_1fr_92px] gap-2 border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-bold">{code}</span>
              <span>{name}</span>
              <span className={status === 'XML listo' ? 'text-[#0088cc]' : 'text-slate-500'}>{status}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_220px_160px_1fr_1fr_auto]">
        <SelectBox value={saleId} onChange={onSale}>
          <option value="">Venta a facturar</option>
          {sales.map((sale) => <option key={sale.id} value={sale.id}>{sale.folio} - {currency.format(Number(sale.total))}</option>)}
        </SelectBox>
        <SelectBox value={documentType} onChange={onDocumentType}>
          <option value="01">01 Factura electronica</option>
          <option value="02">02 Nota de debito</option>
          <option value="03">03 Nota de credito</option>
          <option value="04">04 Tiquete electronico</option>
          <option value="08">08 Factura de compra</option>
          <option value="09">09 Factura de exportacion</option>
          <option value="10">10 Recibo electronico de pago</option>
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
            <div className="grid grid-cols-6 gap-1">
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50" title="Generar XML" disabled={loading} onClick={() => onGenerateXml(invoice.id)}><FileCode2 size={15} /></button>
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50" title="Firmar XML" disabled={loading} onClick={() => onSign(invoice.id)}><Signature size={15} /></button>
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50" title="Enviar Hacienda" disabled={loading} onClick={() => onSubmit(invoice.id)}><Send size={15} /></button>
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50" title="Consultar estado" disabled={loading} onClick={() => onCheckStatus(invoice.id)}><RefreshCw size={15} /></button>
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50" title="Descargar PDF" disabled={loading} onClick={() => onDownloadPdf(invoice.id)}><FileDown size={15} /></button>
              <button className="grid h-8 place-items-center border border-slate-200 hover:bg-slate-50 text-[#25D366]" title="Enviar por WhatsApp" disabled={loading} onClick={() => onSendWhatsApp(invoice)}><MessageCircle size={15} /></button>
            </div>
          </div>
        ))}
      </DataCard>
    </div>
  )
}
