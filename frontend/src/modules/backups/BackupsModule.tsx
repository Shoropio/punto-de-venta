import { Cloud, Download, RefreshCw, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Empty } from '../../components/shared/Empty'
import { Input } from '../../components/ui/input'
import { SelectBox } from '../../components/shared/SelectBox'
import type { BackupRow, BackupSchedule } from '../../types'

export function BackupsModule({
  backups,
  schedule,
  loading,
  onCreate,
  onDownload,
  onVerify,
  onRestore,
  onDelete,
  onSchedule,
  onCloudSync,
}: {
  backups: BackupRow[]
  schedule: BackupSchedule
  loading: boolean
  onCreate: () => void
  onDownload: (backup: BackupRow) => void
  onVerify: (backup: BackupRow) => void
  onRestore: (backup: BackupRow) => void
  onDelete: (backup: BackupRow) => void
  onSchedule: (schedule: { enabled: boolean; frequency: 'daily' | 'weekly'; time: string; retention: number }) => void
  onCloudSync: () => void
}) {
  const enabled = schedule.backup_enabled === true || schedule.backup_enabled === 'true'
  const frequency = schedule.backup_frequency ?? 'daily'
  const time = String(schedule.backup_time ?? '02:00')
  const retention = Number(schedule.backup_retention ?? 30)

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold">Respaldos</h2>
          <p className="text-sm text-slate-500">Crea un archivo .zip con una copia JSON de la base de datos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCloudSync} disabled={loading}>
            <Cloud size={18} />
            Sincronizar a Firestore
          </Button>
          <Button onClick={onCreate} disabled={loading}>
            <ShieldCheck size={18} />
            Crear respaldo
          </Button>
        </div>
      </Card>

      <Card className="grid gap-3 p-4 md:grid-cols-[160px_160px_160px_1fr_auto] md:items-center">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" defaultChecked={enabled} id="backup-enabled" />
          Automaticos
        </label>
        <SelectBox value={frequency} onChange={(value) => {
          const input = document.getElementById('backup-frequency') as HTMLInputElement | null
          if (input) input.value = value
        }}>
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
        </SelectBox>
        <input id="backup-frequency" type="hidden" defaultValue={frequency} />
        <Input id="backup-time" type="time" defaultValue={time} />
        <Input id="backup-retention" type="number" min="1" max="365" defaultValue={String(retention)} placeholder="Retencion dias" />
        <Button
          variant="secondary"
          onClick={() => onSchedule({
            enabled: Boolean((document.getElementById('backup-enabled') as HTMLInputElement | null)?.checked),
            frequency: ((document.getElementById('backup-frequency') as HTMLInputElement | null)?.value || 'daily') as 'daily' | 'weekly',
            time: (document.getElementById('backup-time') as HTMLInputElement | null)?.value || '02:00',
            retention: Number((document.getElementById('backup-retention') as HTMLInputElement | null)?.value || 30),
          })}
          disabled={loading}
        >
          Programar
        </Button>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_190px_160px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Archivo</span>
          <span>Tamaño</span>
          <span>Fecha</span>
          <span>Acciones</span>
        </div>
        {backups.map((backup) => (
          <div key={backup.name} className="grid grid-cols-[1fr_120px_190px_160px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{backup.name}</span>
            <span className="text-slate-500">{formatSize(backup.size)}</span>
            <span className="text-slate-500">{new Date(backup.created_at).toLocaleString()}</span>
            <span className="flex gap-1">
              <Button aria-label={`Descargar ${backup.name}`} className="h-8 px-2" variant="ghost" onClick={() => onDownload(backup)}><Download size={14} /></Button>
              <Button aria-label={`Verificar ${backup.name}`} className="h-8 px-2" variant="ghost" onClick={() => onVerify(backup)}><ShieldCheck size={14} /></Button>
              <Button aria-label={`Restaurar ${backup.name}`} className="h-8 px-2" variant="ghost" onClick={() => onRestore(backup)}><RotateCcw size={14} /></Button>
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
