import type { BadgeDollarSign } from 'lucide-react'

export type ModuleKey =
  | 'sale'
  | 'inventory'
  | 'customers'
  | 'reports'
  | 'cash'
  | 'credit'
  | 'promotions'
  | 'payments'
  | 'invoices'
  | 'barcodes'
  | 'printer'
  | 'backups'
  | 'settings'

export type AppTheme = 'dark' | 'light'
export type ToastTone = 'success' | 'error' | 'info'
export type ToastMessage = { id: number; text: string; tone: ToastTone }
export type Paginated<T> = { data: T[] }

export type AuthResponse = {
  token: string
  user: {
    name: string
    email: string
    branch?: { name?: string } | null
  }
}

export type CashSession = {
  id: number
  expected_amount: string
  opening_amount: string
  closing_amount?: string | null
  difference_amount?: string | null
  shift?: string | null
  supervisor_name?: string | null
  opened_at?: string
  closed_at?: string | null
  status: 'open' | 'closed'
  cash_register?: CashRegister | null
  user?: { id: number; name: string; email?: string } | null
}

export type CashRegister = {
  id: number
  branch_id: number
  name: string
  code: string
  is_active: boolean
}

export type CashSessionSummary = {
  session: CashSession
  sales_count: number
  gross_sales: string
  opening_amount: string
  expected_amount: string
  cash_deposits: string
  cash_withdrawals: string
  payments: Array<{ method: string; total: string; count: number }>
}

export type BackupRow = {
  name: string
  size: number
  created_at: string
}

export type CashOpeningForm = {
  cash_register_id: string
  shift: string
  opening_amount: string
  supervisor_name: string
}

export const emptyCashOpeningForm: CashOpeningForm = {
  cash_register_id: '',
  shift: 'Mañana',
  opening_amount: '',
  supervisor_name: '',
}

export type NavItem = { key: ModuleKey; label: string; icon: typeof BadgeDollarSign }
