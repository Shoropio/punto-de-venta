export type PermissionRow = {
  id: number
  name: string
  module: string
  description?: string | null
}

export type RoleRow = {
  id: number
  name: string
  display_name: string
  permissions: PermissionRow[]
}

export type AdminUserRow = {
  id: number
  name: string
  email: string
  role_id?: number | null
  branch_id?: number | null
  is_active: boolean
  role?: RoleRow | null
  branch?: { name?: string } | null
}

export type AdminUserPayload = {
  name?: string
  email?: string
  password?: string
  role_id?: number | null
  branch_id?: number | null
  is_active?: boolean
}

export type ActivityLogRow = {
  id: number
  action: string
  subject_type?: string | null
  subject_id?: number | null
  properties?: Record<string, unknown> | null
  ip_address?: string | null
  created_at: string
  user?: { name?: string; email?: string } | null
}

export type DashboardSummary = {
  sales_today: number
  gross_today: string
  open_cash_sessions: Array<{ id: number; user?: { name?: string } | null; cash_register?: { name?: string } | null }>
  payments_today: Array<{ method: string; total: string }>
  low_stock: number
  pending_hacienda: number
  rejected_hacienda: number
}

export type BackupSchedule = {
  backup_enabled?: boolean | string
  backup_frequency?: 'daily' | 'weekly'
  backup_time?: string
  backup_retention?: number
}
