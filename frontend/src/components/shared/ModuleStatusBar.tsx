import { Building2, Printer, ShieldCheck } from 'lucide-react'
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
  return (
    <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1.4fr_auto]">
      <Card className="flex items-center gap-3 p-4">
        <ShieldCheck className={cashSessionOpen ? 'text-[#0088cc]' : 'text-slate-400'} size={24} />
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Operación</p>
          <p className="text-sm font-bold">Caja 01 - {cashSessionOpen ? `Sesión ${cashSessionId}` : 'sin turno'}</p>
        </div>
      </Card>
      <Card className="grid grid-cols-2 gap-3 p-3 text-sm">
        <StatusTile label="Usuario" value={userName} />
        <StatusTile label="Estado" value={apiOnline ? 'En línea' : 'Sin conexión'} />
      </Card>
      <Card className="flex items-center gap-3 p-4">
        <Building2 className="text-[#0088cc]" size={22} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500">Estado del módulo</p>
          <p className="truncate text-sm text-slate-700">{message}</p>
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
