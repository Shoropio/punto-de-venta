import { Download, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Empty } from '../../components/shared/Empty'
import type { BackupRow } from '../../types'

export function BackupsModule({
  backups,
  loading,
  onCreate,
  onDownload,
  onDelete,
}: {
  backups: BackupRow[]
  loading: boolean
  onCreate: () => void
  onDownload: (backup: BackupRow) => void
  onDelete: (backup: BackupRow) => void
}) {
  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold">Respaldos</h2>
          <p className="text-sm text-slate-500">Crea un archivo .zip con una copia JSON de la base de datos.</p>
        </div>
        <Button onClick={onCreate} disabled={loading}>
          <ShieldCheck size={18} />
          Crear respaldo
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_190px_120px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Archivo</span>
          <span>Tamano</span>
          <span>Fecha</span>
          <span>Acciones</span>
        </div>
        {backups.map((backup) => (
          <div key={backup.name} className="grid grid-cols-[1fr_120px_190px_120px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{backup.name}</span>
            <span className="text-slate-500">{formatSize(backup.size)}</span>
            <span className="text-slate-500">{new Date(backup.created_at).toLocaleString()}</span>
            <span className="flex gap-1">
              <Button aria-label={`Descargar ${backup.name}`} className="h-8 px-2" variant="ghost" onClick={() => onDownload(backup)}><Download size={14} /></Button>
              <Button aria-label={`Eliminar ${backup.name}`} className="h-8 px-2" variant="ghost" onClick={() => onDelete(backup)}><Trash2 size={14} /></Button>
            </span>
          </div>
        ))}
        {backups.length === 0 && <Empty text="No hay respaldos creados." />}
      </Card>

      <Button variant="secondary" onClick={onCreate} disabled={loading}>
        <RefreshCw size={18} />
        Generar otro respaldo
      </Button>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
