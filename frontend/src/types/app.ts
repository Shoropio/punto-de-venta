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
  status: 'open' | 'closed'
}

export type NavItem = { key: ModuleKey; label: string; icon: typeof BadgeDollarSign }
