import { CheckCircle2, Landmark, ShieldCheck } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { SelectBox } from '../../components/shared/SelectBox'
import { currency } from '../../lib/utils'
import type { ActivityLogRow, AdminUserRow, DashboardSummary, PermissionRow, RoleRow } from '../../types'

export function AdminModule({
  dashboard,
  roles,
  permissions,
  users,
  logs,
  loading,
  onTogglePermission,
  onAssignRole,
  onTestHacienda,
}: {
  dashboard: DashboardSummary | null
  roles: RoleRow[]
  permissions: PermissionRow[]
  users: AdminUserRow[]
  logs: ActivityLogRow[]
  loading: boolean
  onTogglePermission: (role: RoleRow, permission: PermissionRow) => void
  onAssignRole: (userId: number, roleId: string) => void
  onTestHacienda: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-4">
        <Metric label="Ventas hoy" value={String(dashboard?.sales_today ?? 0)} />
        <Metric label="Ingreso hoy" value={currency.format(Number(dashboard?.gross_today ?? 0))} />
        <Metric label="Stock bajo" value={String(dashboard?.low_stock ?? 0)} />
        <Metric label="Hacienda pendientes" value={`${dashboard?.pending_hacienda ?? 0}/${dashboard?.rejected_hacienda ?? 0} rechaz.`} />
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Validacion Hacienda</h2>
            <p className="text-sm text-slate-500">Prueba certificado, PIN, credenciales ATV, actividad economica y sucursal/terminal.</p>
          </div>
          <Button onClick={onTestHacienda} disabled={loading}>
            <Landmark size={18} />
            Probar conexion
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Roles y permisos</div>
          {roles.map((role) => (
            <div key={role.id} className="border-t border-slate-100 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-bold">{role.display_name}</span>
                <span className="text-xs text-slate-500">{role.permissions.length} permisos</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {permissions.map((permission) => {
                  const enabled = role.permissions.some((item) => item.id === permission.id)
                  return (
                    <button
                      key={permission.id}
                      className={enabled ? 'border border-[#0088cc] bg-[#0088cc] px-3 py-2 text-left text-xs text-white' : 'border border-slate-200 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:border-[#4b4b4b] dark:hover:bg-[#303030]'}
                      onClick={() => onTogglePermission(role, permission)}
                      disabled={loading}
                    >
                      <span className="block font-semibold">{permission.name}</span>
                      <span className={enabled ? 'text-white/75' : 'text-slate-500'}>{permission.description ?? permission.module}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Usuarios</div>
          {users.map((user) => (
            <div key={user.id} className="grid grid-cols-[1fr_180px_90px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <span>
                <span className="block font-semibold">{user.name}</span>
                <span className="block text-xs text-slate-500">{user.email}</span>
              </span>
              <SelectBox value={user.role_id ? String(user.role_id) : ''} onChange={(value) => onAssignRole(user.id, value)}>
                <option value="">Sin rol</option>
                {roles.map((role) => <option key={role.id} value={role.id}>{role.display_name}</option>)}
              </SelectBox>
              <span className={user.is_active ? 'text-[#0088cc]' : 'text-red-500'}>{user.is_active ? 'Activo' : 'Bloqueado'}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Auditoria reciente</div>
        {logs.map((log) => (
          <div key={log.id} className="grid grid-cols-[180px_1fr_180px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{log.action}</span>
            <span className="truncate text-slate-500">{log.user?.name ?? 'Sistema'} {log.subject_type ? `- ${log.subject_type.split('\\').pop()} #${log.subject_id ?? '-'}` : ''}</span>
            <span className="text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        ))}
      </Card>

      <Card className="overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Cajas abiertas</div>
        {(dashboard?.open_cash_sessions ?? []).map((session) => (
          <div key={session.id} className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <CheckCircle2 className="text-[#0088cc]" size={18} />
            <span className="font-semibold">{session.cash_register?.name ?? `Sesion ${session.id}`}</span>
            <span className="text-slate-500">{session.user?.name ?? 'Sin usuario'}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <ShieldCheck className="text-[#0088cc]" size={22} />
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </Card>
  )
}
