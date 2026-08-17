import { useState } from 'react'
import { Clock, Loader2, Plus, Users } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'

export type Employee = {
  id: number
  name: string
  identification?: string
  position?: string
  department?: string
  phone?: string
  email?: string
  hire_date?: string
  pin?: string
  is_active: boolean
}

export type Attendance = {
  id: number
  employee_id: number
  employee_name: string
  department?: string
  work_date: string
  clock_in?: string
  clock_out?: string
  notes?: string
}

export function HrModule({
  employees,
  attendances,
  loading,
  clockResult,
  newEmployeeName,
  newEmployeeId,
  newEmployeePosition,
  newEmployeeDepartment,
  newEmployeePin,
  attendancePin,
  onNewEmployeeName,
  onNewEmployeeId,
  onNewEmployeePosition,
  onNewEmployeeDepartment,
  onNewEmployeePin,
  onCreateEmployee,
  onAttendancePin,
  onClock,
}: {
  employees: Employee[]
  attendances: Attendance[]
  loading: boolean
  clockResult: string | null
  newEmployeeName: string
  newEmployeeId: string
  newEmployeePosition: string
  newEmployeeDepartment: string
  newEmployeePin: string
  attendancePin: string
  onNewEmployeeName: (v: string) => void
  onNewEmployeeId: (v: string) => void
  onNewEmployeePosition: (v: string) => void
  onNewEmployeeDepartment: (v: string) => void
  onNewEmployeePin: (v: string) => void
  onCreateEmployee: () => void
  onAttendancePin: (v: string) => void
  onClock: () => void
}) {
  const [tab, setTab] = useState<'employees' | 'attendance'>('employees')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-slate-200">
        <button className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition ${tab === 'employees' ? 'border-b-2 border-[#0088cc] text-[#0088cc]' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setTab('employees')}>
          <Users size={15} /> Empleados
        </button>
        <button className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition ${tab === 'attendance' ? 'border-b-2 border-[#0088cc] text-[#0088cc]' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setTab('attendance')}>
          <Clock size={15} /> Asistencia
        </button>
      </div>

      {tab === 'employees' && (
        <div className="space-y-4">
          <Card className="grid gap-3 p-4 md:grid-cols-[1fr_120px_120px_120px_80px_auto]">
            <Input placeholder="Nombre completo" value={newEmployeeName} onChange={(e) => onNewEmployeeName(e.target.value)} />
            <Input placeholder="Cedula" value={newEmployeeId} onChange={(e) => onNewEmployeeId(e.target.value)} />
            <Input placeholder="Puesto" value={newEmployeePosition} onChange={(e) => onNewEmployeePosition(e.target.value)} />
            <Input placeholder="Departamento" value={newEmployeeDepartment} onChange={(e) => onNewEmployeeDepartment(e.target.value)} />
            <Input placeholder="PIN" value={newEmployeePin} onChange={(e) => onNewEmployeePin(e.target.value)} maxLength={10} />
            <Button onClick={onCreateEmployee} disabled={loading}><Plus size={16} /> Agregar</Button>
          </Card>

          <DataCard title="Empleados" empty="No hay empleados registrados.">
            {employees.map((emp) => (
              <div key={emp.id} className="grid grid-cols-[1fr_120px_120px_80px] items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-bold">{emp.name}</p>
                  <p className="text-xs text-slate-500">{emp.email || emp.identification || '-'}</p>
                </div>
                <span className="text-xs text-slate-500">{emp.position || '-'}</span>
                <span className="text-xs text-slate-500">{emp.department || '-'}</span>
                <span className={`text-xs font-semibold ${emp.is_active ? 'text-emerald-600' : 'text-red-500'}`}>{emp.is_active ? 'Activo' : 'Inactivo'}</span>
              </div>
            ))}
          </DataCard>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <Card className="p-4">
            <p className="mb-3 text-xs font-bold uppercase text-slate-500">Registrar asistencia</p>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  placeholder="PIN del empleado"
                  value={attendancePin}
                  onChange={(e) => onAttendancePin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onClock()}
                  maxLength={10}
                />
              </div>
              <Button onClick={onClock} disabled={loading || !attendancePin.trim()}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                {loading ? 'Procesando...' : 'Marcar'}
              </Button>
            </div>
            {clockResult && (
              <p className="mt-2 text-sm font-semibold text-[#0088cc]">{clockResult}</p>
            )}
          </Card>

          <DataCard title="Registro de Asistencia" empty="No hay registros de asistencia.">
            {attendances.map((att) => (
              <div key={att.id} className="grid grid-cols-[1fr_100px_80px_80px] items-center gap-3 border-t border-slate-100 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-bold">{att.employee_name}</p>
                  <p className="text-xs text-slate-500">{att.department || '-'}</p>
                </div>
                <span className="font-mono text-xs">{att.work_date}</span>
                <span className="font-mono text-xs text-emerald-600">{att.clock_in ? new Date(att.clock_in).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                <span className="font-mono text-xs text-red-500">{att.clock_out ? new Date(att.clock_out).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
              </div>
            ))}
          </DataCard>
        </div>
      )}
    </div>
  )
}
