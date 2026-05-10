import type { ReactNode } from 'react'
import { AlertTriangle, Banknote, CheckCircle2, Landmark, ReceiptText, WalletCards } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { currency } from '../../lib/utils'
import type { DashboardSummary } from '../../types'

export function DashboardModule({ dashboard }: { dashboard: DashboardSummary | null }) {
  const payments = dashboard?.payments_today ?? []
  const openCashSessions = dashboard?.open_cash_sessions ?? []

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#0088cc]">Resumen operativo</p>
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<ReceiptText size={22} />} label="Ventas hoy" value={String(dashboard?.sales_today ?? 0)} />
        <Metric icon={<Banknote size={22} />} label="Ingreso hoy" value={currency.format(Number(dashboard?.gross_today ?? 0))} />
        <Metric icon={<WalletCards size={22} />} label="Cajas abiertas" value={String(openCashSessions.length)} />
        <Metric icon={<AlertTriangle size={22} />} label="Stock bajo" value={String(dashboard?.low_stock ?? 0)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 dark:bg-[#242424]">Cajas abiertas</div>
          {openCashSessions.map((session) => (
            <div key={session.id} className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm dark:border-[#3a3a3a]">
              <CheckCircle2 className="text-[#0088cc]" size={18} />
              <span className="font-semibold">{session.cash_register?.name ?? `Sesion ${session.id}`}</span>
              <span className="text-slate-500">{session.user?.name ?? 'Sin usuario'}</span>
            </div>
          ))}
          {openCashSessions.length === 0 && <EmptyLine text="No hay cajas abiertas." />}
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 dark:bg-[#242424]">Pagos de hoy</div>
          {payments.map((payment) => (
            <div key={payment.method} className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm dark:border-[#3a3a3a]">
              <span className="font-semibold">{paymentLabel(payment.method)}</span>
              <span className="text-slate-500">{currency.format(Number(payment.total))}</span>
            </div>
          ))}
          {payments.length === 0 && <EmptyLine text="Aun no hay pagos registrados hoy." />}
        </Card>
      </div>

      <Card className="grid gap-3 p-4 md:grid-cols-2">
        <FiscalStatus
          label="Hacienda pendientes"
          value={dashboard?.pending_hacienda ?? 0}
          tone={(dashboard?.pending_hacienda ?? 0) > 0 ? 'warning' : 'ok'}
        />
        <FiscalStatus
          label="Hacienda rechazados"
          value={dashboard?.rejected_hacienda ?? 0}
          tone={(dashboard?.rejected_hacienda ?? 0) > 0 ? 'danger' : 'ok'}
        />
      </Card>
    </div>
  )
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="text-[#0088cc]">{icon}</span>
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </Card>
  )
}

function FiscalStatus({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warning' | 'danger' }) {
  const color = tone === 'danger' ? 'text-red-500' : tone === 'warning' ? 'text-amber-500' : 'text-[#0088cc]'

  return (
    <div className="flex items-center gap-3">
      <Landmark className={color} size={22} />
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  )
}

function EmptyLine({ text }: { text: string }) {
  return <div className="border-t border-slate-100 px-4 py-5 text-sm text-slate-500 dark:border-[#3a3a3a]">{text}</div>
}

function paymentLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia / SINPE',
    credit: 'Credito',
    mixed: 'Mixto',
  }

  return labels[method] ?? method
}
