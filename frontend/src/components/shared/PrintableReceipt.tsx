import { currency } from '../../lib/utils'
import type { SaleResponse } from '../../types'

export function PrintableReceipt({ receipt, userName }: { receipt: SaleResponse['data']; userName: string }) {
  return (
    <section className="hidden print:block print:p-4">
      <div className="mx-auto w-[280px] font-mono text-sm text-black">
        <h1 className="text-center text-lg font-bold">POS Profesional</h1>
        <p className="text-center">Sucursal Principal</p>
        <p>Folio: {receipt.folio}</p>
        <p>Cajero: {userName}</p>
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
        <p className="mt-4 text-center">Gracias por su compra</p>
      </div>
    </section>
  )
}
