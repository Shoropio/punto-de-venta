import { BadgeX, Printer } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Empty } from '../../components/shared/Empty'
import { Metric } from '../../components/shared/Metric'
import { currency } from '../../lib/utils'
import { translateStatus } from '../../lib/pos-utils'
import type { Refund, SaleListItem, SalesSummary, TopProduct } from '../../types'

export function ReportsModule({
  summary,
  topProducts,
  sales,
  refunds,
  loading,
  onRefund,
  onReprint,
}: {
  summary: SalesSummary | null
  topProducts: TopProduct[]
  sales: SaleListItem[]
  refunds: Refund[]
  loading: boolean
  onRefund: (sale: SaleListItem) => void
  onReprint: (sale: SaleListItem) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Ventas hoy" value={(summary?.sales_count ?? 0).toString()} />
        <Metric label="Ingresos" value={currency.format(Number(summary?.gross_sales ?? 0))} />
        <Metric label="Productos top" value={topProducts.length.toString()} />
      </div>
      <div className="grid gap-4 2xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Importe</span>
          </div>
          {topProducts.map((product) => (
            <div key={product.product_id} className="grid grid-cols-[1fr_120px_120px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-semibold">{product.product_name}</span>
              <span>{Number(product.quantity).toFixed(0)}</span>
              <span>{currency.format(Number(product.total))}</span>
            </div>
          ))}
          {topProducts.length === 0 && <Empty text="Aún no hay ventas para reportar." />}
        </Card>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_90px_170px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
            <span>Venta</span>
            <span>Total</span>
            <span>Estado</span>
            <span>Acción</span>
          </div>
          {sales.map((sale) => (
            <div key={sale.id} className="grid grid-cols-[1fr_100px_90px_170px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-semibold">{sale.folio}</span>
              <span>{currency.format(Number(sale.total))}</span>
              <span className={sale.status === 'refunded' ? 'text-red-600' : 'text-[#0088cc]'}>{translateStatus(sale.status)}</span>
              <span className="flex gap-1">
                <Button className="h-8 px-2" variant="ghost" disabled={loading} onClick={() => onReprint(sale)} aria-label={`Reimprimir ${sale.folio}`} title="Reimprimir copia">
                  <Printer size={14} />
                </Button>
                <Button className="h-8 px-2" variant="danger" disabled={loading || sale.status !== 'completed'} onClick={() => onRefund(sale)} aria-label={`Devolver ${sale.folio}`} title="Marcar venta como devuelta">
                  <BadgeX size={14} />
                  Devolver
                </Button>
              </span>
            </div>
          ))}
          {sales.length === 0 && <Empty text="Aún no hay ventas registradas." />}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_1fr_100px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Venta</span>
          <span>Importe</span>
          <span>Motivo</span>
          <span>Estado</span>
        </div>
        {refunds.map((refund) => (
          <div key={refund.id} className="grid grid-cols-[1fr_120px_1fr_100px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{refund.sale?.folio ?? 'Sin folio'}</span>
            <span>{currency.format(Number(refund.amount))}</span>
            <span className="text-slate-600">{refund.reason}</span>
            <span>{translateStatus(refund.status)}</span>
          </div>
        ))}
        {refunds.length === 0 && <Empty text="Aún no hay devoluciones registradas." />}
      </Card>
    </div>
  )
}
