import { Loader2, WalletCards } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { currency } from '../lib/utils'
import { cashDenominations } from '../lib/nav'
import type { User } from '../types'
import type { CashSessionSummary } from '../types'

interface CashClosingDialogProps {
  isDarkTheme: boolean
  loading: boolean
  user: User
  cashClosingSummary: CashSessionSummary | null
  currentCashSession: { cash_register?: { name: string }; shift?: string } | null
  pendingFiscalCount: number
  closingExpected: number
  closingCounted: number
  closingDifference: number
  cashBreakdown: Record<string, string>
  setCashBreakdown: React.Dispatch<React.SetStateAction<Record<string, string>>>
  cashBreakdownTotal: number
  cashClosingAmount: string
  setCashClosingAmount: (v: string) => void
  cashClosingNotes: string
  setCashClosingNotes: (v: string) => void
  cancelCashClosingDialog: () => void
  askConfirmation: (action: { title: string; message: string; tone?: 'danger' | 'primary'; confirmLabel?: string; onConfirm: () => void | Promise<void> }) => void
  closeCashSession: () => void
  paymentLabels: Record<string, string>
}

export function CashClosingDialog({
  isDarkTheme, loading, user, cashClosingSummary, currentCashSession,
  pendingFiscalCount, closingExpected, closingCounted, closingDifference,
  cashBreakdown, setCashBreakdown, cashBreakdownTotal,
  cashClosingAmount, setCashClosingAmount, cashClosingNotes, setCashClosingNotes,
  cancelCashClosingDialog, askConfirmation, closeCashSession, paymentLabels,
}: CashClosingDialogProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
      <Card className={isDarkTheme ? 'max-h-[92vh] w-full max-w-3xl overflow-auto border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'max-h-[92vh] w-full max-w-3xl overflow-auto p-5'}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Arqueo de caja</p>
            <h2 className="text-2xl font-bold">Confirmar cierre</h2>
          </div>
          <Button variant="ghost" onClick={cancelCashClosingDialog} disabled={loading}>Cancelar</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className={isDarkTheme ? 'border border-[#4b4b4b] p-3' : 'border border-stone-200 p-3'}>
            <span className="block text-xs uppercase text-slate-500">Cajero</span>
            <strong>{cashClosingSummary?.session.user?.name ?? user.name}</strong>
          </div>
          <div className={isDarkTheme ? 'border border-[#4b4b4b] p-3' : 'border border-stone-200 p-3'}>
            <span className="block text-xs uppercase text-slate-500">Caja</span>
            <strong>{cashClosingSummary?.session.cash_register?.name ?? currentCashSession?.cash_register?.name ?? 'Caja activa'}</strong>
          </div>
          <div className={isDarkTheme ? 'border border-[#4b4b4b] p-3' : 'border border-stone-200 p-3'}>
            <span className="block text-xs uppercase text-slate-500">Turno</span>
            <strong>{cashClosingSummary?.session.shift ?? currentCashSession?.shift ?? 'Sin turno'}</strong>
          </div>
          <div className={isDarkTheme ? 'border border-[#4b4b4b] p-3' : 'border border-stone-200 p-3'}>
            <span className="block text-xs uppercase text-slate-500">Ventas</span>
            <strong>{cashClosingSummary?.sales_count ?? 0}</strong>
          </div>
        </div>
        {pendingFiscalCount > 0 && (
          <div className="mt-4 border border-amber-500 bg-amber-500/10 p-3 text-sm text-amber-200">
            Hay {pendingFiscalCount} documento(s) Hacienda pendientes. El cierre se bloqueara hasta resolver o consultar estado.
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className={isDarkTheme ? 'space-y-2 border border-[#4b4b4b] p-4' : 'space-y-2 border border-stone-200 p-4'}>
            <h3 className="font-bold">Efectivo</h3>
            <div className="flex justify-between text-sm"><span>Fondo inicial</span><strong>{currency.format(Number(cashClosingSummary?.opening_amount ?? 0))}</strong></div>
            <div className="flex justify-between text-sm"><span>Depositos</span><strong>{currency.format(Number(cashClosingSummary?.cash_deposits ?? 0))}</strong></div>
            <div className="flex justify-between text-sm"><span>Retiros</span><strong>{currency.format(Number(cashClosingSummary?.cash_withdrawals ?? 0))}</strong></div>
            <div className="flex justify-between border-t border-slate-300 pt-2 text-lg font-bold"><span>Esperado</span><span>{currency.format(closingExpected)}</span></div>
          </div>

          <div className={isDarkTheme ? 'space-y-2 border border-[#4b4b4b] p-4' : 'space-y-2 border border-stone-200 p-4'}>
            <h3 className="font-bold">Formas de pago</h3>
            {(cashClosingSummary?.payments ?? []).map((payment) => (
              <div key={payment.method} className="flex justify-between text-sm">
                <span>{paymentLabels[payment.method] ?? payment.method} ({payment.count})</span>
                <strong>{currency.format(Number(payment.total))}</strong>
              </div>
            ))}
            {(cashClosingSummary?.payments ?? []).length === 0 && <p className="text-sm text-slate-500">No hay ventas cobradas en este turno.</p>}
            <div className="flex justify-between border-t border-slate-300 pt-2 text-lg font-bold"><span>Total ventas</span><span>{currency.format(Number(cashClosingSummary?.gross_sales ?? 0))}</span></div>
          </div>
        </div>

        <div className="mt-4 border border-[#4b4b4b] p-4">
          <h3 className="mb-3 font-bold">Desglose de billetes y monedas</h3>
          <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
            {cashDenominations.map((denomination) => (
              <label key={denomination} className="grid grid-cols-[1fr_72px] items-center gap-2 text-sm">
                <span>{currency.format(denomination)}</span>
                <Input
                  className="h-8 px-2"
                  type="number"
                  min="0"
                  value={cashBreakdown[String(denomination)] ?? ''}
                  onChange={(event) => setCashBreakdown((current) => ({ ...current, [denomination]: event.target.value }))}
                />
              </label>
            ))}
          </div>
          <div className="mt-3 flex justify-between border-t border-[#4b4b4b] pt-2 text-sm font-bold">
            <span>Total desglose</span>
            <span>{currency.format(cashBreakdownTotal)}</span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[180px_180px_1fr]">
          <Input placeholder="Efectivo contado" type="number" value={cashClosingAmount} onChange={(event) => setCashClosingAmount(event.target.value)} />
          <div className={closingDifference === 0 ? 'border border-[#0088cc] p-3 text-sm font-bold text-[#0088cc]' : 'border border-red-500 p-3 text-sm font-bold text-red-500'}>
            Diferencia: {currency.format(closingDifference)}
          </div>
          <Input placeholder={closingDifference === 0 ? 'Observacion opcional' : 'Motivo de faltante o sobrante'} value={cashClosingNotes} onChange={(event) => setCashClosingNotes(event.target.value)} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={cancelCashClosingDialog} disabled={loading}>Cancelar</Button>
          <Button
            variant="danger"
            onClick={() => askConfirmation({
              title: 'Cerrar caja',
              message: `Se cerrara la caja con ${currency.format(closingCounted)} contado y diferencia de ${currency.format(closingDifference)}.`,
              tone: 'danger',
              confirmLabel: 'Cerrar caja',
              onConfirm: closeCashSession,
            })}
            disabled={loading || !cashClosingAmount || pendingFiscalCount > 0}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <WalletCards size={18} />}
            Cerrar caja
          </Button>
        </div>
      </Card>
    </div>
  )
}
