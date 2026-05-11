import { AlertTriangle, CheckCircle2, Info, Printer, ShieldCheck } from 'lucide-react'
import { getToastTone } from '../../lib/pos-utils'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { StatusTile } from './StatusTile'

export function ModuleStatusBar({
  userName,
  apiOnline,
  cashSessionOpen,
  cashSessionId,
  lowStockCount,
  message,
  hasReceipt,
  onPrint,
}: {
  userName: string
  apiOnline: boolean
  cashSessionOpen: boolean
  cashSessionId: number | null
  lowStockCount: number
  message: string
  hasReceipt: boolean
  onPrint: () => void
}) {
  const messageTone = getToastTone(message)
  const messageStyle = messageTone === 'success'
    ? 'border-[#0088cc]/40 bg-[#0b2a3a]/40 text-[#7dd3fc]'
    : messageTone === 'error'
      ? 'border-red-700/50 bg-red-950/40 text-red-200'
      : 'border-[#575757]/60 bg-[#242424]/40 text-slate-300'
  const MessageIcon = messageTone === 'success' ? CheckCircle2 : messageTone === 'error' ? AlertTriangle : Info

  return (
    <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1.4fr_auto]">
      <Card className="flex items-center gap-3 p-4">
        <ShieldCheck className={cashSessionOpen ? 'text-[#0088cc]' : 'text-slate-400'} size={24} />
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Operacion</p>
          <p className="text-sm font-bold">Caja 01 - {cashSessionOpen ? `Sesion ${cashSessionId}` : 'sin turno'}</p>
        </div>
      </Card>
      <Card className="grid grid-cols-2 gap-3 p-3 text-sm">
        <StatusTile label="Usuario" value={userName} />
        <StatusTile label="Estado" value={apiOnline ? 'En linea' : 'Sin conexion'} />
      </Card>
      <Card className={`flex items-center gap-3 border p-4 ${messageStyle}`}>
        <MessageIcon className="shrink-0" size={22} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase opacity-75">Estado del modulo</p>
          <p className="truncate text-sm font-medium">{message}</p>
        </div>
      </Card>
      <Card className="flex items-center gap-3 p-3">
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="font-semibold">{lowStockCount}</span> stock bajo
        </div>
        {hasReceipt && (
          <Button variant="secondary" onClick={onPrint}>
            <Printer size={18} />
            Recibo
          </Button>
        )}
      </Card>
    </div>
  )
}
