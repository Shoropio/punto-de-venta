import { useEffect, useState } from 'react'
import { Landmark } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { SelectBox } from '../../components/shared/SelectBox'
import type { ActivityLogRow, AdminUserPayload, AdminUserRow, NamedCatalog, PermissionRow, RoleRow } from '../../types'

const emptyUserForm = {
  name: '',
  email: '',
  password: '',
  role_id: '',
  branch_id: '',
  is_active: true,
}

export function AdminModule({
  roles,
  permissions,
  users,
  branches,
  logs,
  loading,
  onTogglePermission,
  onSaveUser,
  onTestHacienda,
}: {
  roles: RoleRow[]
  permissions: PermissionRow[]
  users: AdminUserRow[]
  branches: NamedCatalog[]
  logs: ActivityLogRow[]
  loading: boolean
  onTogglePermission: (role: RoleRow, permission: PermissionRow) => void
  onSaveUser: (userId: number | null, payload: AdminUserPayload) => void
  onTestHacienda: () => void
}) {
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [userForm, setUserForm] = useState(emptyUserForm)

  useEffect(() => {
    if (editingUserId && !users.some((user) => user.id === editingUserId)) {
      setEditingUserId(null)
      setUserForm(emptyUserForm)
    }
  }, [editingUserId, users])

  const moduleLabels: Record<string, string> = {
    pos: 'Punto de venta',
    sales: 'Ventas',
    cash: 'Caja',
    inventory: 'Inventario',
    reports: 'Reportes',
    hacienda: 'Hacienda',
    settings: 'Configuracion',
  }

  const editUser = (user: AdminUserRow) => {
    setEditingUserId(user.id)
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      role_id: user.role_id ? String(user.role_id) : '',
      branch_id: user.branch_id ? String(user.branch_id) : '',
      is_active: user.is_active,
    })
  }

  const resetUserForm = () => {
    setEditingUserId(null)
    setUserForm(emptyUserForm)
  }

  const submitUser = () => {
    const payload: AdminUserPayload = {
      name: userForm.name.trim(),
      email: userForm.email.trim(),
      password: userForm.password.trim() || undefined,
      role_id: userForm.role_id ? Number(userForm.role_id) : null,
      branch_id: userForm.branch_id ? Number(userForm.branch_id) : null,
      is_active: userForm.is_active,
    }

    onSaveUser(editingUserId, payload)
    if (!editingUserId) {
      setUserForm(emptyUserForm)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[#0088cc]">Administracion</p>
        <h2 className="text-2xl font-bold">Usuarios, permisos y auditoria</h2>
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
                  const label = permission.description ?? humanizePermission(permission.name)
                  return (
                    <button
                      key={permission.id}
                      className={enabled ? 'border border-[#0088cc] bg-[#0088cc] px-3 py-2 text-left text-xs text-white' : 'border border-slate-200 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:border-[#4b4b4b] dark:hover:bg-[#303030]'}
                      onClick={() => onTogglePermission(role, permission)}
                      disabled={loading}
                      title={permission.name}
                    >
                      <span className="block font-semibold">{label}</span>
                      <span className={enabled ? 'text-white/75' : 'text-slate-500'}>{moduleLabels[permission.module] ?? permission.module}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Usuarios</div>
          <div className="grid gap-2 border-t border-slate-100 p-4 md:grid-cols-2">
            <Input placeholder="Nombre" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} />
            <Input placeholder="Correo" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} />
            <Input placeholder={editingUserId ? 'Nueva contrasena opcional' : 'Contrasena'} type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} />
            <SelectBox value={userForm.role_id} onChange={(value) => setUserForm({ ...userForm, role_id: value })}>
              <option value="">Sin rol</option>
              {roles.map((role) => <option key={role.id} value={role.id}>{role.display_name}</option>)}
            </SelectBox>
            <SelectBox value={userForm.branch_id} onChange={(value) => setUserForm({ ...userForm, branch_id: value })}>
              <option value="">Sin sucursal</option>
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </SelectBox>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={userForm.is_active} onChange={(event) => setUserForm({ ...userForm, is_active: event.target.checked })} />
              Usuario activo
            </label>
            <div className="flex gap-2 md:col-span-2">
              <Button onClick={submitUser} disabled={loading}>
                {editingUserId ? 'Actualizar usuario' : 'Crear usuario'}
              </Button>
              {editingUserId && <Button variant="secondary" onClick={resetUserForm} disabled={loading}>Cancelar</Button>}
            </div>
          </div>
          {users.map((user) => (
            <div key={user.id} className="grid gap-3 border-t border-slate-100 px-4 py-3 text-sm lg:grid-cols-[1fr_150px_150px_90px_auto] lg:items-center">
              <span>
                <span className="block font-semibold">{user.name}</span>
                <span className="block text-xs text-slate-500">{user.email}</span>
              </span>
              <span className="text-slate-500">{user.role?.display_name ?? 'Sin rol'}</span>
              <span className="text-slate-500">{user.branch?.name ?? 'Sin sucursal'}</span>
              <span className={user.is_active ? 'text-[#0088cc]' : 'text-red-500'}>{user.is_active ? 'Activo' : 'Bloqueado'}</span>
              <Button variant="secondary" onClick={() => editUser(user)} disabled={loading}>Editar</Button>
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
    </div>
  )
}

function humanizePermission(permission: string): string {
  const labels: Record<string, string> = {
    'pos.sell': 'Crear ventas',
    'sales.cancel': 'Anular ventas',
    'refunds.create': 'Registrar devoluciones',
    'cash.open': 'Abrir caja',
    'cash.close': 'Cerrar caja',
    'cash.move': 'Depositos y retiros',
    'inventory.manage': 'Gestionar inventario',
    'products.delete': 'Eliminar productos',
    'reports.view': 'Ver reportes',
    'hacienda.manage': 'Gestionar Hacienda',
    'backups.manage': 'Gestionar respaldos',
    'settings.manage': 'Administrar configuracion',
  }

  return labels[permission] ?? permission
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
