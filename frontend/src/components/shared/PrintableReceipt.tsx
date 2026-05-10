import type { CSSProperties } from 'react'
import { currency } from '../../lib/utils'
import type { SaleResponse } from '../../types'

export function PrintableReceipt({ receipt, userName, businessName, widthMm }: { receipt: SaleResponse['data']; userName: string; businessName: string; widthMm: string }) {
  const width = widthMm === '58' ? '58mm' : '80mm'

  return (
    <section className="receipt-print hidden font-mono text-[11px] leading-tight text-black" style={{ '--receipt-width': width } as CSSProperties & Record<string, string>}>
      <div className="w-full">
        <h1 className="text-center text-sm font-bold">{businessName}</h1>
        <p className="text-center">Sucursal Principal</p>
        <p className="text-center">{new Date().toLocaleString()}</p>
        <div className="my-2 border-t border-dashed border-black" />
        <p>Folio: {receipt.folio}</p>
        <p>Cajero: {userName}</p>
        {receipt.customer?.name && <p>Cliente: {receipt.customer.name}</p>}
        <hr className="my-2 border-black" />
        {receipt.items.map((item, index) => (
          <div key={`${item.product_name}-${index}`} className="mb-1">
            <div>{item.product_name}</div>
            <div className="flex justify-between">
              <span>{Number(item.quantity).toFixed(0)} x {currency.format(Number(item.unit_price))}</span>
              <span>{currency.format(Number(item.line_total))}</span>
            </div>
          </div>
        ))}
        <hr className="my-2 border-black" />
        <div className="flex justify-between"><span>Subtotal</span><span>{currency.format(Number(receipt.subtotal))}</span></div>
        <div className="flex justify-between"><span>IVA</span><span>{currency.format(Number(receipt.tax_total))}</span></div>
        <div className="flex justify-between font-bold"><span>Total</span><span>{currency.format(Number(receipt.total))}</span></div>
        <div className="flex justify-between"><span>Pagado</span><span>{currency.format(Number(receipt.paid_total))}</span></div>
        <div className="flex justify-between"><span>Cambio</span><span>{currency.format(Number(receipt.change_total))}</span></div>
        <div className="my-2 border-t border-dashed border-black" />
        <p className="mt-4 text-center">Gracias por su compra</p>
      </div>
    </section>
  )
}
