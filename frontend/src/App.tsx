import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BadgeDollarSign, Banknote, Barcode, BarChart3, Boxes, CreditCard, Loader2, LogOut, Maximize2, Minimize2, Moon, Printer, ReceiptText, Search, Settings, ShieldCheck, Sun, Tags, Users, WalletCards } from 'lucide-react'
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
import { api } from './lib/api'
import { configureCurrency } from './lib/utils'
import { getToastTone, roundMoney } from './lib/pos-utils'
import { emptyProductForm, mapProduct, type ApiProduct, type ProductForm, type ProductIdentifiers } from './types/product'
import type { Product } from './store/usePosStore'
import { usePosStore } from './store/usePosStore'
import { emptyCustomerForm, emptyHaciendaSetting, type AppTheme, type AuthResponse, type CashMovement, type CashSession, type CreditPaymentRow, type Customer, type CustomerForm, type HaciendaSettingRow, type InvoiceRow, type ModuleKey, type NamedCatalog, type NavItem, type Paginated, type PaymentMethodRow, type PromotionRow, type Refund, type SaleListItem, type SaleResponse, type SalesSummary, type SettingRow, type ToastMessage, type TopProduct } from './types'

const HELD_SALE_KEY = 'pos_held_sale'

const nav: NavItem[] = [
  { key: 'sale', label: 'Venta', icon: BadgeDollarSign },
  { key: 'inventory', label: 'Inventario', icon: Boxes },
  { key: 'customers', label: 'Clientes', icon: Users },
  { key: 'reports', label: 'Reportes', icon: BarChart3 },
  { key: 'cash', label: 'Caja', icon: Banknote },
  { key: 'credit', label: 'Credito', icon: WalletCards },
  { key: 'promotions', label: 'Promociones', icon: Tags },
  { key: 'payments', label: 'Formas de pago', icon: CreditCard },
  { key: 'invoices', label: 'Factura', icon: ReceiptText },
  { key: 'barcodes', label: 'Codigos', icon: Barcode },
  { key: 'printer', label: 'Impresora', icon: Printer },
  { key: 'settings', label: 'Configuraci?n', icon: Settings },
]

