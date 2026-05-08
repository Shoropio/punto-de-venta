import { Banknote, CheckCircle2, LockKeyhole, WalletCards } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'
import { SelectBox } from '../../components/shared/SelectBox'
import { currency } from '../../lib/utils'
import type { CashMovement, CashOpeningForm, CashRegister, CashSession } from '../../types'

export function CashModule({
  movements,
  type,
  amount,
  reason,
  registers,
  openingForm,
  currentSession,
  closingAmount,
  loading,
  cashSessionOpen,
  onType,
  onAmount,
  onReason,
  onOpeningForm,
  onOpening,
  onClosingAmount,
  onClosing,
  onCreate,
}: {
  movements: CashMovement[]
  type: 'deposit' | 'withdrawal'
  amount: string
  reason: string
  registers: CashRegister[]
  openingForm: CashOpeningForm
  currentSession: CashSession | null
  closingAmount: string
  loading: boolean
  cashSessionOpen: boolean
  onType: (value: 'deposit' | 'withdrawal') => void
  onAmount: (value: string) => void
  onReason: (value: string) => void
  onOpeningForm: (value: CashOpeningForm) => void
  onOpening: () => void
  onClosingAmount: (value: string) => void
  onClosing: () => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="mb-3 text-lg font-bold">{cashSessionOpen ? 'Resumen de apertura' : 'Apertura de caja'}</h2>
        {cashSessionOpen && currentSession ? (
          <div className="grid gap-3 md:grid-cols-4">
            <div className="border border-slate-100 p-3">
              <span className="block text-xs uppercase text-slate-500">Usuario activo</span>
              <strong>{currentSession.user?.name ?? 'Cajero activo'}</strong>
            </div>
            <div className="border border-slate-100 p-3">
              <span className="block text-xs uppercase text-slate-500">Caja asignada</span>
              <strong>{currentSession.cash_register?.name ?? `Caja ${currentSession.cash_register?.code ?? ''}`}</strong>
            </div>
            <div className="border border-slate-100 p-3">
              <span className="block text-xs uppercase text-slate-500">Turno</span>
              <strong>{currentSession.shift ?? 'Sin turno'}</strong>
            </div>
            <div className="border border-slate-100 p-3">
              <span className="block text-xs uppercase text-slate-500">Fondo inicial</span>
              <strong>{currency.format(Number(currentSession.opening_amount))}</strong>
            </div>
            <div className="md:col-span-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={18} />
                Supervisor: {currentSession.supervisor_name ?? 'Confirmado presencialmente'}
              </div>
              <Input placeholder="Monto contado al cierre" type="number" value={closingAmount} onChange={(event) => onClosingAmount(event.target.value)} />
              <Button variant="secondary" onClick={onClosing} disabled={loading || !closingAmount}>
                <LockKeyhole size={18} />
                Cerrar caja
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-[1fr_150px_160px_1fr_auto]">
            <SelectBox value={openingForm.cash_register_id} onChange={(value) => onOpeningForm({ ...openingForm, cash_register_id: value })}>
              <option value="">Caja asignada</option>
              {registers.map((register) => <option key={register.id} value={register.id}>{register.name}</option>)}
            </SelectBox>
            <SelectBox value={openingForm.shift} onChange={(value) => onOpeningForm({ ...openingForm, shift: value })}>
              <option value="Mañana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
            </SelectBox>
            <Input placeholder="Fondo inicial" type="number" value={openingForm.opening_amount} onChange={(event) => onOpeningForm({ ...openingForm, opening_amount: event.target.value })} />
            <Input placeholder="Supervisor" value={openingForm.supervisor_name} onChange={(event) => onOpeningForm({ ...openingForm, supervisor_name: event.target.value })} />
            <Button onClick={onOpening} disabled={loading}>
              <WalletCards size={18} />
              Abrir caja
            </Button>
          </div>
        )}
      </Card>

      <Card className="grid gap-3 p-4 md:grid-cols-[180px_180px_1fr_auto]">
        <SelectBox value={type} onChange={(value) => onType(value as 'deposit' | 'withdrawal')}>
          <option value="deposit">Deposito</option>
          <option value="withdrawal">Retiro</option>
        </SelectBox>
        <Input placeholder="Monto" type="number" value={amount} onChange={(event) => onAmount(event.target.value)} />
        <Input placeholder="Motivo" value={reason} onChange={(event) => onReason(event.target.value)} />
        <Button title={cashSessionOpen ? undefined : 'Abre caja antes de registrar'} onClick={onCreate} disabled={loading || !amount || !reason.trim()}><Banknote size={18} /> Registrar</Button>
      </Card>
      <DataCard title="Depositos y retiros" empty="No hay movimientos de caja.">
        {movements.map((movement) => (
          <div key={movement.id} className="grid grid-cols-[120px_120px_1fr_160px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className={movement.type === 'deposit' ? 'font-bold text-[#0088cc]' : 'font-bold text-red-500'}>{movement.type === 'deposit' ? 'Deposito' : 'Retiro'}</span>
            <span>{currency.format(Number(movement.amount))}</span>
            <span>{movement.reason}</span>
            <span className="text-slate-500">{new Date(movement.created_at).toLocaleString()}</span>
          </div>
        ))}
      </DataCard>
    </div>
  )
}
