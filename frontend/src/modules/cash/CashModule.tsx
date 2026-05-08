import { Banknote } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'
import { SelectBox } from '../../components/shared/SelectBox'
import { currency } from '../../lib/utils'
import type { CashMovement } from '../../types'

export function CashModule({ movements, type, amount, reason, loading, cashSessionOpen, onType, onAmount, onReason, onCreate }: {
  movements: CashMovement[]
  type: 'deposit' | 'withdrawal'
  amount: string
  reason: string
  loading: boolean
  cashSessionOpen: boolean
  onType: (value: 'deposit' | 'withdrawal') => void
  onAmount: (value: string) => void
  onReason: (value: string) => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-4">
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
