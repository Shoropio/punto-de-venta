import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Archive, BadgeDollarSign, Banknote, Barcode, BarChart3, Boxes, CreditCard, LayoutDashboard, Loader2, LogOut, Maximize2, Minimize2, Moon, Printer, ReceiptText, Search, Settings, ShieldCheck, Sun, Tags, UserCog, UserPlus, Users, WalletCards, MessageCircle, BookOpen, Clock } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Input } from './components/ui/input'
import { ModuleStatusBar, PrintableReceipt, ToastViewport } from './components/shared'
import { PosWorkspace } from './modules/sale'
import { InventoryModule } from './modules/inventory'
import { CustomersModule } from './modules/customers'
import { ReportsModule } from './modules/reports'
import { CashModule } from './modules/cash'
import { CreditModule } from './modules/credit'
import { PromotionsModule } from './modules/promotions'
import { PaymentMethodsModule } from './modules/payments'
import { InvoicesModule } from './modules/invoices'
import { BarcodesModule } from './modules/barcodes'
import { PrinterModule } from './modules/printer'
import { SettingsModule } from './modules/settings'
import { BackupsModule } from './modules/backups'
import { AdminModule } from './modules/admin'
import { DashboardModule } from './modules/dashboard'
import { AccountingModule } from './modules/accounting/AccountingModule'
import { HrModule } from './modules/hr/HrModule'
import { FacturitoChat } from './components/shared/FacturitoChat'
import { api, API_URL } from './lib/api'
import { auth, googleProvider } from './lib/firebase'
import { signInWithPopup } from 'firebase/auth'
import { configureCurrency, currency } from './lib/utils'
import { getToastTone, roundMoney } from './lib/pos-utils'
import { emptyProductForm, mapProduct, type ApiProduct, type ProductForm, type ProductIdentifiers } from './types/product'
import type { Product } from './store/usePosStore'
import { usePosStore } from './store/usePosStore'
import { emptyBranchForm, emptyCashOpeningForm, emptyCustomerForm, emptyHaciendaSetting, type ActivityLogRow, type AdminUserPayload, type AdminUserRow, type AppTheme, type AuthResponse, type BackupListResponse, type BackupRow, type BackupSchedule, type BranchForm, type CashMovement, type CashOpeningForm, type CashRegister, type CashSession, type CashSessionSummary, type CreditPaymentRow, type Customer, type CustomerForm, type DashboardSummary, type HaciendaSettingRow, type InvoiceRow, type ModuleKey, type NamedCatalog, type NavItem, type Paginated, type PaymentMethodRow, type PermissionRow, type PromotionRow, type Refund, type RoleRow, type SaleListItem, type SaleResponse, type SalesSummary, type SettingRow, type StockMovementRow, type ToastMessage, type TopProduct } from './types'

const HELD_SALE_KEY = 'pos_held_sale'
const cashDenominations = [20000, 10000, 5000, 2000, 1000, 500, 100, 50, 25, 10, 5] as const
type ConfirmAction = {
  title: string
  message: string
  tone?: 'danger' | 'primary'
  confirmLabel?: string
  onConfirm: () => void | Promise<void>
}

const nav: NavItem[] = [
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
  { key: 'settings', label: 'Configuración', icon: Settings },
  { key: 'admin', label: 'Admin', icon: UserCog },
]