function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('sale')
  const [query, setQuery] = useState('')
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [user, setUser] = useState<AuthResponse['user'] | null>(null)
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodRow[]>([])
  const [promotions, setPromotions] = useState<PromotionRow[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [creditPayments, setCreditPayments] = useState<CreditPaymentRow[]>([])
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [customerForm, setCustomerForm] = useState<CustomerForm>(emptyCustomerForm)
  const [newCategory, setNewCategory] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newSupplier, setNewSupplier] = useState('')
  const [businessName, setBusinessName] = useState('POS Profesional')
  const [currencyCode, setCurrencyCode] = useState('MXN')
  const [defaultTax, setDefaultTax] = useState('16')
  const [cashMovementType, setCashMovementType] = useState<'deposit' | 'withdrawal'>('deposit')
  const [cashMovementAmount, setCashMovementAmount] = useState('')
  const [cashMovementReason, setCashMovementReason] = useState('')
  const [creditCustomerId, setCreditCustomerId] = useState('')
  const [creditPaymentAmount, setCreditPaymentAmount] = useState('')
  const [paymentMethodCode, setPaymentMethodCode] = useState('')
  const [paymentMethodName, setPaymentMethodName] = useState('')
  const [paymentMethodType, setPaymentMethodType] = useState<PaymentMethodRow['type']>('cash')
  const [promotionName, setPromotionName] = useState('')
  const [promotionCode, setPromotionCode] = useState('')
  const [promotionValue, setPromotionValue] = useState('10')
  const [invoiceSaleId, setInvoiceSaleId] = useState('')
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
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [theme, setTheme] = useState<AppTheme>(() => (localStorage.getItem('pos_theme') === 'light' ? 'light' : 'dark'))
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const searchInputRef = useRef<HTMLInputElement>(null)
  const lastToastMessageRef = useRef(message)
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

  const loadSession = useCallback(async () => {
    const session = await api<CashSession | null>('/cash-sessions/current')
    setCashSession(Boolean(session), session?.id ?? null)
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
    const [cashResponse, methodResponse, promotionResponse, invoiceResponse, creditResponse] = await Promise.all([
      api<Paginated<CashMovement>>('/cash-movements?per_page=20'),
      api<PaymentMethodRow[]>('/payment-methods'),
      api<Paginated<PromotionRow>>('/promotions?per_page=20'),
      api<Paginated<InvoiceRow>>('/invoices?per_page=20'),
      api<Paginated<CreditPaymentRow>>('/credit-payments?per_page=20'),
    ])
    setCashMovements(cashResponse.data)
    setPaymentMethods(methodResponse)
    setPromotions(promotionResponse.data)
    setInvoices(invoiceResponse.data)
    setCreditPayments(creditResponse.data)
  }, [])

  const refreshAll = useCallback(async () => {
    const [, session] = await Promise.all([loadProducts(), loadSession()])
    void loadCustomers().catch(() => undefined)
    void loadReports().catch(() => undefined)
    void loadSettings().catch(() => undefined)
    void loadOperations().catch(() => undefined)
    setApiOnline(true)
    setMessage(session ? 'API conectada. Caja abierta y lista para vender.' : 'API conectada. Abre caja para comenzar.')
  }, [loadCustomers, loadOperations, loadProducts, loadReports, loadSession, loadSettings])

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

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('pos_token')
    if (!token) return

    api<AuthResponse['user']>('/user')
      .then((profile) => {
        setUser(profile)
        return refreshAll()
      })
      .catch(() => {
        localStorage.removeItem('pos_token')
        setUser(null)
        setApiOnline(false)
        setMessage('Sesion expirada. Inicia sesion nuevamente.')
      })
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
      setUser(response.user)
      await refreshAll()
    } catch (error) {
      setUser(null)
      setApiOnline(false)
      setMessage(error instanceof Error ? error.message : 'No fue posible iniciar sesion.')
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
    setUser(null)
    setApiOnline(false)
    setCashSession(false)
    clearCart()
    setMessage('Sesion cerrada.')
  }

  const openCashSession = async () => {
    setLoading(true)
    try {
      const session = await api<CashSession>('/cash-sessions/open', {
        method: 'POST',
        body: JSON.stringify({ cash_register_id: 1, opening_amount: 1000, notes: 'Apertura desde POS web' }),
      })
      setCashSession(true, session.id)
      setMessage('Caja abierta correctamente.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible abrir caja.')
    } finally {
      setLoading(false)
    }
  }

  const closeCashSession = async () => {
    if (!cashSessionId) return
    setLoading(true)
    try {
      const expected = await api<CashSession | null>('/cash-sessions/current')
      await api(`/cash-sessions/${cashSessionId}/close`, {
        method: 'POST',
        body: JSON.stringify({
          closing_amount: Number(expected?.expected_amount ?? 0),
          notes: 'Cierre desde POS web',
        }),
      })
      setCashSession(false)
      setMessage('Caja cerrada correctamente.')
      await loadReports()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible cerrar caja.')
    } finally {
      setLoading(false)
    }
  }

  const chargeSale = async () => {
    if (!apiOnline || !cashSessionId) {
      setMessage('Falta API o caja abierta para cobrar.')
      return
    }

    setLoading(true)
    try {
      const method = paymentMethod === 'mixed' ? 'cash' : paymentMethod
      const paymentAmount = Math.ceil(total * 100) / 100
      const sale = await api<SaleResponse>('/sales', {
        method: 'POST',
        body: JSON.stringify({
          cash_session_id: cashSessionId,
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
      clearCart()
      await Promise.all([loadProducts(), loadSession(), loadReports()])
      setMessage(`Venta ${sale.data.folio} cobrada correctamente.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible cobrar la venta.')
    } finally {
      setLoading(false)
    }
  }

  const saveProduct = async () => {
    if (!productForm.name.trim()) {
      setMessage('El nombre del producto es obligatorio.')
      return
    }

    setLoading(true)
    try {
      const body = JSON.stringify({
        ...productForm,
        barcode: productForm.barcode || null,
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
    setLoading(true)
    try {
      await api(`/customers/${customer.id}`, { method: 'DELETE' })
      if (customerForm.id === customer.id) setCustomerForm(emptyCustomerForm)
      await loadCustomers()
      setMessage(`${customer.name} eliminado.`)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible eliminar el cliente.')
    } finally {
      setLoading(false)
    }
  }

  const refundSale = async (sale: SaleListItem) => {
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
        body: JSON.stringify({ sale_id: Number(invoiceSaleId), tax_id: invoiceTaxId, legal_name: invoiceLegalName, email: invoiceEmail || null }),
      })
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

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }

    await document.documentElement.requestFullscreen()
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
    updateQuantity(lastItem.id, lastItem.quantity + 1)
    setMessage(`Cantidad actualizada para ${lastItem.name}.`)
  }

  const applyQuickDiscount = () => {
    if (cart.length === 0) {
      setMessage('Agrega productos antes de aplicar descuento.')
      return
    }
    applyDiscountPercent(10)
    setMessage('Descuento rapido de 10% aplicado a la venta.')
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
    setActiveModule('customers')
    setMessage('Selecciona o registra un cliente para la venta.')
  }

  const openRefundsFromPos = () => {
    setActiveModule('reports')
    setMessage('Selecciona una venta completada para devolverla.')
  }

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
  const lowStockProducts = productsSource.filter((product) => product.stock <= product.minStock)
  const inventoryValue = productsSource.reduce((sum, product) => sum + product.salePrice * product.stock, 0)
  const estimatedProfit = productsSource.reduce((sum, product) => sum + (product.salePrice - product.costPrice) * product.stock, 0)
  const isDarkTheme = theme === 'dark'

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
          </div>
          <p className={isDarkTheme ? 'mt-4 bg-[#242424] p-3 text-sm text-stone-300' : 'mt-4 bg-stone-50 p-3 text-sm text-stone-600'}>{message}</p>
        </Card>
        <ToastViewport toasts={toasts} onDismiss={dismissToast} />
      </main>
    )
  }

  return (
    <main className={isDarkTheme ? 'min-h-screen bg-[#202020] text-white' : 'min-h-screen bg-stone-100 text-stone-950'}>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[88px_1fr]">
        <aside className="flex border-b border-[#343434] bg-[#202020] lg:flex-col lg:border-b-0 lg:border-r print:hidden">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center">
            <div className={isDarkTheme ? 'flex h-11 w-11 items-center justify-center rounded-none bg-[#2d2d2d] text-white' : 'flex h-11 w-11 items-center justify-center rounded-none bg-[#202020] text-white'}>
              <ReceiptText size={24} />
            </div>
          </div>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto px-2 lg:flex-col lg:py-4">
            {nav.map((item) => (
              <button
                key={item.key}
                aria-label={`Ir a ${item.label}`}
                className={`flex h-14 min-w-14 items-center justify-center rounded-none transition ${activeModule === item.key ? 'bg-[#0088cc] text-white' : isDarkTheme ? 'text-stone-400 hover:bg-[#242424] hover:text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-900'}`}
                data-testid={`nav-${item.key}`}
                title={item.label}
                onClick={() => setActiveModule(item.key)}
              >
                <item.icon size={22} />
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col print:hidden">
          <header className="flex flex-col gap-4 border-b border-[#343434] bg-[#202020] px-5 py-4 text-white xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className={isDarkTheme ? 'text-sm font-medium text-[#38bdf8]' : 'text-sm font-medium text-stone-600'}>{user.branch?.name ?? 'Sucursal Principal'} - {apiOnline ? 'API conectada' : 'Sin conexion API'}</p>
              <h1 className="text-2xl font-bold">{nav.find((item) => item.key === activeModule)?.label ?? 'Punto de venta'}</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] xl:w-[860px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
                <Input ref={searchInputRef} className="pl-10" placeholder="Buscar por nombre, SKU o codigo de barras" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              <Button variant="secondary" onClick={toggleTheme} title="Cambiar tema" aria-label="Cambiar tema">
                {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <Button variant="secondary" onClick={toggleFullscreen} title="Pantalla completa" aria-label="Pantalla completa">
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </Button>
              <Button variant={cashSessionOpen ? 'secondary' : 'primary'} onClick={cashSessionOpen ? closeCashSession : openCashSession} disabled={loading}>
                <WalletCards size={18} />
                {cashSessionOpen ? 'Cerrar caja' : 'Abrir caja'}
              </Button>
              <Button variant="ghost" onClick={logout}>
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
              cashSessionOpen={cashSessionOpen}
              paymentMethod={paymentMethod}
              onAdd={addItem}
              onRefresh={loadProducts}
              onFocusSearch={focusSearch}
              onClear={clearCart}
              onCharge={chargeSale}
              onRemove={removeItem}
              onRemoveLast={removeLastCartItem}
              onSetPayment={setPaymentMethod}
              onUpdateQuantity={updateQuantity}
              onIncrementLast={incrementLastCartItem}
              onApplyDiscount={applyQuickDiscount}
              onToggleCashSession={cashSessionOpen ? closeCashSession : openCashSession}
              onSaveSale={saveCurrentSale}
              onRestoreSale={restoreSavedSale}
              onOpenCustomers={openCustomersFromPos}
              onOpenRefunds={openRefundsFromPos}
              onLock={logout}
              onMessage={setPosMessage}
            />
          ) : (
            <div className="space-y-5 p-5">
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
                {activeModule === 'inventory' && (
                  <InventoryModule
                    products={products}
                    form={productForm}
                    loading={loading}
                    inventoryValue={inventoryValue}
                    estimatedProfit={estimatedProfit}
                    lowStockCount={lowStockProducts.length}
                    onFormChange={setProductForm}
                    onSave={saveProduct}
                    onCancel={() => setProductForm(emptyProductForm)}
                    onEdit={editProduct}
                    onDelete={deleteProduct}
                    onRegenerate={regenerateProductIdentifiers}
                    onAdjust={adjustStock}
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
                  />
                )}

                {activeModule === 'cash' && (
                  <CashModule
                    movements={cashMovements}
                    type={cashMovementType}
                    amount={cashMovementAmount}
                    reason={cashMovementReason}
                    loading={loading}
                    cashSessionOpen={cashSessionOpen}
                    onType={setCashMovementType}
                    onAmount={setCashMovementAmount}
                    onReason={setCashMovementReason}
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
                  />
                )}

                {activeModule === 'invoices' && (
                  <InvoicesModule
                    sales={sales}
                    invoices={invoices}
                    saleId={invoiceSaleId}
                    taxId={invoiceTaxId}
                    legalName={invoiceLegalName}
                    email={invoiceEmail}
                    loading={loading}
                    onSale={setInvoiceSaleId}
                    onTaxId={setInvoiceTaxId}
                    onLegalName={setInvoiceLegalName}
                    onEmail={setInvoiceEmail}
                    onCreate={createInvoice}
                    onGenerateXml={(invoiceId) => runInvoiceAction(invoiceId, 'xml')}
                    onSign={(invoiceId) => runInvoiceAction(invoiceId, 'sign')}
                    onSubmit={(invoiceId) => runInvoiceAction(invoiceId, 'submit')}
                    onCheckStatus={(invoiceId) => runInvoiceAction(invoiceId, 'status')}
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

                {activeModule === 'settings' && (
                  <SettingsModule
                    businessName={businessName}
                    currencyCode={currencyCode}
                    defaultTax={defaultTax}
                    categories={categories}
                    brands={brands}
                    suppliers={suppliers}
                    branches={branches}
                    settings={settings}
                    loading={loading}
                    newCategory={newCategory}
                    newBrand={newBrand}
                    newSupplier={newSupplier}
                    hasReceipt={Boolean(lastReceipt)}
                    haciendaSetting={haciendaSetting}
                    onBusinessName={setBusinessName}
                    onCurrencyCode={setCurrencyCode}
                    onDefaultTax={setDefaultTax}
                    onNewCategory={setNewCategory}
                    onNewBrand={setNewBrand}
                    onNewSupplier={setNewSupplier}
                    onCreateCatalog={createCatalogItem}
                    onSave={saveSettings}
                    onHaciendaChange={setHaciendaSetting}
                    onSaveHacienda={saveHaciendaSetting}
                    onPrint={printReceipt}
                  />
                )}
              </section>
            </div>
          )}
        </section>
      </div>

      {lastReceipt && <PrintableReceipt receipt={lastReceipt} userName={user.name} />}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </main>
  )
}

export default App
