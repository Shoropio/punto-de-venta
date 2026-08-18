import { Archive, BadgeDollarSign, Banknote, Barcode, BarChart3, Boxes, CreditCard, LayoutDashboard, Printer, ReceiptText, Settings, Tags, UserCog, Users, WalletCards, BookOpen, Clock } from 'lucide-react'
import type { ModuleKey, NavItem } from '../types'

export const HELD_SALE_KEY = 'pos_held_sale'

export const cashDenominations = [20000, 10000, 5000, 2000, 1000, 500, 100, 50, 25, 10, 5] as const

export type ConfirmAction = {
  title: string
  message: string
  tone?: 'danger' | 'primary'
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
}

export const nav: NavItem[] = [
  { key: 'sale', label: 'Venta', icon: BadgeDollarSign },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'inventory', label: 'Inventario', icon: Boxes },
  { key: 'customers', label: 'Clientes', icon: Users },
  { key: 'reports', label: 'Reportes', icon: BarChart3 },
  { key: 'cash', label: 'Caja', icon: Banknote },
  { key: 'credit', label: 'Credito', icon: WalletCards },
  { key: 'promotions', label: 'Promociones', icon: Tags },
  { key: 'payments', label: 'Formas de pago', icon: CreditCard },
  { key: 'invoices', label: 'Factura', icon: ReceiptText },
  { key: 'accounting', label: 'Contabilidad', icon: BookOpen },
  { key: 'hr', label: 'RRHH', icon: Clock },
  { key: 'barcodes', label: 'Codigos', icon: Barcode },
  { key: 'printer', label: 'Impresora', icon: Printer },
  { key: 'backups', label: 'Respaldos', icon: Archive },
  { key: 'settings', label: 'Configuracion', icon: Settings },
  { key: 'admin', label: 'Admin', icon: UserCog },
]

export const modulePermissions: Record<ModuleKey, string[]> = {
  sale: ['pos.sell'],
  dashboard: ['reports.view'],
  inventory: ['inventory.manage'],
  customers: ['settings.manage', 'pos.sell'],
  reports: ['reports.view'],
  cash: ['cash.open', 'cash.close', 'cash.move'],
  credit: ['settings.manage'],
  promotions: ['inventory.manage', 'settings.manage'],
  payments: ['settings.manage'],
  invoices: ['hacienda.manage'],
  accounting: ['accounting.manage'],
  hr: ['hr.manage'],
  barcodes: ['inventory.manage'],
  printer: ['settings.manage'],
  backups: ['backups.manage'],
  settings: ['settings.manage'],
  admin: ['settings.manage'],
}