const modulePermissions: Record<ModuleKey, string[]> = {
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

function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('sale')
  const [query, setQuery] = useState('')
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [user, setUser] = useState<AuthResponse['user'] | null>(null)
  const [authChecking, setAuthChecking] = useState(() => Boolean(localStorage.getItem('pos_token')))
  const [productsSource, setProductsSource] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [sales, setSales] = useState<SaleListItem[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [categories, setCategories] = useState<NamedCatalog[]>([])
  const [brands, setBrands] = useState<NamedCatalog[]>([])
  const [suppliers, setSuppliers] = useState<NamedCatalog[]>([])
  const [branches, setBranches] = useState<NamedCatalog[]>([])
  const [settings, setSettings] = useState<SettingRow[]>([])
  const [haciendaSetting, setHaciendaSetting] = useState<HaciendaSettingRow>(emptyHaciendaSetting)
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([])
  const [stockMovements, setStockMovements] = useState<StockMovementRow[]>([])
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([])
  const [currentCashSession, setCurrentCashSession] = useState<CashSession | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([])
  const [promotions, setPromotions] = useState<PromotionRow[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [backups, setBackups] = useState<BackupRow[]>([])
  const [backupSchedule, setBackupSchedule] = useState<BackupSchedule>({})
  const [creditPayments, setCreditPayments] = useState<CreditPaymentRow[]>([])
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [permissions, setPermissions] = useState<PermissionRow[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLogRow[]>([])
  const [accountingAccounts, setAccountingAccounts] = useState<Array<{ id: number; code: string; name: string; type: string; is_active: boolean }>>([])
  const [accountingEntries, setAccountingEntries] = useState<Array<{ id: number; description: string; entry_date: string; reference?: string }>>([])
  const [entryDetail, setEntryDetail] = useState<{ entry: { id: number; description: string; entry_date: string }; items: Array<{ id: number; account_id: number; debit: number; credit: number; description?: string; code: string; account_name: string; account_type: string }> } | null>(null)
  const [trialBalance, setTrialBalance] = useState<{ rows: Array<{ code: string; name: string; type: string; total_debit: number; total_credit: number; balance: number }>; total_debit: number; total_credit: number; balanced: boolean } | null>(null)
  const [bankAccounts, setBankAccounts] = useState<Array<{ id: number; bank_name: string; account_number?: string; account_type?: string; currency: string; balance: number; is_active: boolean }>>([])
  const [statementLines, setStatementLines] = useState<Array<{ id: number; bank_account_id: number; transaction_date: string; description: string; amount: number; transaction_type: string; reference?: string; is_reconciled: boolean }>>([])
  const [newAccountCode, setNewAccountCode] = useState('')
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState('')
  const [newBankName, setNewBankName] = useState('')
  const [newBankNumber, setNewBankNumber] = useState('')
  const [newBankType, setNewBankType] = useState('')
  const [hrEmployees, setHrEmployees] = useState<Array<{ id: number; name: string; identification?: string; position?: string; department?: string; phone?: string; email?: string; hire_date?: string; pin?: string; is_active: boolean }>>([])
  const [hrAttendances, setHrAttendances] = useState<Array<{ id: number; employee_id: number; employee_name: string; department?: string; work_date: string; clock_in?: string; clock_out?: string; notes?: string }>>([])
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newEmployeeId, setNewEmployeeId] = useState('')
  const [newEmployeePosition, setNewEmployeePosition] = useState('')
  const [newEmployeeDepartment, setNewEmployeeDepartment] = useState('')
  const [newEmployeePin, setNewEmployeePin] = useState('')
  const [attendancePin, setAttendancePin] = useState('')
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; warnings: string[] } | null>(null)
  const [clockResult, setClockResult] = useState<string | null>(null)
  const [whatsappSettings, setWhatsappSettings] = useState<{ driver: 'meta' | 'baileys'; phone_number_id: string; access_token: string; baileys_endpoint: string; is_active: boolean }>({ driver: 'meta', phone_number_id: '', access_token: '', baileys_endpoint: '', is_active: false })
  const [facturitoOpen, setFacturitoOpen] = useState(false)
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [customerForm, setCustomerForm] = useState<CustomerForm>(emptyCustomerForm)
  const [branchForm, setBranchForm] = useState<BranchForm>(emptyBranchForm)
  const [newCategory, setNewCategory] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newSupplier, setNewSupplier] = useState('')
  const [businessName, setBusinessName] = useState('POS Profesional')
  const [currencyCode, setCurrencyCode] = useState('MXN')
  const [defaultTax, setDefaultTax] = useState('16')
  const [cashMovementType, setCashMovementType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [cashMovementAmount, setCashMovementAmount] = useState('')
  const [cashMovementReason, setCashMovementReason] = useState('')
  const [cashOpeningForm, setCashOpeningForm] = useState<CashOpeningForm>(emptyCashOpeningForm)
  const [cashClosingAmount, setCashClosingAmount] = useState('')
  const [cashClosingNotes, setCashClosingNotes] = useState('')
  const [cashBreakdown, setCashBreakdown] = useState<Record<string, string>>({})
  const [cashClosingDialogOpen, setCashClosingDialogOpen] = useState(false)
  const [cashClosingSummary, setCashClosingSummary] = useState<CashSessionSummary | null>(null)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false)
  const [creditCustomerId, setCreditCustomerId] = useState('')
  const [creditPaymentAmount, setCreditPaymentAmount] = useState('')
  const [paymentMethodCode, setPaymentMethodCode] = useState('')
  const [paymentMethodName, setPaymentMethodName] = useState('')
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodRow['type']>('cash')
  const [promotionName, setPromotionName] = useState('')
  const [promotionCode, setPromotionCode] = useState('')
  const [promotionValue, setPromotionValue] = useState('10')
  const [invoiceSaleId, setInvoiceSaleId] = useState('')
  const [invoiceDocumentType, setInvoiceDocumentType] = useState('01')
  const [invoiceTaxId, setInvoiceTaxId] = useState('')
  const [invoiceLegalName, setInvoiceLegalName] = useState('')
  const [invoiceEmail, setInvoiceEmail] = useState('')
  const [barcodeProductId, setBarcodeProductId] = useState('')
  const [barcodeValue, setBarcodeValue] = useState('')
  const [printerName, setPrinterName] = useState('Impresora termica')
  const [receiptWidth, setReceiptWidth] = useState('80')
  const [autoPrint, setAutoPrint] = useState('no')
  const [lastReceipt, setLastReceipt] = useState<SaleResponse['data'] | null>(null)
  const [apiOnline, setApiOnline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Inicia sesion para operar con la API.')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const [paymentCustomerId, setPaymentCustomerId] = useState('')
  const [creditCustomerMode, setCreditCustomerMode] = useState<'existing' | 'new'>('existing')
  const [creditCustomerForm, setCreditCustomerForm] = useState<CustomerForm>(emptyCustomerForm)
  const [invoicePromptSale, setInvoicePromptSale] = useState<SaleResponse['data'] | null>(null)
  const [quickInvoiceTaxId, setQuickInvoiceTaxId] = useState('')
  const [quickInvoiceLegalName, setQuickInvoiceLegalName] = useState('')
  const [quickInvoiceEmail, setQuickInvoiceEmail] = useState('')
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false)
  const [customDiscountValue, setCustomDiscountValue] = useState('5')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [theme, setTheme] = useState<AppTheme>(() => (localStorage.getItem('pos_theme') === 'light' ? 'light' : 'dark'))
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const searchInputRef = useRef<HTMLInputElement>(null)
  const lastToastMessageRef = useRef(message)
  const userRef = useRef<AuthResponse['user'] | null>(null)
  const {
    cart,
    addItem,
    setCart,
    updateQuantity,
    applyDiscountPercent,
    removeItem,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    cashSessionOpen,
    cashSessionId,
    setCashSession,
  } = usePosStore()

  const askConfirmation = (action: ConfirmAction) => setConfirmAction(action)

  const userPermissions = useMemo(() => user?.role?.permissions?.map((permission) => permission.name) ?? [], [user])
  const hasPermission = useCallback((permission: string) => {
    if (userPermissions.includes('settings.manage')) return true
    if (userPermissions.includes(permission)) return true
    const fallback = `${permission.split('.')[0]}.manage`
    return userPermissions.includes(fallback)
  }, [userPermissions])
  const canAccessModule = useCallback((module: ModuleKey) => {
    const required = modulePermissions[module] ?? []
    return required.length === 0 || required.some(hasPermission)
  }, [hasPermission])
  const allowedNav = useMemo(() => nav.filter((item) => canAccessModule(item.key)), [canAccessModule])

  const runConfirmedAction = async () => {
    if (!confirmAction) return
    const action = confirmAction
    setConfirmAction(null)
    await action.onConfirm()
  }

  const loadSession = useCallback(async () => {
    const session = await api<CashSession | null>('/cash-sessions/current')
    setCurrentCashSession(session)
    setCashSession(Boolean(session), session?.id ?? null)
    if (session) setCashClosingAmount('')
    return session
  }, [setCashSession])

  const loadProducts = useCallback(async () => {
    const response = await api<Paginated<ApiProduct>>('/products?per_page=100')
    setProductsSource(response.data.map(mapProduct))
    setApiOnline(true)
  }, [])

  const loadCustomers = useCallback(async () => {
    const response = await api<Paginated<Customer>>('/customers?per_page=100')
    setCustomers(response.data)
  }, [])

  const loadReports = useCallback(async () => {
    const [summary, top, salesResponse, refundsResponse] = await Promise.all([
      api<SalesSummary>('/reports/sales-summary'),
      api<TopProduct[]>('/reports/top-products?limit=8'),
      api<Paginated<SaleListItem>>('/sales?per_page=12'),
      api<Paginated<Refund>>('/refunds?per_page=12'),
    ])
    setSalesSummary(summary)
    setTopProducts(top)
    setSales(salesResponse.data)
    setRefunds(refundsResponse.data)
  }, [])

  const loadSettings = useCallback(async () => {
    const [settingsResponse, haciendaResponse, categoriesResponse, brandsResponse, suppliersResponse, branchesResponse] = await Promise.all([
      api<SettingRow[]>('/settings'),
      api<HaciendaSettingRow[]>('/hacienda-settings'),
      api<Paginated<NamedCatalog>>('/categories?per_page=100'),
      api<Paginated<NamedCatalog>>('/brands?per_page=100'),
      api<Paginated<NamedCatalog>>('/suppliers?per_page=100'),
      api<Paginated<NamedCatalog>>('/branches?per_page=100'),
    ])
    setSettings(settingsResponse)
    const activeHacienda = haciendaResponse[0]
    if (activeHacienda) setHaciendaSetting({ ...emptyHaciendaSetting, ...activeHacienda, certificate_pin: '', api_password: '' })
    setCategories(categoriesResponse.data)
    setBrands(brandsResponse.data)
    setSuppliers(suppliersResponse.data)
    setBranches(branchesResponse.data)

    const business = settingsResponse.find((setting) => setting.key === 'business_name')?.value
    const currencySetting = settingsResponse.find((setting) => setting.key === 'currency')?.value
    const taxSetting = settingsResponse.find((setting) => setting.key === 'default_tax')?.value
    const printerSetting = settingsResponse.find((setting) => setting.key === 'printer_name')?.value
    const widthSetting = settingsResponse.find((setting) => setting.key === 'receipt_width')?.value
    const autoPrintSetting = settingsResponse.find((setting) => setting.key === 'auto_print')?.value
    if (typeof business === 'string') setBusinessName(business)
    if (typeof currencySetting === 'string') setCurrencyCode(currencySetting)
    if (typeof taxSetting === 'string' || typeof taxSetting === 'number') setDefaultTax(String(taxSetting))
    if (typeof printerSetting === 'string') setPrinterName(printerSetting)
    if (typeof widthSetting === 'string' || typeof widthSetting === 'number') setReceiptWidth(String(widthSetting))
    if (typeof autoPrintSetting === 'string') setAutoPrint(autoPrintSetting)
  }, [])

  const loadOperations = useCallback(async () => {
    const [cashResponse, stockResponse, registerResponse, methodResponse, promotionResponse, invoiceResponse, creditResponse, backupResponse] = await Promise.all([
      api<Paginated<CashMovement>>('/cash-movements?per_page=20'),
      api<Paginated<StockMovementRow>>('/stock-movements?per_page=20'),
      api<CashRegister[]>('/cash-registers'),
      api<PaymentMethodRow[]>('/payment-methods'),
      api<Paginated<PromotionRow>>('/promotions?per_page=20'),
      api<Paginated<InvoiceRow>>('/invoices?per_page=20'),
      api<Paginated<CreditPaymentRow>>('/credit-payments?per_page=20'),
      api<BackupListResponse>('/backups'),
    ])
    setCashMovements(cashResponse.data)
    setStockMovements(stockResponse.data)
    setCashRegisters(registerResponse)
    setCashOpeningForm((current) => ({
      ...current,
      cash_register_id: current.cash_register_id || (registerResponse[0]?.id ? String(registerResponse[0].id) : ''),
    }))
    setPaymentMethods(methodResponse)
    setPromotions(promotionResponse.data)
    setInvoices(invoiceResponse.data)
    setBackups(backupResponse.data)
    setBackupSchedule(backupResponse.schedule ?? {})
    setCreditPayments(creditResponse.data)
  }, [])

  const loadAdmin = useCallback(async () => {
    const [dashboardResponse, rolesResponse, permissionsResponse, usersResponse, logsResponse] = await Promise.all([
      api<DashboardSummary>('/dashboard'),
      api<RoleRow[]>('/admin/roles'),
      api<PermissionRow[]>('/admin/permissions'),
      api<AdminUserRow[]>('/admin/users'),
      api<Paginated<ActivityLogRow>>('/activity-logs?per_page=30'),
    ])
    setDashboard(dashboardResponse)
    setRoles(rolesResponse)
    setPermissions(permissionsResponse)
    setAdminUsers(usersResponse)
    setActivityLogs(logsResponse.data)
  }, [])

  const loadAccounting = useCallback(async () => {
    const [accountsResponse, entriesResponse, trialBalanceResponse, bankResponse, linesResponse] = await Promise.all([
      api<Array<{ id: number; code: string; name: string; type: string; is_active: boolean }>>('/accounting/accounts'),
      api<{ data: Array<{ id: number; description: string; entry_date: string; reference?: string }> }>('/accounting/entries?per_page=50'),
      api<{ rows: Array<{ code: string; name: string; type: string; total_debit: number; total_credit: number; balance: number }>; total_debit: number; total_credit: number; balanced: boolean }>('/accounting/trial-balance'),
      api<Array<{ id: number; bank_name: string; account_number?: string; account_type?: string; currency: string; balance: number; is_active: boolean }>>('/accounting/bank-accounts'),
      api<{ data: Array<{ id: number; bank_account_id: number; transaction_date: string; description: string; amount: number; transaction_type: string; reference?: string; is_reconciled: boolean }> }>('/accounting/statement-lines?per_page=50'),
    ])
    setAccountingAccounts(accountsResponse)
    setAccountingEntries(entriesResponse.data)
    setTrialBalance(trialBalanceResponse)
    setBankAccounts(bankResponse)
    setStatementLines(linesResponse.data)
  }, [])

  const loadHr = useCallback(async () => {
    const [employeesResponse, attendancesResponse] = await Promise.all([
      api<Array<{ id: number; name: string; identification?: string; position?: string; department?: string; phone?: string; email?: string; hire_date?: string; pin?: string; is_active: boolean }>>('/hr/employees'),
      api<{ data: Array<{ id: number; employee_id: number; employee_name: string; department?: string; work_date: string; clock_in?: string; clock_out?: string; notes?: string }> }>('/hr/attendances?per_page=50'),
    ])
    setHrEmployees(employeesResponse)
    setHrAttendances(attendancesResponse.data)
  }, [])

  const loadWhatsappSettings = useCallback(async () => {
    const response = await api<{ driver: string; phone_number_id: string; access_token: string; baileys_endpoint: string; is_active: boolean } | null>('/whatsapp/settings')
    if (response) setWhatsappSettings(response)
  }, [])

  const refreshAll = useCallback(async (profile?: AuthResponse['user'] | null) => {
    const effectiveProfile = profile ?? userRef.current
    const permissionNames = effectiveProfile?.role?.permissions?.map((permission) => permission.name) ?? []
    const canLoad = (permission: string) => {
      if (permissionNames.includes('settings.manage')) return true
      if (permissionNames.includes(permission)) return true
      return permissionNames.includes(`${permission.split('.')[0]}.manage`)
    }

    const [, session] = await Promise.all([loadProducts(), loadSession()])
    void loadCustomers().catch(() => undefined)
    if (canLoad('reports.view')) {
      void loadReports().catch(() => undefined)
    }
    if (canLoad('reports.view') || canLoad('settings.manage')) {
      void loadAdmin().catch(() => undefined)
    }
    if (canLoad('settings.manage')) {
      void loadSettings().catch(() => undefined)
    } else {
      void api<Paginated<NamedCatalog>>('/branches?per_page=100').then((response) => setBranches(response.data)).catch(() => undefined)
    }
    void loadOperations().catch(() => undefined)
    if (canLoad('accounting.manage')) {
      void loadAccounting().catch(() => undefined)
    }
    if (canLoad('hr.manage')) {
      void loadHr().catch(() => undefined)
    }
    if (canLoad('settings.manage')) {
      void loadWhatsappSettings().catch(() => undefined)
    }
    setApiOnline(true)
    setMessage(session ? 'API conectada. Caja abierta y lista para vender.' : 'API conectada. Abre caja para comenzar.')
  }, [loadAccounting, loadAdmin, loadCustomers, loadHr, loadOperations, loadProducts, loadReports, loadSession, loadSettings, loadWhatsappSettings])

  useEffect(() => {
    localStorage.setItem('pos_theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#202020' : '#f5f5f4')
  }, [theme])

  useEffect(() => {
    configureCurrency(currencyCode)
  }, [currencyCode])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    if (user && !canAccessModule(activeModule)) {
      setActiveModule(canAccessModule('sale') ? 'sale' : allowedNav[0]?.key ?? 'sale')
      setMessage('Modulo no disponible para tu rol.')
    }
  }, [activeModule, allowedNav, canAccessModule, user])

  useEffect(() => {
    document.documentElement.style.setProperty('--receipt-width', receiptWidth === '58' ? '58mm' : '80mm')
  }, [receiptWidth])

  useEffect(() => {
    if (!message || message === lastToastMessageRef.current) return

    lastToastMessageRef.current = message
    const id = Date.now()
    setToasts((current) => [...current.slice(-3), { id, text: message, tone: getToastTone(message) }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4200)
  }, [message])

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }

  const playBlockedSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const audio = new AudioContextClass()
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(180, audio.currentTime)
      gain.gain.setValueAtTime(0.08, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start()
      oscillator.stop(audio.currentTime + 0.16)
      window.setTimeout(() => void audio.close(), 220)
    } catch {
      // Some browsers block audio contexts until the first user gesture.
    }
  }, [])

  const handleBlockedAction = useCallback((value = 'Accion no disponible en este momento.') => {
    playBlockedSound()
    setMessage(value)
  }, [playBlockedSound])

  const addProductToCart = useCallback((product: Product) => {
    if (product.stock <= 0) {
      handleBlockedAction(`${product.name} no tiene stock disponible.`)
      return
    }

    const currentQuantity = cart.find((item) => item.id === product.id)?.quantity ?? 0
    if (currentQuantity >= product.stock) {
      handleBlockedAction(`No hay mas stock disponible para ${product.name}.`)
      return
    }

    addItem(product)
    setMessage(`${product.name} agregado.`)
  }, [addItem, cart, handleBlockedAction])

  const updateCartQuantity = useCallback((productId: number, quantity: number) => {
    const item = cart.find((current) => current.id === productId)
    if (!item) return

    if (quantity > item.stock) {
      handleBlockedAction(`Stock disponible para ${item.name}: ${item.stock}.`)
      return
    }

    updateQuantity(productId, quantity)
  }, [cart, handleBlockedAction, updateQuantity])

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('pos_token')
    if (!token) {
      setAuthChecking(false)
      return
    }

    api<AuthResponse['user']>('/user')
      .then((profile) => {
        userRef.current = profile
        setUser(profile)
        return refreshAll(profile)
      })
      .catch(() => {
        localStorage.removeItem('pos_token')
        userRef.current = null
        setUser(null)
        setApiOnline(false)
        setMessage('Sesion expirada. Inicia sesion nuevamente.')
      })
      .finally(() => setAuthChecking(false))
  }, [refreshAll])

  const login = async () => {
    setLoading(true)
    setMessage('Validando credenciales...')
    try {
      const response = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, device_name: 'web-pos' }),
      })
      localStorage.setItem('pos_token', response.token)
      userRef.current = response.user
      setUser(response.user)
      await refreshAll(response.user)
    } catch (error) {
      userRef.current = null
      setUser(null)
      setApiOnline(false)
      setMessage(error instanceof Error ? error.message : 'No fue posible iniciar sesion.')
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setLoading(true)
    setMessage('Autenticando con Google...')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      const response = await api<AuthResponse>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential: idToken, device_name: 'web-pos' }),
      })
      localStorage.setItem('pos_token', response.token)
      userRef.current = response.user
      setUser(response.user)
      await refreshAll(response.user)
    } catch (error: unknown) {
      userRef.current = null
      setUser(null)
      setApiOnline(false)
      const msg = error instanceof Error ? error.message : 'No fue posible iniciar sesion con Google.'
      setMessage(msg.includes('popup-closed-by-user') ? 'Se cancelo el inicio de sesion.' : msg)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      // Cleanup local session even if the server token is already gone.
    }
    localStorage.removeItem('pos_token')
    userRef.current = null
    setUser(null)
    setApiOnline(false)
    setCurrentCashSession(null)
    setCashSession(false)
    clearCart()
    setMessage('Sesion cerrada.')
  }

  const openCashSession = async () => {
    if (!hasPermission('cash.open')) {
      handleBlockedAction('No tienes permisos para abrir caja.')
      return
    }

    if (!cashOpeningForm.cash_register_id || !cashOpeningForm.opening_amount || !cashOpeningForm.shift || !cashOpeningForm.supervisor_name.trim()) {
      setActiveModule('cash')
      setMessage('Selecciona caja, turno, fondo inicial y supervisor para abrir caja.')
      return
    }

    setLoading(true)
    try {
      const session = await api<CashSession>('/cash-sessions/open', {
        method: 'POST',
        body: JSON.stringify({
          cash_register_id: Number(cashOpeningForm.cash_register_id),
          opening_amount: Number(cashOpeningForm.opening_amount),
          shift: cashOpeningForm.shift,
          supervisor_name: cashOpeningForm.supervisor_name,
          notes: 'Supervisor confirma monto presencialmente.',
        }),
      })
      setCurrentCashSession(session)
      setCashSession(true, session.id)
      setCashClosingAmount(String(session.expected_amount ?? cashOpeningForm.opening_amount))
      setMessage('Caja abierta correctamente. Listo para iniciar ventas.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible abrir caja.')
    } finally {
      setLoading(false)
    }
  }

  const openCashClosingDialog = async () => {
    if (!hasPermission('cash.close')) {
      handleBlockedAction('No tienes permisos para cerrar caja.')
      return
    }

    if (!cashSessionId) {
      handleBlockedAction('No hay caja abierta para cerrar.')
      return
    }

    setLoading(true)
    try {
      const summary = await api<CashSessionSummary>(`/cash-sessions/${cashSessionId}/summary`)
      setCashClosingSummary(summary)
      setCashClosingAmount('')
      setCashClosingNotes('')
      setCashBreakdown({})
      setCashClosingDialogOpen(true)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible preparar el cierre de caja.')
    } finally {
      setLoading(false)
    }
  }

  const cancelCashClosingDialog = () => {
    if (loading) return
    setCashClosingDialogOpen(false)
    setCashClosingSummary(null)
    setCashClosingNotes('')
    setCashBreakdown({})
  }

  const closeCashSession = async () => {
    if (!cashSessionId) return
    const counted = Number(cashClosingAmount)
    const expected = Number(cashClosingSummary?.expected_amount ?? currentCashSession?.expected_amount ?? 0)
    const difference = roundMoney((Number.isFinite(counted) ? counted : 0) - expected)
    if (!cashClosingAmount || Number.isNaN(counted)) {
      handleBlockedAction('Ingresa el efectivo contado para cerrar caja.')
      return
    }
    if (difference !== 0 && !cashClosingNotes.trim()) {
      handleBlockedAction('Agrega una observacion para justificar el faltante o sobrante.')
      return
    }
    if (pendingFiscalCount > 0) {
      handleBlockedAction(`Hay ${pendingFiscalCount} documento(s) Hacienda pendientes. Resuelve o consulta estado antes de cerrar caja.`)
      return
    }

    setLoading(true)
    try {
      await api(`/cash-sessions/${cashSessionId}/close`, {
        method: 'POST',
        body: JSON.stringify({
          closing_amount: counted,
          notes: cashClosingNotes || 'Cierre desde POS web',
        }),
      })
      setCurrentCashSession(null)
      setCashSession(false)
      setCashClosingAmount('')
      setCashClosingNotes('')
      setCashBreakdown({})
      setCashClosingDialogOpen(false)
      setCashClosingSummary(null)
      setMessage('Caja cerrada correctamente.')
      await loadReports()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible cerrar caja.')
    } finally {
      setLoading(false)
    }
  }

  const openPaymentDialog = () => {
    if (!apiOnline || !cashSessionId) {
      handleBlockedAction('Falta API o caja abierta para cobrar.')
      return
    }

    if (cart.length === 0) {
      handleBlockedAction('Agrega productos antes de cobrar.')
      return
    }

    setCashReceived(paymentMethod === 'cash' || paymentMethod === 'mixed' ? '' : total.toFixed(2))
    setPaymentCustomerId(selectedCustomerId)
    setCreditCustomerMode('existing')
    setCreditCustomerForm(emptyCustomerForm)
    setPaymentDialogOpen(true)
  }

  const closePaymentDialog = () => {
    if (loading) return
    setPaymentDialogOpen(false)
    setCashReceived('')
    setPaymentCustomerId('')
    setCreditCustomerForm(emptyCustomerForm)
  }

  const createCreditCustomerFromPayment = async () => {
    if (!creditCustomerForm.name.trim()) {
      throw new Error('Captura el nombre del cliente para vender a credito.')
    }

    const customer = await api<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        ...creditCustomerForm,
        email: creditCustomerForm.email || null,
        phone: creditCustomerForm.phone || null,
        address: creditCustomerForm.address || null,
        credit_limit: creditCustomerForm.credit_limit || 0,
        identification_number: creditCustomerForm.identification_number || null,
      }),
    })
    await loadCustomers()
    setSelectedCustomerId(String(customer.id))
    return customer
  }

  const chargeSale = async (paidAmount = total, customerIdOverride?: number | null) => {
    if (!apiOnline || !cashSessionId) {
      setMessage('Falta API o caja abierta para cobrar.')
      return
    }

    setLoading(true)
    try {
      const method = paymentMethod === 'mixed' ? 'cash' : paymentMethod
      const paymentAmount = roundMoney(paidAmount)
      const sale = await api<SaleResponse>('/sales', {
        method: 'POST',
        body: JSON.stringify({
          cash_session_id: cashSessionId,
          customer_id: customerIdOverride ?? (selectedCustomer ? selectedCustomer.id : null),
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.salePrice,
            discount_amount: item.discount,
          })),
          payments: [{ method, amount: paymentAmount }],
        }),
      })
      setLastReceipt(sale.data)
      setInvoicePromptSale(sale.data)
      const invoiceCustomer = sale.data.customer ?? selectedCustomer
      if (invoiceCustomer?.name) {
        setQuickInvoiceTaxId(invoiceCustomer.identification_number ?? '')
        setQuickInvoiceLegalName(invoiceCustomer.name)
        setQuickInvoiceEmail(invoiceCustomer.email ?? '')
      }
      clearCart()
      setSelectedCustomerId('')
      await Promise.all([loadProducts(), loadSession(), loadReports()])
      setMessage(`Venta ${sale.data.folio} cobrada correctamente.`)
      setPaymentDialogOpen(false)
      setCashReceived('')
      setPaymentCustomerId('')
      setCreditCustomerForm(emptyCustomerForm)
      window.setTimeout(() => window.print(), 100)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible cobrar la venta.')
    } finally {
      setLoading(false)
    }
  }

  const confirmPayment = () => {
    void confirmPaymentAsync()
  }

  const confirmPaymentAsync = async () => {
    const requiresCashAmount = paymentMethod === 'cash' || paymentMethod === 'mixed'
    const isCreditSale = paymentMethod === 'credit'
    const paidAmount = requiresCashAmount ? Number(cashReceived) : total

    if (requiresCashAmount && (!cashReceived || Number.isNaN(paidAmount))) {
      handleBlockedAction('Ingresa el monto recibido en efectivo.')
      return
    }

    if (paidAmount < total) {
      handleBlockedAction('El efectivo recibido no cubre el total.')
      return
    }

    try {
      let customerId = selectedCustomer?.id ?? null

      if (isCreditSale) {
        if (creditCustomerMode === 'new') {
          const customer = await createCreditCustomerFromPayment()
          customerId = customer.id
        } else {
          customerId = Number(paymentCustomerId || selectedCustomerId)
        }

        if (!customerId || Number.isNaN(customerId)) {
          handleBlockedAction('Selecciona o crea un cliente para vender a credito.')
          return
        }

        setSelectedCustomerId(String(customerId))
      }

      await chargeSale(paidAmount, customerId)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible preparar la venta a credito.')
    }
  }

  const saveProduct = async () => {
    if (!productForm.name.trim()) {
      setMessage('El nombre del producto es obligatorio.')
      return
    }

    setLoading(true)
    try {
      const numberOrZero = (value: string) => value === '' ? 0 : Number(value)
      const body = JSON.stringify({
        sku: productForm.sku || null,
        barcode: productForm.barcode || null,
        category_id: productForm.category_id ? Number(productForm.category_id) : null,
        brand_id: productForm.brand_id ? Number(productForm.brand_id) : null,
        supplier_id: productForm.supplier_id ? Number(productForm.supplier_id) : null,
        name: productForm.name,
        cost_price: numberOrZero(productForm.cost_price),
        sale_price: numberOrZero(productForm.sale_price),
        tax_rate: numberOrZero(productForm.tax_rate),
        stock: numberOrZero(productForm.stock),
        min_stock: numberOrZero(productForm.min_stock),
        unit: productForm.unit || 'piece',
        track_stock: true,
        is_active: true,
      })

      if (productForm.id) {
        await api(`/products/${productForm.id}`, { method: 'PUT', body })
        setMessage('Producto actualizado correctamente.')
      } else {
        await api('/products', { method: 'POST', body })
        setMessage('Producto creado correctamente.')
      }

      setProductForm(emptyProductForm)
      await loadProducts()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar el producto.')
    } finally {
      setLoading(false)
    }
  }

  const editProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      sku: product.sku,
      barcode: product.barcode ?? '',
      category_id: product.categoryId ? String(product.categoryId) : '',
      brand_id: product.brandId ? String(product.brandId) : '',
      supplier_id: product.supplierId ? String(product.supplierId) : '',
      name: product.name,
      cost_price: String(product.costPrice),
      sale_price: String(product.salePrice),
      tax_rate: String(product.taxRate),
      stock: String(product.stock),
      min_stock: String(product.minStock),
      unit: product.unit ?? 'piece',
    })
    setMessage(`Editando ${product.name}.`)
  }

  const deleteProduct = async (product: Product) => {
    askConfirmation({
      title: 'Eliminar producto',
      message: `Se desactivara ${product.name} del inventario. Esta accion quedara auditada.`,
      tone: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        setLoading(true)
        try {
          await api(`/products/${product.id}`, { method: 'DELETE' })
          if (productForm.id === product.id) setProductForm(emptyProductForm)
          await loadProducts()
          setMessage(`${product.name} eliminado del inventario.`)
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'No fue posible eliminar el producto.')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const regenerateProductIdentifiers = async () => {
    try {
      const identifiers = await api<ProductIdentifiers>('/products/identifiers')
      setProductForm((current) => ({ ...current, ...identifiers }))
      setMessage('SKU y codigo regenerados.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible generar identificadores.')
    }
  }

  const adjustStock = async (product: Product, type: 'in' | 'out') => {
    setLoading(true)
    try {
      await api('/stock-movements', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, type, quantity: 1, notes: 'Ajuste rapido desde inventario' }),
      })
      await loadProducts()
      setMessage(type === 'in' ? 'Entrada de inventario registrada.' : 'Salida de inventario registrada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible ajustar inventario.')
    } finally {
      setLoading(false)
    }
  }

  const saveCustomer = async () => {
    if (!customerForm.name.trim()) {
      setMessage('Captura el nombre del cliente.')
      return
    }

    setLoading(true)
    try {
      const body = JSON.stringify({
        ...customerForm,
        email: customerForm.email || null,
        phone: customerForm.phone || null,
        address: customerForm.address || null,
        credit_limit: customerForm.credit_limit || 0,
        identification_number: customerForm.identification_number || null,
      })

      if (customerForm.id) {
        await api(`/customers/${customerForm.id}`, { method: 'PUT', body })
        setMessage('Cliente actualizado correctamente.')
      } else {
        await api('/customers', { method: 'POST', body })
        setMessage('Cliente creado correctamente.')
      }

      setCustomerForm(emptyCustomerForm)
      await loadCustomers()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar el cliente.')
    } finally {
      setLoading(false)
    }
  }

  const editCustomer = (customer: Customer) => {
    setCustomerForm({
      id: customer.id,
      name: customer.name,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
      credit_limit: String(customer.credit_limit ?? '0'),
      identification_type: customer.identification_type ?? '01',
      identification_number: customer.identification_number ?? '',
    })
    setMessage(`Editando ${customer.name}.`)
  }

  const deleteCustomer = async (customer: Customer) => {
    askConfirmation({
      title: 'Eliminar cliente',
      message: `Se desactivara ${customer.name}. Sus ventas historicas se conservaran.`,
      tone: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        setLoading(true)
        try {
          await api(`/customers/${customer.id}`, { method: 'DELETE' })
          if (customerForm.id === customer.id) setCustomerForm(emptyCustomerForm)
          if (selectedCustomerId === String(customer.id)) setSelectedCustomerId('')
          await loadCustomers()
          setMessage(`${customer.name} eliminado.`)
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'No fue posible eliminar el cliente.')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const refundSale = async (sale: SaleListItem) => {
    askConfirmation({
      title: 'Confirmar devolucion',
      message: `Se devolvera la venta ${sale.folio} por ${currency.format(Number(sale.total))} y se ajustara inventario/caja.`,
      tone: 'danger',
      confirmLabel: 'Devolver',
      onConfirm: async () => {
        setLoading(true)
        try {
          await api('/refunds', {
            method: 'POST',
            body: JSON.stringify({ sale_id: sale.id, reason: 'Devolucion desde POS web' }),
          })
          await Promise.all([loadProducts(), loadReports(), loadSession()])
          setMessage(`Venta ${sale.folio} devuelta correctamente.`)
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'No fue posible devolver la venta.')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const reprintSale = async (sale: SaleListItem) => {
    setLoading(true)
    try {
      const response = await api<SaleResponse>(`/sales/${sale.id}`)
      setLastReceipt(response.data)
      setMessage(`Copia de ${sale.folio} lista para imprimir.`)
      window.setTimeout(() => window.print(), 100)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible reimprimir la venta.')
    } finally {
      setLoading(false)
    }
  }

  const createCatalogItem = async (kind: 'category' | 'brand' | 'supplier') => {
    const value = kind === 'category' ? newCategory : kind === 'brand' ? newBrand : newSupplier
    if (!value.trim()) {
      setMessage('Captura un nombre para el catalogo.')
      return
    }

    setLoading(true)
    try {
      const endpoint = kind === 'category' ? '/categories' : kind === 'brand' ? '/brands' : '/suppliers'
      await api(endpoint, { method: 'POST', body: JSON.stringify({ name: value }) })
      setNewCategory(kind === 'category' ? '' : newCategory)
      setNewBrand(kind === 'brand' ? '' : newBrand)
      setNewSupplier(kind === 'supplier' ? '' : newSupplier)
      await loadSettings()
      setMessage('Catalogo actualizado correctamente.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible actualizar el catalogo.')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      await Promise.all([
        api('/settings', { method: 'POST', body: JSON.stringify({ key: 'business_name', value: businessName, group: 'business' }) }),
        api('/settings', { method: 'POST', body: JSON.stringify({ key: 'currency', value: currencyCode, group: 'business' }) }),
        api('/settings', { method: 'POST', body: JSON.stringify({ key: 'default_tax', value: defaultTax, group: 'taxes' }) }),
        api('/settings', { method: 'POST', body: JSON.stringify({ key: 'printer_name', value: printerName, group: 'printer' }) }),
        api('/settings', { method: 'POST', body: JSON.stringify({ key: 'receipt_width', value: receiptWidth, group: 'printer' }) }),
        api('/settings', { method: 'POST', body: JSON.stringify({ key: 'auto_print', value: autoPrint, group: 'printer' }) }),
      ])
      await loadSettings()
      setMessage('Configuración guardada correctamente.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar la configuración.')
    } finally {
      setLoading(false)
    }
  }

  const saveBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.code.trim()) {
      setMessage('Captura nombre y codigo de la sucursal.')
      return
    }

    setLoading(true)
    try {
      const body = JSON.stringify({
        name: branchForm.name,
        code: branchForm.code,
        phone: branchForm.phone || null,
        email: branchForm.email || null,
        address: branchForm.address || null,
        is_active: true,
      })
      if (branchForm.id) {
        await api(`/branches/${branchForm.id}`, { method: 'PUT', body })
        setMessage('Sucursal actualizada correctamente.')
      } else {
        await api('/branches', { method: 'POST', body })
        setMessage('Sucursal creada correctamente.')
      }
      setBranchForm(emptyBranchForm)
      await loadSettings()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar la sucursal.')
    } finally {
      setLoading(false)
    }
  }

  const editBranch = (branch: NamedCatalog) => {
    setBranchForm({
      id: branch.id,
      name: branch.name,
      code: branch.code ?? '',
      phone: branch.phone ?? '',
      email: branch.email ?? '',
      address: branch.address ?? '',
    })
    setMessage(`Editando sucursal ${branch.name}.`)
  }

  const deleteBranch = async (branch: NamedCatalog) => {
    askConfirmation({
      title: 'Eliminar sucursal',
      message: `Se desactivara la sucursal ${branch.name}.`,
      tone: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        setLoading(true)
        try {
          await api(`/branches/${branch.id}`, { method: 'DELETE' })
          if (branchForm.id === branch.id) setBranchForm(emptyBranchForm)
          await loadSettings()
          setMessage(`Sucursal ${branch.name} eliminada.`)
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'No fue posible eliminar la sucursal.')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const createCashMovement = async () => {
    if (!cashSessionId || !cashMovementAmount || !cashMovementReason.trim()) {
      setMessage('Captura caja abierta, monto y motivo.')
      return
    }
    setLoading(true)
    try {
      await api('/cash-movements', {
        method: 'POST',
        body: JSON.stringify({ cash_session_id: cashSessionId, type: cashMovementType, amount: cashMovementAmount, reason: cashMovementReason }),
      })
      setCashMovementAmount('')
      setCashMovementReason('')
      await Promise.all([loadOperations(), loadSession()])
      setMessage(cashMovementType === 'deposit' ? 'Deposito registrado.' : 'Retiro registrado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible registrar movimiento de caja.')
    } finally {
      setLoading(false)
    }
  }

  const createCreditPayment = async () => {
    if (!creditCustomerId || !creditPaymentAmount) {
      setMessage('Selecciona cliente y monto para abonar credito.')
      return
    }
    setLoading(true)
    try {
      await api('/credit-payments', {
        method: 'POST',
        body: JSON.stringify({ customer_id: Number(creditCustomerId), cash_session_id: cashSessionId, method: 'cash', amount: creditPaymentAmount }),
      })
      setCreditPaymentAmount('')
      await Promise.all([loadCustomers(), loadOperations(), loadSession()])
      setMessage('Abono a credito registrado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible registrar el abono.')
    } finally {
      setLoading(false)
    }
  }

  const createPaymentMethod = async () => {
    if (!paymentMethodCode.trim() || !paymentMethodName.trim()) {
      setMessage('Captura codigo y nombre de la forma de pago.')
      return
    }
    setLoading(true)
    try {
      await api('/payment-methods', {
        method: 'POST',
        body: JSON.stringify({ code: paymentMethodCode, name: paymentMethodName, type: paymentMethodType, affects_cash_drawer: paymentMethodType === 'cash' }),
      })
      setPaymentMethodCode('')
      setPaymentMethodName('')
      await loadOperations()
      setMessage('Forma de pago guardada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar forma de pago.')
    } finally {
      setLoading(false)
    }
  }

  const createSinpePaymentMethod = async () => {
    setLoading(true)
    try {
      await api('/payment-methods', {
        method: 'POST',
        body: JSON.stringify({
          code: 'sinpe',
          name: 'SINPE',
          type: 'transfer',
          requires_reference: true,
          affects_cash_drawer: false,
          is_active: true,
        }),
      })
      await loadOperations()
      setMessage('SINPE agregado como forma de pago.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible agregar SINPE.')
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    setLoading(true)
    try {
      await api<BackupRow>('/backups', { method: 'POST' })
      await loadOperations()
      setMessage('Respaldo creado correctamente.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible crear el respaldo.')
    } finally {
      setLoading(false)
    }
  }

  const downloadBackup = async (backup: BackupRow) => {
    try {
      const token = localStorage.getItem('pos_token')
      const response = await fetch(`${API_URL}/backups/${backup.name}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('No fue posible descargar el respaldo.')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = backup.name
      link.click()
      URL.revokeObjectURL(url)
      setMessage('Descarga de respaldo iniciada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible descargar el respaldo.')
    }
  }

  const deleteBackup = async (backup: BackupRow) => {
    askConfirmation({
      title: 'Eliminar respaldo',
      message: `Se eliminara el archivo ${backup.name}.`,
      tone: 'danger',
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        setLoading(true)
        try {
          await api(`/backups/${backup.name}`, { method: 'DELETE' })
          await loadOperations()
          setMessage('Respaldo eliminado correctamente.')
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'No fue posible eliminar el respaldo.')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const verifyBackup = async (backup: BackupRow) => {
    setLoading(true)
    try {
      const result = await api<{ ok: boolean; manifest?: { created_at?: string } | null }>(`/backups/${backup.name}/verify`, { method: 'POST' })
      setMessage(result.ok ? `Respaldo verificado: ${backup.name}.` : `El respaldo ${backup.name} requiere revision.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible verificar el respaldo.')
    } finally {
      setLoading(false)
    }
  }

  const restoreBackup = async (backup: BackupRow) => {
    askConfirmation({
      title: 'Restaurar respaldo',
      message: `Se reemplazaran los datos actuales con el contenido de ${backup.name}. Crea un respaldo nuevo antes si necesitas conservar el estado actual.`,
      tone: 'danger',
      confirmLabel: 'Restaurar',
      onConfirm: async () => {
        setLoading(true)
        try {
          await api(`/backups/${backup.name}/restore`, { method: 'POST' })
          await loadOperations()
          setMessage('Respaldo restaurado correctamente.')
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'No fue posible restaurar el respaldo.')
        } finally {
          setLoading(false)
        }
      },
    })
  }

  const saveBackupSchedule = async (schedule: { enabled: boolean; frequency: 'daily' | 'weekly'; time: string; retention: number }) => {
    setLoading(true)
    try {
      await api('/backups/schedule', { method: 'POST', body: JSON.stringify(schedule) })
      await loadOperations()
      setMessage('Programacion de respaldos guardada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible programar respaldos.')
    } finally {
      setLoading(false)
    }
  }

  const createPromotion = async () => {
    if (!promotionName.trim() || !promotionCode.trim() || !promotionValue) {
      setMessage('Captura nombre, codigo y descuento de la promocion.')
      return
    }
    setLoading(true)
    try {
      await api('/promotions', {
        method: 'POST',
        body: JSON.stringify({ name: promotionName, code: promotionCode, discount_type: 'percent', discount_value: promotionValue, min_sale_amount: 0, is_active: true }),
      })
      setPromotionName('')
      setPromotionCode('')
      await loadOperations()
      setMessage('Promocion guardada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar promocion.')
    } finally {
      setLoading(false)
    }
  }

  const createInvoice = async () => {
    if (!invoiceSaleId || !invoiceTaxId.trim() || !invoiceLegalName.trim()) {
      setMessage('Selecciona venta y datos fiscales.')
      return
    }
    setLoading(true)
    try {
      await api('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          sale_id: Number(invoiceSaleId),
          document_type: invoiceDocumentType,
          tax_id: invoiceTaxId,
          legal_name: invoiceLegalName,
          email: invoiceEmail || null,
          metadata: ['02', '03', '10'].includes(invoiceDocumentType)
            ? { reference_document_type: '01', reference_reason: 'Documento asociado al comprobante original' }
            : null,
        }),
      })
      setInvoiceDocumentType('01')
      setInvoiceTaxId('')
      setInvoiceLegalName('')
      setInvoiceEmail('')
      await loadOperations()
      setMessage('Factura registrada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible registrar factura.')
    } finally {
      setLoading(false)
    }
  }

  const closeInvoicePrompt = () => {
    if (loading) return
    setInvoicePromptSale(null)
    setQuickInvoiceTaxId('')
    setQuickInvoiceLegalName('')
    setQuickInvoiceEmail('')
    setMessage('Venta finalizada sin comprobante electronico.')
  }

  const createInvoiceFromPaidSale = async () => {
    if (!invoicePromptSale || !quickInvoiceTaxId.trim() || !quickInvoiceLegalName.trim()) {
      handleBlockedAction('Captura identificacion y razon social para facturar.')
      return
    }

    setLoading(true)
    try {
      const invoice = await api<InvoiceRow>('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          sale_id: invoicePromptSale.id,
          document_type: '01',
          tax_id: quickInvoiceTaxId,
          legal_name: quickInvoiceLegalName,
          email: quickInvoiceEmail || null,
          auto_process: true,
        }),
      })
      setInvoicePromptSale(null)
      setQuickInvoiceTaxId('')
      setQuickInvoiceLegalName('')
      setQuickInvoiceEmail('')
      await loadOperations()
      const autoMessage = invoice.metadata?.auto_process?.message
      const invoiceStatus = invoice.hacienda_status ?? invoice.status
      const statusMessage = invoiceStatus === 'accepted'
        ? 'Factura electronica aceptada por Hacienda.'
        : invoiceStatus === 'submitted'
          ? 'Factura electronica enviada a Hacienda.'
          : invoiceStatus === 'signed'
            ? 'Factura electronica firmada; envio pendiente.'
            : autoMessage
              ? `Factura electronica generada. ${autoMessage}`
              : 'Factura electronica generada para Hacienda.'
      setMessage(statusMessage)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible registrar factura electronica.')
    } finally {
      setLoading(false)
    }
  }

  const saveHaciendaSetting = async () => {
    setLoading(true)
    try {
      const payload = {
        ...haciendaSetting,
        branch_id: haciendaSetting.branch_id || 1,
        country_code: haciendaSetting.country_code || '506',
        schema_version: '4.4',
      }
      if (haciendaSetting.id && !payload.certificate_pin) delete payload.certificate_pin
      if (haciendaSetting.id && !payload.api_password) delete payload.api_password
      const endpoint = haciendaSetting.id ? `/hacienda-settings/${haciendaSetting.id}` : '/hacienda-settings'
      const method = haciendaSetting.id ? 'PUT' : 'POST'
      const saved = await api<HaciendaSettingRow>(endpoint, { method, body: JSON.stringify(payload) })
      setHaciendaSetting({ ...emptyHaciendaSetting, ...saved, certificate_pin: '', api_password: '' })
      setMessage('Configuracion Hacienda guardada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar Hacienda.')
    } finally {
      setLoading(false)
    }
  }

  const testHaciendaConnection = async () => {
    if (!haciendaSetting.id) {
      handleBlockedAction('Guarda la configuracion Hacienda antes de probar conexion.')
      return
    }

    setLoading(true)
    try {
      const result = await api<{ ok: boolean; token_status: string; checks: Record<string, boolean> }>(`/hacienda-settings/${haciendaSetting.id}/test`, { method: 'POST' })
      const failed = Object.entries(result.checks).filter(([, ok]) => !ok).map(([key]) => key.replaceAll('_', ' '))
      setMessage(result.ok ? 'Conexion Hacienda validada correctamente.' : `Hacienda requiere atencion: ${failed.join(', ') || result.token_status}.`)
      await loadAdmin()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible probar Hacienda.')
    } finally {
      setLoading(false)
    }
  }

  const toggleRolePermission = async (role: RoleRow, permission: PermissionRow) => {
    const currentIds = role.permissions.map((item) => item.id)
    const nextIds = currentIds.includes(permission.id)
      ? currentIds.filter((id) => id !== permission.id)
      : [...currentIds, permission.id]

    setLoading(true)
    try {
      await api(`/admin/roles/${role.id}`, { method: 'PUT', body: JSON.stringify({ permissions: nextIds }) })
      await loadAdmin()
      setMessage(`Permisos de ${role.display_name} actualizados.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible actualizar permisos.')
    } finally {
      setLoading(false)
    }
  }

  const saveAdminUser = async (userId: number | null, payload: AdminUserPayload) => {
    if (!payload.name?.trim() || !payload.email?.trim()) {
      setMessage('Captura nombre y correo del usuario.')
      return
    }
    if (!userId && !payload.password?.trim()) {
      setMessage('Captura una contrasena para el usuario nuevo.')
      return
    }

    setLoading(true)
    try {
      await api(userId ? `/admin/users/${userId}` : '/admin/users', {
        method: userId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      await loadAdmin()
      setMessage(userId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar el usuario.')
    } finally {
      setLoading(false)
    }
  }

  const runInvoiceAction = async (invoiceId: number, action: 'xml' | 'sign' | 'submit' | 'status') => {
    const labels = {
      xml: 'XML generado.',
      sign: 'XML firmado.',
      submit: 'Comprobante enviado a Hacienda.',
      status: 'Estado Hacienda actualizado.',
    }
    setLoading(true)
    try {
      await api(`/invoices/${invoiceId}/${action}`, { method: 'POST' })
      await loadOperations()
      setMessage(labels[action])
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible procesar la factura.')
    } finally {
      setLoading(false)
    }
  }

  const downloadInvoicePdf = (invoiceId: number) => {
    const token = localStorage.getItem('pos_token')
    window.open(`${API_URL}/invoices/${invoiceId}/pdf`, '_blank', `authorization=Bearer ${token}`)
  }

  const sendWhatsAppInvoice = async (invoice: { id: number; numero_consecutivo?: string; tax_id?: string; legal_name?: string }) => {
    const phone = prompt('Numero de telefono del cliente (formato 506XXXXXXXX):')
    if (!phone) return
    setLoading(true)
    try {
      await api('/whatsapp/send-invoice', { method: 'POST', body: JSON.stringify({ phone, customer_name: invoice.legal_name ?? 'Cliente', folio: invoice.numero_consecutivo ?? `INV-${invoice.id}`, total: 0 }) })
      setMessage('Factura enviada por WhatsApp.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible enviar por WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  const importProductCsv = async (file: File) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await api<{ created: number; updated: number; skipped: number; warnings: string[] }>('/products/import', { method: 'POST', body: formData })
      setImportResult(result)
      await loadProducts()
      setMessage(`Importacion completada: ${result.created} creados, ${result.updated} actualizados, ${result.skipped} omitidos.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible importar el CSV.')
    } finally {
      setLoading(false)
    }
  }

  const createJournalEntry = async (description: string, entryDate: string, items: { account_id: number; debit: number; credit: number }[]) => {
    setLoading(true)
    try {
      await api('/accounting/entries', { method: 'POST', body: JSON.stringify({ description, entry_date: entryDate, items }) })
      await loadAccounting()
      setMessage('Asiento contable creado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible crear el asiento.')
    } finally {
      setLoading(false)
    }
  }

  const cloudSyncBackup = async () => {
    setLoading(true)
    try {
      const result = await api<{ success?: boolean; records?: number; error?: string }>('/backups/cloud-sync', { method: 'POST' })
      setMessage(result.success ? `Sincronizacion exitosa: ${result.records ?? 0} registros.` : (result.error ?? 'Sincronizacion completada.'))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible sincronizar a Firestore.')
    } finally {
      setLoading(false)
    }
  }

  const generateBarcode = async () => {
    const response = await api<{ barcode: string }>('/barcodes/generate')
    setBarcodeValue(response.barcode)
  }

  const assignBarcode = async () => {
    if (!barcodeProductId || !barcodeValue.trim()) {
      setMessage('Selecciona producto y captura codigo.')
      return
    }
    setLoading(true)
    try {
      await api(`/products/${barcodeProductId}/barcode`, { method: 'POST', body: JSON.stringify({ barcode: barcodeValue }) })
      setBarcodeValue('')
      await loadProducts()
      setMessage('Codigo de barras asignado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible asignar codigo.')
    } finally {
      setLoading(false)
    }
  }

  const printReceipt = () => {
    window.print()
  }

  const createAccountingAccount = async () => {
    if (!newAccountCode.trim() || !newAccountName.trim() || !newAccountType) {
      setMessage('Captura codigo, nombre y tipo de cuenta.')
      return
    }
    setLoading(true)
    try {
      await api('/accounting/accounts', { method: 'POST', body: JSON.stringify({ code: newAccountCode, name: newAccountName, type: newAccountType }) })
      setNewAccountCode('')
      setNewAccountName('')
      setNewAccountType('')
      await loadAccounting()
      setMessage('Cuenta contable creada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  const viewAccountingEntry = async (entryId: number) => {
    try {
      const response = await api<{ entry: { id: number; description: string; entry_date: string }; items: Array<{ id: number; account_id: number; debit: number; credit: number; description?: string; code: string; account_name: string; account_type: string }> }>(`/accounting/entries/${entryId}`)
      setEntryDetail(response)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible cargar el asiento.')
    }
  }

  const createBankAccount = async () => {
    if (!newBankName.trim()) {
      setMessage('Captura el nombre del banco.')
      return
    }
    setLoading(true)
    try {
      await api('/accounting/bank-accounts', { method: 'POST', body: JSON.stringify({ bank_name: newBankName, account_number: newBankNumber, account_type: newBankType }) })
      setNewBankName('')
      setNewBankNumber('')
      setNewBankType('')
      await loadAccounting()
      setMessage('Cuenta bancaria creada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible crear la cuenta bancaria.')
    } finally {
      setLoading(false)
    }
  }

  const importBankStatement = async (bankAccountId: number, file: File, format: string) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('bank_account_id', String(bankAccountId))
      formData.append('file', file)
      formData.append('format', format)
      const response = await api<{ parsed: number; inserted: number; skipped: number }>('/accounting/bank-accounts/' + bankAccountId + '/import', { method: 'POST', body: formData })
      await loadAccounting()
      setMessage(`Importados ${response.inserted} registros (${response.skipped} omitidos).`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible importar el estado de cuenta.')
    } finally {
      setLoading(false)
    }
  }

  const createHrEmployee = async () => {
    if (!newEmployeeName.trim()) {
      setMessage('Captura el nombre del empleado.')
      return
    }
    setLoading(true)
    try {
      await api('/hr/employees', { method: 'POST', body: JSON.stringify({ name: newEmployeeName, identification: newEmployeeId || null, position: newEmployeePosition || null, department: newEmployeeDepartment || null, pin: newEmployeePin || null }) })
      setNewEmployeeName('')
      setNewEmployeeId('')
      setNewEmployeePosition('')
      setNewEmployeeDepartment('')
      setNewEmployeePin('')
      await loadHr()
      setMessage('Empleado registrado.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible registrar el empleado.')
    } finally {
      setLoading(false)
    }
  }

  const clockEmployee = async () => {
    if (!attendancePin.trim()) {
      setMessage('Captura el PIN del empleado.')
      return
    }
    setLoading(true)
    setClockResult(null)
    try {
      const response = await api<{ action: string; employee: string; time: string }>('/hr/clock', { method: 'POST', body: JSON.stringify({ pin: attendancePin }) })
      const actionLabel = response.action === 'clock_in' ? 'Entrada registrada' : 'Salida registrada'
      setClockResult(`${actionLabel}: ${response.employee} a las ${response.time}`)
      setAttendancePin('')
      await loadHr()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'PIN incorrecto o empleado inactivo.')
    } finally {
      setLoading(false)
    }
  }

  const saveWhatsappSettingsHandler = async () => {
    setLoading(true)
    try {
      await api('/whatsapp/settings', { method: 'POST', body: JSON.stringify(whatsappSettings) })
      setMessage('Configuracion WhatsApp guardada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar configuracion WhatsApp.')
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }

      await document.documentElement.requestFullscreen()
    } catch {
      setMessage('Pantalla completa no disponible en este navegador.')
    }
  }

  const focusSearch = () => {
    setActiveModule('sale')
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
  }

  const removeLastCartItem = () => {
    const lastItem = cart.at(-1)
    if (!lastItem) {
      setMessage('No hay articulos para eliminar.')
      return
    }
    removeItem(lastItem.id)
    setMessage(`${lastItem.name} eliminado de la venta.`)
  }

  const incrementLastCartItem = () => {
    const lastItem = cart.at(-1)
    if (!lastItem) {
      setMessage('Agrega un producto antes de cambiar cantidad.')
      return
    }
    updateCartQuantity(lastItem.id, lastItem.quantity + 1)
    setMessage(`Cantidad actualizada para ${lastItem.name}.`)
  }

  const applyQuickDiscount = () => {
    if (cart.length === 0) {
      setMessage('Agrega productos antes de aplicar descuento.')
      return
    }
    setDiscountDialogOpen(true)
    setMessage('Descuento rapido de 10% aplicado a la venta.')
  }

  const confirmCustomDiscount = () => {
    const value = Number(customDiscountValue)
    if (Number.isNaN(value) || value < 0 || value > 100) {
      handleBlockedAction('Ingresa un porcentaje de descuento valido (0-100).')
      return
    }
    applyDiscountPercent(value)
    setMessage(`Descuento de ${value}% aplicado a la venta.`)
    setDiscountDialogOpen(false)
  }

  const saveCurrentSale = () => {
    if (cart.length === 0) {
      setMessage('No hay articulos para guardar.')
      return
    }
    localStorage.setItem(HELD_SALE_KEY, JSON.stringify(cart))
    clearCart()
    setMessage('Venta guardada temporalmente.')
  }

  const startNewSale = () => {
    setQuery('')
    if (cart.length === 0) {
      handleBlockedAction('Venta lista para comenzar.')
      return
    }

    askConfirmation({
      title: 'Nueva venta',
      message: 'Se limpiara la orden actual sin cobrarla.',
      tone: 'danger',
      confirmLabel: 'Limpiar orden',
      onConfirm: () => {
        clearCart()
        setSelectedCustomerId('')
        setPaymentMethod('cash')
        setMessage('Nueva venta iniciada.')
      },
    })
  }

  const cancelCurrentOrder = () => {
    if (cart.length === 0) {
      handleBlockedAction('No hay una orden activa para anular.')
      return
    }

    askConfirmation({
      title: 'Anular orden',
      message: `Se anulara la orden actual con ${cart.length} articulo(s). Esta accion queda registrada en la operacion del cajero.`,
      tone: 'danger',
      confirmLabel: 'Anular orden',
      onConfirm: () => {
        clearCart()
        setSelectedCustomerId('')
        setPaymentMethod('cash')
        setMessage('Orden anulada.')
      },
    })
  }

  const restoreSavedSale = () => {
    const saved = localStorage.getItem(HELD_SALE_KEY)
    if (!saved) {
      setMessage('No hay venta guardada para restaurar.')
      return
    }
    try {
      setCart(JSON.parse(saved))
      localStorage.removeItem(HELD_SALE_KEY)
      setMessage('Venta guardada restaurada.')
    } catch {
      localStorage.removeItem(HELD_SALE_KEY)
      setMessage('La venta guardada no se pudo restaurar.')
    }
  }

  const openCustomersFromPos = () => {
    setCustomerDialogOpen(true)
    setMessage('Selecciona el cliente para asociarlo a la venta.')
  }

  const openRefundsFromPos = () => {
    if (!hasPermission('refunds.create') && !canAccessModule('reports')) {
      handleBlockedAction('No tienes permisos para registrar devoluciones.')
      return
    }
    setActiveModule('reports')
    setMessage('Selecciona una venta completada para devolverla.')
  }

  useEffect(() => {
    const normalized = query.trim()
    if (!normalized || normalized.length < 3) return

    // Auto-add if exact SKU or Barcode match (for scanners)
    const exactMatch = productsSource.find(
      (p) => p.sku?.toLowerCase() === normalized.toLowerCase() || p.barcode?.toLowerCase() === normalized.toLowerCase()
    )

    if (exactMatch) {
      addProductToCart(exactMatch)
      setQuery('')
    }
  }, [addProductToCart, productsSource, query])

  const setPosMessage = (value: string) => {
    setMessage(value)
  }

  const products = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return productsSource
    return productsSource.filter((product) =>
      [product.name, product.sku, product.barcode, product.category].some((value) => value?.toLowerCase().includes(normalized)),
    )
  }, [productsSource, query])

  const subtotal = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
  const discount = cart.reduce((sum, item) => sum + item.discount, 0)
  const tax = cart.reduce((sum, item) => sum + roundMoney(((item.salePrice * item.quantity - item.discount) * item.taxRate) / 100), 0)
  const total = roundMoney(Math.max(0, subtotal - discount + tax))
  const selectedCustomer = customers.find((customer) => String(customer.id) === selectedCustomerId) ?? null
  const pendingFiscalCount = invoices.filter((invoice) => ['pending_xml', 'generated', 'xml_generated', 'signed', 'submitted', 'received', 'processing'].includes(invoice.hacienda_status ?? invoice.status)).length
  const cashBreakdownTotal = cashDenominations.reduce((sum, denomination) => sum + denomination * Number(cashBreakdown[String(denomination)] || 0), 0)
  const lowStockProducts = productsSource.filter((product) => product.stock <= product.minStock)
  const inventoryValue = productsSource.reduce((sum, product) => sum + product.salePrice * product.stock, 0)
  const estimatedProfit = productsSource.reduce((sum, product) => sum + (product.salePrice - product.costPrice) * product.stock, 0)
  const isDarkTheme = theme === 'dark'
  const cashReceivedValue = Number(cashReceived)
  const paymentChange = roundMoney(Math.max(0, (Number.isFinite(cashReceivedValue) ? cashReceivedValue : 0) - total))
  const requiresCashAmount = paymentMethod === 'cash' || paymentMethod === 'mixed'
  const closingExpected = Number(cashClosingSummary?.expected_amount ?? currentCashSession?.expected_amount ?? 0)
  const closingCounted = Number(cashClosingAmount)
  const closingDifference = roundMoney((Number.isFinite(closingCounted) ? closingCounted : 0) - closingExpected)
  const paymentLabels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    sinpe: 'SINPE',
    credit: 'Credito',
    mixed: 'Mixto',
  }

  useEffect(() => {
    const hasBreakdown = Object.values(cashBreakdown).some((value) => Number(value) > 0)
    if (cashClosingDialogOpen && hasBreakdown) {
      setCashClosingAmount(String(cashBreakdownTotal))
    }
  }, [cashBreakdown, cashBreakdownTotal, cashClosingDialogOpen])

  useEffect(() => {
    if (!user || paymentDialogOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT' || target?.isContentEditable
      if (isTyping || activeModule !== 'sale') return

      const actions: Record<string, () => void> = {
        F2: applyQuickDiscount,
        F3: focusSearch,
        F4: incrementLastCartItem,
        F7: () => setPaymentMethod('transfer'),
        F8: clearCart,
        F9: saveCurrentSale,
        F10: openPaymentDialog,
      }

      const action = actions[event.key]
      if (!action) return
      event.preventDefault()
      action()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeModule, applyQuickDiscount, clearCart, focusSearch, incrementLastCartItem, openPaymentDialog, paymentDialogOpen, saveCurrentSale, setPaymentMethod, user])

  if (authChecking) {
    return (
      <main className={isDarkTheme ? 'grid min-h-screen place-items-center bg-[#202020] p-5 text-white' : 'grid min-h-screen place-items-center bg-stone-100 p-5 text-stone-950'}>
        <Card className={isDarkTheme ? 'w-full max-w-md border-[#4b4b4b] bg-[#2d2d2d] p-6 text-white' : 'w-full max-w-md p-6'}>
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin" size={22} />
            <span className="font-semibold">Restaurando sesion...</span>
          </div>
        </Card>
      </main>
    )
  }

  if (!user) {
    return (
      <main className={isDarkTheme ? 'grid min-h-screen place-items-center bg-[#202020] p-5 text-white' : 'grid min-h-screen place-items-center bg-stone-100 p-5 text-stone-950'}>
        <Card className={isDarkTheme ? 'w-full max-w-md border-[#4b4b4b] bg-[#2d2d2d] p-6 text-white' : 'w-full max-w-md p-6'}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-none bg-[#202020] text-white">
              <ReceiptText size={24} />
            </div>
            <div>
              <p className={isDarkTheme ? 'text-sm font-semibold text-stone-300' : 'text-sm font-semibold text-stone-700'}>POS profesional</p>
              <h1 className="text-2xl font-bold">Iniciar sesion</h1>
            </div>
          </div>
          <div className="space-y-3">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Correo" />
            <Input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contrasena" type="password" />
            <Button className="w-full" onClick={login} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              Entrar
            </Button>
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-stone-300 dark:border-[#4b4b4b]"></div>
              <span className="flex-shrink mx-4 text-stone-500 text-xs uppercase">o</span>
              <div className="flex-grow border-t border-stone-300 dark:border-[#4b4b4b]"></div>
            </div>
            <Button
              className="w-full bg-[#4285F4] hover:bg-[#357ae8] text-white flex items-center justify-center gap-2"
              onClick={() => loginWithGoogle()}
              disabled={loading}
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" style={{ minWidth: '16px' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google
            </Button>
          </div>
          <p className={isDarkTheme ? 'mt-4 bg-[#242424] p-3 text-sm text-stone-300' : 'mt-4 bg-stone-50 p-3 text-sm text-stone-600'}>{message}</p>
        </Card>
        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      </main>
    )
  }

  return (
    <main className={isDarkTheme ? 'h-dvh overflow-hidden bg-[#202020] text-white' : 'h-dvh overflow-hidden bg-stone-100 text-stone-950'}>
      <div className="grid h-dvh grid-rows-[auto_1fr] lg:grid-cols-[80px_1fr] lg:grid-rows-1">
        <aside className="flex min-h-0 border-b border-[#343434] bg-[#202020] lg:flex-col lg:border-b-0 lg:border-r print:hidden">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center">
            <div className={isDarkTheme ? 'flex h-10 w-10 items-center justify-center rounded-none bg-[#2d2d2d] text-white' : 'flex h-10 w-10 items-center justify-center rounded-none bg-[#202020] text-white'}>
              <ReceiptText size={22} />
            </div>
          </div>
          <nav className="flex min-h-0 flex-1 items-center gap-1 overflow-x-auto px-2 lg:flex-col lg:items-stretch lg:overflow-x-hidden lg:overflow-y-auto lg:py-4">
            {allowedNav.map((item) => (
              <button
                key={item.key}
                aria-label={`Ir a ${item.label}`}
                className={`flex h-12 min-w-12 items-center justify-center rounded-none transition ${activeModule === item.key ? 'bg-[#0088cc] text-white' : isDarkTheme ? 'text-stone-400 hover:bg-[#242424] hover:text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'}`}
                data-testid={`nav-${item.key}`}
                title={item.label}
                onClick={() => setActiveModule(item.key)}
              >
                <item.icon size={20} />
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden print:hidden">
          <header className="shrink-0 flex flex-col gap-3 border-b border-[#343434] bg-[#202020] px-5 py-3 text-white xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className={isDarkTheme ? 'text-sm font-medium text-[#38bdf8]' : 'text-sm font-medium text-stone-600'}>{user.branch?.name ?? 'Sucursal Principal'} - {apiOnline ? 'API conectada' : 'Sin conexion API'}</p>
              <h1 className="text-2xl font-bold">{allowedNav.find((item) => item.key === activeModule)?.label ?? 'Punto de venta'}</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] xl:w-[860px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2 text-slate-400" size={16} />
                <Input
                  ref={searchInputRef}
                  className="h-9 pl-9"
                  placeholder="Buscar por nombre, SKU o codigo de barras"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && products.length > 0) {
                      addProductToCart(products[0])
                      setQuery('')
                    }
                  }}
                />
              </div>
              <Button className="h-9" variant="secondary" onClick={toggleTheme} title="Cambiar tema" aria-label="Cambiar tema">
                {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <Button className="h-9" variant="secondary" onClick={toggleFullscreen} title="Pantalla completa" aria-label="Pantalla completa">
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </Button>
              {canAccessModule('cash') && (
                <Button className="h-9" variant={cashSessionOpen ? 'secondary' : 'primary'} onClick={cashSessionOpen ? openCashClosingDialog : openCashSession} disabled={loading || (cashSessionOpen && !hasPermission('cash.close'))}>
                  <WalletCards size={18} />
                  {cashSessionOpen ? (hasPermission('cash.close') ? 'Cerrar caja' : 'Caja abierta') : 'Abrir caja'}
                </Button>
              )}
              <Button className="h-9" variant="ghost" onClick={logout} title="Cerrar sesion" aria-label="Cerrar sesion">
                <LogOut size={18} />
              </Button>
            </div>
          </header>

          {activeModule === 'sale' ? (
            <PosWorkspace
              products={products}
              cart={cart}
              subtotal={subtotal}
              discount={discount}
              tax={tax}
              total={total}
              loading={loading}
              isDarkTheme={isDarkTheme}
              statusMessage={message}
              selectedCustomerName={selectedCustomer?.name}
              cashSessionOpen={cashSessionOpen}
              paymentMethod={paymentMethod}
              onAdd={addProductToCart}
              onRefresh={loadProducts}
              onFocusSearch={focusSearch}
              onClear={startNewSale}
              onCharge={openPaymentDialog}
              onRemove={removeItem}
              onRemoveLast={removeLastCartItem}
              onCancelOrder={cancelCurrentOrder}
              onSetPayment={setPaymentMethod}
              onUpdateQuantity={updateCartQuantity}
              onIncrementLast={incrementLastCartItem}
              onApplyDiscount={applyQuickDiscount}
              onToggleCashSession={cashSessionOpen ? openCashClosingDialog : openCashSession}
              onSaveSale={saveCurrentSale}
              onRestoreSale={restoreSavedSale}
              onOpenCustomers={openCustomersFromPos}
              onClearCustomer={() => {
                setSelectedCustomerId('')
                setMessage('Cliente removido de la venta.')
              }}
              onOpenRefunds={openRefundsFromPos}
              onLock={logout}
              onMessage={setPosMessage}
              onBlocked={handleBlockedAction}
            />
          ) : (
            <div className="min-h-0 flex-1 space-y-5 overflow-auto p-5">
              <ModuleStatusBar
                userName={user.name}
                apiOnline={apiOnline}
                cashSessionOpen={cashSessionOpen}
                cashSessionId={cashSessionId}
                lowStockCount={lowStockProducts.length}
                message={message}
                hasReceipt={Boolean(lastReceipt)}
                onPrint={printReceipt}
              />

              <section className="min-w-0">
                {activeModule === 'dashboard' && (
                  <DashboardModule dashboard={dashboard} />
                )}

                {activeModule === 'inventory' && (
                  <InventoryModule
                    products={products}
                    movements={stockMovements}
                    form={productForm}
                    loading={loading}
                    categories={categories}
                    brands={brands}
                    suppliers={suppliers}
                    newCategory={newCategory}
                    newBrand={newBrand}
                    newSupplier={newSupplier}
                    inventoryValue={inventoryValue}
                    estimatedProfit={estimatedProfit}
                    lowStockCount={lowStockProducts.length}
                    onFormChange={setProductForm}
                    onNewCategory={setNewCategory}
                    onNewBrand={setNewBrand}
                    onNewSupplier={setNewSupplier}
                    onCreateCatalog={createCatalogItem}
                    onSave={saveProduct}
                    onCancel={() => setProductForm(emptyProductForm)}
                    onEdit={editProduct}
                    onDelete={deleteProduct}
                    onRegenerate={regenerateProductIdentifiers}
                    onAdjust={adjustStock}
                    onImportCsv={importProductCsv}
                    importResult={importResult}
                  />
                )}

                {activeModule === 'customers' && (
                  <CustomersModule
                    customers={customers}
                    loading={loading}
                    form={customerForm}
                    onFormChange={setCustomerForm}
                    onSave={saveCustomer}
                    onCancel={() => setCustomerForm(emptyCustomerForm)}
                    onEdit={editCustomer}
                    onDelete={deleteCustomer}
                  />
                )}

                {activeModule === 'reports' && (
                  <ReportsModule
                    summary={salesSummary}
                    topProducts={topProducts}
                    sales={sales}
                    refunds={refunds}
                    loading={loading}
                    onRefund={refundSale}
                    onReprint={reprintSale}
                  />
                )}

                {activeModule === 'cash' && (
                  <CashModule
                    movements={cashMovements}
                    type={cashMovementType}
                    amount={cashMovementAmount}
                    reason={cashMovementReason}
                    registers={cashRegisters}
                    openingForm={cashOpeningForm}
                    currentSession={currentCashSession}
                    closingAmount={cashClosingAmount}
                    loading={loading}
                    cashSessionOpen={cashSessionOpen}
                    onType={setCashMovementType}
                    onAmount={setCashMovementAmount}
                    onReason={setCashMovementReason}
                    onOpeningForm={setCashOpeningForm}
                    onOpening={openCashSession}
                    onClosingAmount={setCashClosingAmount}
                    onClosing={openCashClosingDialog}
                    onCreate={createCashMovement}
                  />
                )}

                {activeModule === 'credit' && (
                  <CreditModule
                    customers={customers}
                    payments={creditPayments}
                    customerId={creditCustomerId}
                    amount={creditPaymentAmount}
                    loading={loading}
                    onCustomer={setCreditCustomerId}
                    onAmount={setCreditPaymentAmount}
                    onCreate={createCreditPayment}
                  />
                )}

                {activeModule === 'promotions' && (
                  <PromotionsModule
                    promotions={promotions}
                    name={promotionName}
                    code={promotionCode}
                    value={promotionValue}
                    loading={loading}
                    onName={setPromotionName}
                    onCode={setPromotionCode}
                    onValue={setPromotionValue}
                    onCreate={createPromotion}
                  />
                )}

                {activeModule === 'payments' && (
                  <PaymentMethodsModule
                    methods={paymentMethods}
                    code={paymentMethodCode}
                    name={paymentMethodName}
                    type={paymentMethodType}
                    loading={loading}
                    onCode={setPaymentMethodCode}
                    onName={setPaymentMethodName}
                    onType={setPaymentMethodType}
                    onCreate={createPaymentMethod}
                    onCreateSinpe={createSinpePaymentMethod}
                  />
                )}

                {activeModule === 'invoices' && (
                  <InvoicesModule
                    sales={sales}
                    invoices={invoices}
                    saleId={invoiceSaleId}
                    documentType={invoiceDocumentType}
                    taxId={invoiceTaxId}
                    legalName={invoiceLegalName}
                    email={invoiceEmail}
                    loading={loading}
                    onSale={setInvoiceSaleId}
                    onDocumentType={setInvoiceDocumentType}
                    onTaxId={setInvoiceTaxId}
                    onLegalName={setInvoiceLegalName}
                    onEmail={setInvoiceEmail}
                    onCreate={createInvoice}
                    onGenerateXml={(invoiceId) => runInvoiceAction(invoiceId, 'xml')}
                    onSign={(invoiceId) => runInvoiceAction(invoiceId, 'sign')}
                    onSubmit={(invoiceId) => runInvoiceAction(invoiceId, 'submit')}
                    onCheckStatus={(invoiceId) => runInvoiceAction(invoiceId, 'status')}
                    onDownloadPdf={downloadInvoicePdf}
                    onSendWhatsApp={sendWhatsAppInvoice}
                  />
                )}

                {activeModule === 'barcodes' && (
                  <BarcodesModule
                    products={productsSource}
                    productId={barcodeProductId}
                    barcode={barcodeValue}
                    loading={loading}
                    onProduct={setBarcodeProductId}
                    onBarcode={setBarcodeValue}
                    onGenerate={generateBarcode}
                    onAssign={assignBarcode}
                  />
                )}

                {activeModule === 'printer' && (
                  <PrinterModule
                    printerName={printerName}
                    receiptWidth={receiptWidth}
                    autoPrint={autoPrint}
                    loading={loading}
                    hasReceipt={Boolean(lastReceipt)}
                    onPrinterName={setPrinterName}
                    onReceiptWidth={setReceiptWidth}
                    onAutoPrint={setAutoPrint}
                    onSave={saveSettings}
                    onTest={printReceipt}
                  />
                )}

                {activeModule === 'backups' && (
                  <BackupsModule
                    backups={backups}
                    schedule={backupSchedule}
                    loading={loading}
                    onCreate={createBackup}
                    onDownload={downloadBackup}
                    onVerify={verifyBackup}
                    onRestore={restoreBackup}
                    onDelete={deleteBackup}
                    onSchedule={saveBackupSchedule}
                    onCloudSync={cloudSyncBackup}
                  />
                )}

                {activeModule === 'settings' && (
                  <SettingsModule
                    businessName={businessName}
                    currencyCode={currencyCode}
                    defaultTax={defaultTax}
                    branches={branches}
                    branchForm={branchForm}
                    settings={settings}
                    loading={loading}
                    hasReceipt={Boolean(lastReceipt)}
                    haciendaSetting={haciendaSetting}
                    onBusinessName={setBusinessName}
                    onCurrencyCode={setCurrencyCode}
                    onDefaultTax={setDefaultTax}
                    onBranchFormChange={setBranchForm}
                    onSaveBranch={saveBranch}
                    onCancelBranch={() => setBranchForm(emptyBranchForm)}
                    onEditBranch={editBranch}
                    onDeleteBranch={deleteBranch}
                    onSave={saveSettings}
                    onHaciendaChange={setHaciendaSetting}
                    onSaveHacienda={saveHaciendaSetting}
                    whatsappSettings={whatsappSettings}
                    onWhatsappChange={setWhatsappSettings}
                    onSaveWhatsapp={saveWhatsappSettingsHandler}
                    onPrint={printReceipt}
                  />
                )}

                {activeModule === 'accounting' && (
                  <AccountingModule
                    accounts={accountingAccounts}
                    entries={accountingEntries}
                    entryDetail={entryDetail}
                    trialBalance={trialBalance}
                    bankAccounts={bankAccounts}
                    statementLines={statementLines}
                    newAccountCode={newAccountCode}
                    newAccountName={newAccountName}
                    newAccountType={newAccountType}
                    newBankName={newBankName}
                    newBankNumber={newBankNumber}
                    newBankType={newBankType}
                    loading={loading}
                    onNewAccountCode={setNewAccountCode}
                    onNewAccountName={setNewAccountName}
                    onNewAccountType={setNewAccountType}
                    onCreateAccount={createAccountingAccount}
                    onNewBankName={setNewBankName}
                    onNewBankNumber={setNewBankNumber}
                    onNewBankType={setNewBankType}
                    onCreateBank={createBankAccount}
                    onViewEntry={viewAccountingEntry}
                    onImportStatement={importBankStatement}
                    onCreateEntry={createJournalEntry}
                  />
                )}

                {activeModule === 'hr' && (
                  <HrModule
                    employees={hrEmployees}
                    attendances={hrAttendances}
                    loading={loading}
                    clockResult={clockResult}
                    newEmployeeName={newEmployeeName}
                    newEmployeeId={newEmployeeId}
                    newEmployeePosition={newEmployeePosition}
                    newEmployeeDepartment={newEmployeeDepartment}
                    newEmployeePin={newEmployeePin}
                    attendancePin={attendancePin}
                    onNewEmployeeName={setNewEmployeeName}
                    onNewEmployeeId={setNewEmployeeId}
                    onNewEmployeePosition={setNewEmployeePosition}
                    onNewEmployeeDepartment={setNewEmployeeDepartment}
                    onNewEmployeePin={setNewEmployeePin}
                    onCreateEmployee={createHrEmployee}
                    onAttendancePin={setAttendancePin}
                    onClock={clockEmployee}
                  />
                )}

                {activeModule === 'admin' && (
                  <AdminModule
                    roles={roles}
                    permissions={permissions}
                    users={adminUsers}
                    branches={branches}
                    logs={activityLogs}
                    loading={loading}
                    onTogglePermission={toggleRolePermission}
                    onSaveUser={saveAdminUser}
                    onTestHacienda={testHaciendaConnection}
                  />
                )}
              </section>
            </div>
          )}
        </section>
      </div>

      {customerDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
          <Card className={isDarkTheme ? 'max-h-[88vh] w-full max-w-2xl overflow-auto border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'max-h-[88vh] w-full max-w-2xl overflow-auto p-5'}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Cliente de la venta</p>
                <h2 className="text-2xl font-bold">Seleccionar cliente</h2>
              </div>
              <Button variant="ghost" onClick={() => setCustomerDialogOpen(false)}>Cerrar</Button>
            </div>
            <div className="grid gap-2">
              <button
                className={isDarkTheme ? 'border border-[#4b4b4b] bg-[#242424] px-3 py-3 text-left text-sm hover:bg-[#303030]' : 'border border-stone-200 px-3 py-3 text-left text-sm hover:bg-stone-50'}
                onClick={() => {
                  setSelectedCustomerId('')
                  setCustomerDialogOpen(false)
                  setMessage('Venta sin cliente asociado.')
                }}
              >
                Consumidor final
              </button>
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  className={String(customer.id) === selectedCustomerId ? 'border border-[#0088cc] bg-[#0088cc] px-3 py-3 text-left text-sm text-white' : isDarkTheme ? 'border border-[#4b4b4b] bg-[#242424] px-3 py-3 text-left text-sm hover:bg-[#303030]' : 'border border-stone-200 px-3 py-3 text-left text-sm hover:bg-stone-50'}
                  onClick={() => {
                    setSelectedCustomerId(String(customer.id))
                    setCustomerDialogOpen(false)
                    setMessage(`${customer.name} asociado a la venta.`)
                  }}
                >
                  <span className="block font-bold">{customer.name}</span>
                  <span className={String(customer.id) === selectedCustomerId ? 'text-white/80' : 'text-slate-500'}>{customer.identification_number ?? 'Sin identificacion'} {customer.email ? `- ${customer.email}` : ''}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {paymentDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
          <Card className={isDarkTheme ? 'w-full max-w-lg border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'w-full max-w-lg p-5'}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Cobro de venta</p>
                <h2 className="text-2xl font-bold">{currency.format(total)}</h2>
              </div>
              <Button variant="ghost" onClick={closePaymentDialog} disabled={loading}>Cancelar</Button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-1">
                {([
                  ['cash', 'Efectivo'],
                  ['card', 'Tarjeta'],
                  ['transfer', 'SINPE'],
                  ['credit', 'Credito'],
                ] as const).map(([method, label]) => (
                  <button
                    key={method}
                    className={paymentMethod === method
                      ? 'border border-[#0088cc] bg-[#0088cc] px-2 py-2 text-xs font-bold text-white'
                      : isDarkTheme
                        ? 'border border-[#575757] bg-[#1f1f1f] px-2 py-2 text-xs font-semibold text-stone-200 hover:bg-[#303030]'
                        : 'border border-stone-300 bg-white px-2 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100'}
                    onClick={() => {
                      setPaymentMethod(method)
                      setCashReceived(method === 'cash' ? '' : total.toFixed(2))
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className={isDarkTheme ? 'grid grid-cols-2 gap-2 bg-[#242424] p-3 text-sm' : 'grid grid-cols-2 gap-2 bg-stone-100 p-3 text-sm'}>
                <span>Metodo</span>
                <strong className="text-right">{paymentMethod === 'cash' ? 'Efectivo' : paymentMethod === 'card' ? 'Tarjeta' : paymentMethod === 'transfer' ? 'Transferencia' : paymentMethod === 'credit' ? 'Credito' : 'Mixto'}</strong>
                <span>Total</span>
                <strong className="text-right">{currency.format(total)}</strong>
                {requiresCashAmount && (
                  <>
                    <span>Vuelto</span>
                    <strong className="text-right">{currency.format(paymentChange)}</strong>
                  </>
                )}
              </div>

              {requiresCashAmount && (
                <Input
                  autoFocus
                  inputMode="decimal"
                  placeholder="Monto recibido en efectivo"
                  value={cashReceived}
                  onChange={(event) => setCashReceived(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') confirmPayment()
                    if (event.key === 'Escape') closePaymentDialog()
                  }}
                />
              )}

              {paymentMethod === 'credit' && (
                <div className={isDarkTheme ? 'space-y-3 border border-[#4b4b4b] bg-[#242424] p-3' : 'space-y-3 border border-stone-300 bg-stone-50 p-3'}>
                  <div className="grid grid-cols-2 gap-2">
                    <Button className="h-9" variant={creditCustomerMode === 'existing' ? 'primary' : 'secondary'} onClick={() => setCreditCustomerMode('existing')}>
                      <Users size={16} />
                      Cliente
                    </Button>
                    <Button className="h-9" variant={creditCustomerMode === 'new' ? 'primary' : 'secondary'} onClick={() => setCreditCustomerMode('new')}>
                      <UserPlus size={16} />
                      Crear
                    </Button>
                  </div>

                  {creditCustomerMode === 'existing' ? (
                    <select
                      className="h-10 w-full rounded-none border border-stone-300 bg-white px-3 text-sm outline-none focus:border-[#0088cc] dark:border-[#4b4b4b] dark:bg-[#1f1f1f] dark:text-stone-100"
                      value={paymentCustomerId || selectedCustomerId}
                      onChange={(event) => {
                        setPaymentCustomerId(event.target.value)
                        setSelectedCustomerId(event.target.value)
                      }}
                    >
                      <option value="">Selecciona cliente para credito</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} {customer.identification_number ? `- ${customer.identification_number}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid gap-2">
                      <Input placeholder="Nombre del cliente" value={creditCustomerForm.name} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, name: event.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Telefono" value={creditCustomerForm.phone} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, phone: event.target.value })} />
                        <Input placeholder="Email" value={creditCustomerForm.email} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, email: event.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Identificacion" value={creditCustomerForm.identification_number} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, identification_number: event.target.value })} />
                        <Input placeholder="Limite credito" type="number" value={creditCustomerForm.credit_limit} onChange={(event) => setCreditCustomerForm({ ...creditCustomerForm, credit_limit: event.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={closePaymentDialog} disabled={loading}>Cancelar</Button>
                <Button onClick={confirmPayment} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <WalletCards size={18} />}
                  Aceptar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {invoicePromptSale && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
          <Card className={isDarkTheme ? 'w-full max-w-lg border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'w-full max-w-lg p-5'}>
            <div className="mb-4">
              <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Venta cobrada e impresa</p>
              <h2 className="text-2xl font-bold">Desea factura electronica?</h2>
              <p className={isDarkTheme ? 'mt-1 text-sm text-stone-300' : 'mt-1 text-sm text-stone-600'}>
                Venta {invoicePromptSale.folio} por {currency.format(Number(invoicePromptSale.total))}.
              </p>
            </div>

            <div className="grid gap-3">
              <Input placeholder="Identificacion fiscal" value={quickInvoiceTaxId} onChange={(event) => setQuickInvoiceTaxId(event.target.value)} />
              <Input placeholder="Razon social" value={quickInvoiceLegalName} onChange={(event) => setQuickInvoiceLegalName(event.target.value)} />
              <Input placeholder="Correo para factura" value={quickInvoiceEmail} onChange={(event) => setQuickInvoiceEmail(event.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={closeInvoicePrompt} disabled={loading}>No emitir</Button>
                <Button onClick={createInvoiceFromPaidSale} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <ReceiptText size={18} />}
                  Emitir factura
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {discountDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
          <Card className={isDarkTheme ? 'w-full max-w-sm border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'w-full max-w-sm p-5'}>
            <div className="mb-4">
              <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Aplicar descuento</p>
              <h2 className="text-xl font-bold">Porcentaje de descuento</h2>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {['5', '10', '15', '20'].map((val) => (
                  <Button key={val} variant={customDiscountValue === val ? 'primary' : 'secondary'} onClick={() => setCustomDiscountValue(val)} className="h-10">
                    {val}%
                  </Button>
                ))}
              </div>
              <Input
                autoFocus
                type="number"
                placeholder="Otro %"
                value={customDiscountValue}
                onChange={(event) => setCustomDiscountValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') confirmCustomDiscount()
                  if (event.key === 'Escape') setDiscountDialogOpen(false)
                }}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setDiscountDialogOpen(false)}>Cancelar</Button>
                <Button onClick={confirmCustomDiscount}>Aplicar</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {cashClosingDialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 print:hidden">
          <Card className={isDarkTheme ? 'max-h-[92vh] w-full max-w-3xl overflow-auto border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'max-h-[92vh] w-full max-w-3xl overflow-auto p-5'}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className={isDarkTheme ? 'text-sm font-semibold text-[#38bdf8]' : 'text-sm font-semibold text-[#0088cc]'}>Arqueo de caja</p>
                <h2 className="text-2xl font-bold">Confirmar cierre</h2>
              </div>
              <Button variant="ghost" onClick={cancelCashClosingDialog} disabled={loading}>Cancelar</Button>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className={isDarkTheme ? 'border border-[#4b4b4b] p-3' : 'border border-stone-200 p-3'}>
                <span className="block text-xs uppercase text-slate-500">Cajero</span>
                <strong>{cashClosingSummary?.session.user?.name ?? user.name}</strong>
              </div>
              <div className={isDarkTheme ? 'border border-[#4b4b4b] p-3' : 'border border-stone-200 p-3'}>
                <span className="block text-xs uppercase text-slate-500">Caja</span>
                <strong>{cashClosingSummary?.session.cash_register?.name ?? currentCashSession?.cash_register?.name ?? 'Caja activa'}</strong>
              </div>
              <div className={isDarkTheme ? 'border border-[#4b4b4b] p-3' : 'border border-stone-200 p-3'}>
                <span className="block text-xs uppercase text-slate-500">Turno</span>
                <strong>{cashClosingSummary?.session.shift ?? currentCashSession?.shift ?? 'Sin turno'}</strong>
              </div>
              <div className={isDarkTheme ? 'border border-[#4b4b4b] p-3' : 'border border-stone-200 p-3'}>
                <span className="block text-xs uppercase text-slate-500">Ventas</span>
                <strong>{cashClosingSummary?.sales_count ?? 0}</strong>
              </div>
            </div>
            {pendingFiscalCount > 0 && (
              <div className="mt-4 border border-amber-500 bg-amber-500/10 p-3 text-sm text-amber-200">
                Hay {pendingFiscalCount} documento(s) Hacienda pendientes. El cierre se bloqueara hasta resolver o consultar estado.
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className={isDarkTheme ? 'space-y-2 border border-[#4b4b4b] p-4' : 'space-y-2 border border-stone-200 p-4'}>
                <h3 className="font-bold">Efectivo</h3>
                <div className="flex justify-between text-sm"><span>Fondo inicial</span><strong>{currency.format(Number(cashClosingSummary?.opening_amount ?? 0))}</strong></div>
                <div className="flex justify-between text-sm"><span>Depositos</span><strong>{currency.format(Number(cashClosingSummary?.cash_deposits ?? 0))}</strong></div>
                <div className="flex justify-between text-sm"><span>Retiros</span><strong>{currency.format(Number(cashClosingSummary?.cash_withdrawals ?? 0))}</strong></div>
                <div className="flex justify-between border-t border-slate-300 pt-2 text-lg font-bold"><span>Esperado</span><span>{currency.format(closingExpected)}</span></div>
              </div>

              <div className={isDarkTheme ? 'space-y-2 border border-[#4b4b4b] p-4' : 'space-y-2 border border-stone-200 p-4'}>
                <h3 className="font-bold">Formas de pago</h3>
                {(cashClosingSummary?.payments ?? []).map((payment) => (
                  <div key={payment.method} className="flex justify-between text-sm">
                    <span>{paymentLabels[payment.method] ?? payment.method} ({payment.count})</span>
                    <strong>{currency.format(Number(payment.total))}</strong>
                  </div>
                ))}
                {(cashClosingSummary?.payments ?? []).length === 0 && <p className="text-sm text-slate-500">No hay ventas cobradas en este turno.</p>}
                <div className="flex justify-between border-t border-slate-300 pt-2 text-lg font-bold"><span>Total ventas</span><span>{currency.format(Number(cashClosingSummary?.gross_sales ?? 0))}</span></div>
              </div>
            </div>

            <div className="mt-4 border border-[#4b4b4b] p-4">
              <h3 className="mb-3 font-bold">Desglose de billetes y monedas</h3>
              <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                {cashDenominations.map((denomination) => (
                  <label key={denomination} className="grid grid-cols-[1fr_72px] items-center gap-2 text-sm">
                    <span>{currency.format(denomination)}</span>
                    <Input
                      className="h-8 px-2"
                      type="number"
                      min="0"
                      value={cashBreakdown[String(denomination)] ?? ''}
                      onChange={(event) => setCashBreakdown((current) => ({ ...current, [denomination]: event.target.value }))}
                    />
                  </label>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-[#4b4b4b] pt-2 text-sm font-bold">
                <span>Total desglose</span>
                <span>{currency.format(cashBreakdownTotal)}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[180px_180px_1fr]">
              <Input placeholder="Efectivo contado" type="number" value={cashClosingAmount} onChange={(event) => setCashClosingAmount(event.target.value)} />
              <div className={closingDifference === 0 ? 'border border-[#0088cc] p-3 text-sm font-bold text-[#0088cc]' : 'border border-red-500 p-3 text-sm font-bold text-red-500'}>
                Diferencia: {currency.format(closingDifference)}
              </div>
              <Input placeholder={closingDifference === 0 ? 'Observacion opcional' : 'Motivo de faltante o sobrante'} value={cashClosingNotes} onChange={(event) => setCashClosingNotes(event.target.value)} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={cancelCashClosingDialog} disabled={loading}>Cancelar</Button>
              <Button
                variant="danger"
                onClick={() => askConfirmation({
                  title: 'Cerrar caja',
                  message: `Se cerrara la caja con ${currency.format(closingCounted)} contado y diferencia de ${currency.format(closingDifference)}.`,
                  tone: 'danger',
                  confirmLabel: 'Cerrar caja',
                  onConfirm: closeCashSession,
                })}
                disabled={loading || !cashClosingAmount || pendingFiscalCount > 0}
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <WalletCards size={18} />}
                Cerrar caja
              </Button>
            </div>
          </Card>
        </div>
      )}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 print:hidden">
          <Card className={isDarkTheme ? 'w-full max-w-md border-[#4b4b4b] bg-[#2d2d2d] p-5 text-white' : 'w-full max-w-md p-5'}>
            <p className={confirmAction.tone === 'danger' ? 'text-sm font-semibold text-red-400' : 'text-sm font-semibold text-[#0088cc]'}>Confirmacion requerida</p>
            <h2 className="mt-1 text-2xl font-bold">{confirmAction.title}</h2>
            <p className={isDarkTheme ? 'mt-2 text-sm text-stone-300' : 'mt-2 text-sm text-stone-600'}>{confirmAction.message}</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setConfirmAction(null)} disabled={loading}>Cancelar</Button>
              <Button variant={confirmAction.tone === 'danger' ? 'danger' : 'primary'} onClick={runConfirmedAction} disabled={loading}>
                {confirmAction.confirmLabel ?? 'Confirmar'}
              </Button>
            </div>
          </Card>
        </div>
      )}
      {lastReceipt && <PrintableReceipt receipt={lastReceipt} userName={user.name} businessName={businessName} widthMm={receiptWidth} />}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      <button
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#0088cc] text-white shadow-lg transition hover:bg-[#006fa3] print:hidden"
        onClick={() => setFacturitoOpen(!facturitoOpen)}
        title="Facturito - Asistente IA"
      >
        <MessageCircle size={24} />
      </button>
      <FacturitoChat isOpen={facturitoOpen} onClose={() => setFacturitoOpen(false)} />
    </main>
  )
}

export default App
