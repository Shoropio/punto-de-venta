import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  RotateCcw,
  Edit3,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  Minus,
  MoreHorizontal,
  PackageSearch,
  Percent,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Utensils,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Input } from './components/ui/input'
import { api } from './lib/api'
import { currency } from './lib/utils'
import { type Product, usePosStore } from './store/usePosStore'

type ModuleKey = 'sale' | 'inventory' | 'customers' | 'reports' | 'settings'
type PaymentMethod = 'cash' | 'card' | 'mixed'
const HELD_SALE_KEY = 'pos_held_sale'

type ApiProduct = {
  id: number
  sku: string
  barcode?: string
  name: string
  cost_price: string
  sale_price: string
  tax_rate: string
  stock: string
  min_stock: string
  category?: { name?: string } | null
}

type Customer = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  balance?: string
  loyalty_points?: number
}

type SalesSummary = {
  sales_count: number
  gross_sales: string
  payments: Array<{ method: string; total: string }>
}

type TopProduct = {
  product_id: number
  product_name: string
  quantity: string
  total: string
}

type SaleListItem = {
  id: number
  folio: string
  total: string
  status: string
  sold_at: string
  items?: Array<{ product_name: string; quantity: string }>
  payments?: Array<{ method: string; amount: string }>
}

type Refund = {
  id: number
  amount: string
  reason: string
  status: string
  sale?: { folio?: string } | null
}

type NamedCatalog = {
  id: number
  name: string
  code?: string
  phone?: string | null
}

type SettingRow = {
  id: number
  key: string
  group: string
  value: unknown
}

type SaleResponse = {
  data: {
    folio: string
    subtotal: string
    tax_total: string
    total: string
    paid_total: string
    change_total: string
    items: Array<{ product_name: string; quantity: string; unit_price: string; line_total: string }>
    payments: Array<{ method: string; amount: string }>
  }
}

type Paginated<T> = { data: T[] }

type AuthResponse = {
  token: string
  user: {
    name: string
    email: string
    branch?: { name?: string } | null
  }
}

type CashSession = {
  id: number
  expected_amount: string
  opening_amount: string
  status: 'open' | 'closed'
}

type ProductForm = {
  id?: number
  sku: string
  barcode: string
  name: string
  cost_price: string
  sale_price: string
  tax_rate: string
  stock: string
  min_stock: string
  unit: string
}

const emptyProductForm: ProductForm = {
  sku: '',
  barcode: '',
  name: '',
  cost_price: '0',
  sale_price: '0',
  tax_rate: '16',
  stock: '0',
  min_stock: '0',
  unit: 'piece',
}

const nav: Array<{ key: ModuleKey; label: string; icon: typeof BadgeDollarSign }> = [
  { key: 'sale', label: 'Venta', icon: BadgeDollarSign },
  { key: 'inventory', label: 'Inventario', icon: Boxes },
  { key: 'customers', label: 'Clientes', icon: Users },
  { key: 'reports', label: 'Reportes', icon: BarChart3 },
  { key: 'settings', label: 'Configuración', icon: Settings },
]

function mapProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    category: product.category?.name ?? 'General',
    costPrice: Number(product.cost_price),
    salePrice: Number(product.sale_price),
    taxRate: Number(product.tax_rate),
    stock: Number(product.stock),
    minStock: Number(product.min_stock),
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

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
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newSupplier, setNewSupplier] = useState('')
  const [businessName, setBusinessName] = useState('POS Profesional')
  const [currencyCode, setCurrencyCode] = useState('MXN')
  const [defaultTax, setDefaultTax] = useState('16')
  const [lastReceipt, setLastReceipt] = useState<SaleResponse['data'] | null>(null)
  const [apiOnline, setApiOnline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Inicia sesion para operar con la API.')
  const searchInputRef = useRef<HTMLInputElement>(null)
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
    const [settingsResponse, categoriesResponse, brandsResponse, suppliersResponse, branchesResponse] = await Promise.all([
      api<SettingRow[]>('/settings'),
      api<Paginated<NamedCatalog>>('/categories?per_page=100'),
      api<Paginated<NamedCatalog>>('/brands?per_page=100'),
      api<Paginated<NamedCatalog>>('/suppliers?per_page=100'),
      api<Paginated<NamedCatalog>>('/branches?per_page=100'),
    ])
    setSettings(settingsResponse)
    setCategories(categoriesResponse.data)
    setBrands(brandsResponse.data)
    setSuppliers(suppliersResponse.data)
    setBranches(branchesResponse.data)

    const business = settingsResponse.find((setting) => setting.key === 'business_name')?.value
    const currencySetting = settingsResponse.find((setting) => setting.key === 'currency')?.value
    const taxSetting = settingsResponse.find((setting) => setting.key === 'default_tax')?.value
    if (typeof business === 'string') setBusinessName(business)
    if (typeof currencySetting === 'string') setCurrencyCode(currencySetting)
    if (typeof taxSetting === 'string' || typeof taxSetting === 'number') setDefaultTax(String(taxSetting))
  }, [])

  const refreshAll = useCallback(async () => {
    const [, session] = await Promise.all([loadProducts(), loadSession()])
    void loadCustomers().catch(() => undefined)
    void loadReports().catch(() => undefined)
    void loadSettings().catch(() => undefined)
    setApiOnline(true)
    setMessage(session ? 'API conectada. Caja abierta y lista para vender.' : 'API conectada. Abre caja para comenzar.')
  }, [loadCustomers, loadProducts, loadReports, loadSession, loadSettings])

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
    if (!productForm.sku.trim() || !productForm.name.trim()) {
      setMessage('SKU y nombre del producto son obligatorios.')
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
      unit: 'piece',
    })
    setMessage(`Editando ${product.name}.`)
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

  const createCustomer = async () => {
    if (!newCustomerName.trim()) {
      setMessage('Captura el nombre del cliente.')
      return
    }

    setLoading(true)
    try {
      await api('/customers', {
        method: 'POST',
        body: JSON.stringify({ name: newCustomerName, phone: newCustomerPhone || null }),
      })
      setNewCustomerName('')
      setNewCustomerPhone('')
      await loadCustomers()
      setMessage('Cliente creado correctamente.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible crear el cliente.')
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
      ])
      await loadSettings()
      setMessage('Configuración guardada correctamente.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar la configuración.')
    } finally {
      setLoading(false)
    }
  }

  const printReceipt = () => {
    window.print()
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

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-700 text-white">
              <ReceiptText size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-cyan-700">POS profesional</p>
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
          <p className="mt-4 bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">{message}</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[88px_1fr]">
        <aside className="flex border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex-col lg:border-b-0 lg:border-r print:hidden">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-700 text-white">
              <ReceiptText size={24} />
            </div>
          </div>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto px-2 lg:flex-col lg:py-4">
            {nav.map((item) => (
              <button
                key={item.key}
                aria-label={`Ir a ${item.label}`}
                className={`flex h-14 min-w-14 items-center justify-center rounded-none transition ${activeModule === item.key ? 'bg-slate-950 text-white dark:bg-cyan-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'}`}
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
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-700">{user.branch?.name ?? 'Sucursal Principal'} - {apiOnline ? 'API conectada' : 'Sin conexion API'}</p>
              <h1 className="text-2xl font-bold">{nav.find((item) => item.key === activeModule)?.label ?? 'Punto de venta'}</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] xl:w-[760px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
                <Input ref={searchInputRef} className="pl-10" placeholder="Buscar por nombre, SKU o codigo de barras" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
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
                    onAdjust={adjustStock}
                  />
                )}

                {activeModule === 'customers' && (
                  <CustomersModule
                    customers={customers}
                    loading={loading}
                    name={newCustomerName}
                    phone={newCustomerPhone}
                    onName={setNewCustomerName}
                    onPhone={setNewCustomerPhone}
                    onCreate={createCustomer}
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
                    onBusinessName={setBusinessName}
                    onCurrencyCode={setCurrencyCode}
                    onDefaultTax={setDefaultTax}
                    onNewCategory={setNewCategory}
                    onNewBrand={setNewBrand}
                    onNewSupplier={setNewSupplier}
                    onCreateCatalog={createCatalogItem}
                    onSave={saveSettings}
                    onPrint={printReceipt}
                  />
                )}
              </section>
            </div>
          )}
        </section>
      </div>

      {lastReceipt && <PrintableReceipt receipt={lastReceipt} userName={user.name} />}
    </main>
  )
}

function PosWorkspace({
  products,
  cart,
  subtotal,
  discount,
  tax,
  total,
  loading,
  statusMessage,
  cashSessionOpen,
  paymentMethod,
  onAdd,
  onRefresh,
  onFocusSearch,
  onClear,
  onCharge,
  onRemove,
  onRemoveLast,
  onSetPayment,
  onUpdateQuantity,
  onIncrementLast,
  onApplyDiscount,
  onToggleCashSession,
  onSaveSale,
  onRestoreSale,
  onOpenCustomers,
  onOpenRefunds,
  onLock,
  onMessage,
}: {
  products: Product[]
  cart: ReturnType<typeof usePosStore.getState>['cart']
  subtotal: number
  discount: number
  tax: number
  total: number
  loading: boolean
  statusMessage: string
  cashSessionOpen: boolean
  paymentMethod: PaymentMethod
  onAdd: (product: Product) => void
  onRefresh: () => void
  onFocusSearch: () => void
  onClear: () => void
  onCharge: () => void
  onRemove: (productId: number) => void
  onRemoveLast: () => void
  onSetPayment: (method: PaymentMethod) => void
  onUpdateQuantity: (productId: number, quantity: number) => void
  onIncrementLast: () => void
  onApplyDiscount: () => void
  onToggleCashSession: () => void
  onSaveSale: () => void
  onRestoreSale: () => void
  onOpenCustomers: () => void
  onOpenRefunds: () => void
  onLock: () => void
  onMessage: (message: string) => void
}) {
  const methodLabels: Record<PaymentMethod, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    mixed: 'Mixto',
  }
  const handleSearch = () => {
    onRefresh()
    onFocusSearch()
  }

  return (
    <div className="grid min-h-[calc(100vh-113px)] bg-white text-slate-950 dark:bg-[#202020] dark:text-white xl:grid-cols-[minmax(0,1fr)_536px]">
      <section className="flex min-w-0 flex-col border-r border-slate-200 dark:border-[#4b4b4b]">
        <div className="grid grid-cols-[minmax(260px,1fr)_110px_120px_130px_56px] border-b border-cyan-700 bg-slate-100 px-3 py-3 text-sm font-bold dark:bg-[#1b1b1b]">
          <span>Nombre del producto</span>
          <span className="text-right">Cantidad</span>
          <span className="text-right">Precio</span>
          <span className="text-right">Total</span>
          <span />
        </div>

        <div className="min-h-[360px] flex-1 overflow-auto">
          {cart.length === 0 ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 text-center text-slate-500 dark:text-slate-400">
              <strong className="text-2xl text-slate-600 dark:text-slate-300">No hay articulos</strong>
              <span className="mt-2 max-w-2xl text-sm">Busca, escanea o selecciona un producto para iniciar la venta.</span>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="grid grid-cols-[minmax(260px,1fr)_110px_120px_130px_56px] items-center border-b border-slate-200 px-3 py-3 text-sm dark:border-[#333]">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.sku}</p>
                </div>
                <div className="flex justify-end">
                  <div className="grid grid-cols-[32px_42px_32px] border border-slate-300 dark:border-[#4b4b4b]">
                    <button className="h-8 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#303030]" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} aria-label={`Restar ${item.name}`}>
                      <Minus className="mx-auto" size={14} />
                    </button>
                    <span className="grid h-8 place-items-center border-x border-slate-300 font-bold dark:border-[#4b4b4b]">{item.quantity}</span>
                    <button className="h-8 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#303030]" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} aria-label={`Sumar ${item.name}`}>
                      <Plus className="mx-auto" size={14} />
                    </button>
                  </div>
                </div>
                <span className="text-right">{currency.format(item.salePrice)}</span>
                <span className="text-right font-bold">{currency.format(item.salePrice * item.quantity - item.discount)}</span>
                <button className="grid h-9 place-items-center text-slate-500 hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-900/40 dark:hover:text-white" onClick={() => onRemove(item.id)} aria-label={`Quitar ${item.name}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 dark:border-[#4b4b4b] dark:bg-[#2a2a2a]">
          <div className="grid gap-2 border-b border-slate-200 p-3 dark:border-[#3b3b3b] md:grid-cols-3">
            {products.slice(0, 6).map((product) => (
              <button key={product.id} className="border border-slate-300 bg-white p-3 text-left hover:border-cyan-600 hover:bg-cyan-50 dark:border-[#4b4b4b] dark:bg-[#242424] dark:hover:bg-[#303030]" onClick={() => onAdd(product)}>
                <span className="block truncate text-sm font-semibold">{product.name}</span>
                <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{product.sku} - {currency.format(product.salePrice)}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-[1fr_210px] gap-4 p-4">
            <div className="space-y-2">
              <div className="text-xs uppercase text-slate-500">Productos encontrados: {products.length}</div>
              <div className="border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-[#454545] dark:bg-[#242424] dark:text-slate-300">{statusMessage}</div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{currency.format(subtotal)}</span></div>
              <div className="flex justify-between"><span>Descuentos</span><span>{currency.format(discount)}</span></div>
              <div className="flex justify-between"><span>Impuestos</span><span>{currency.format(tax)}</span></div>
              <div className="flex justify-between border-t border-slate-300 pt-2 text-2xl font-bold dark:border-[#555]"><span>Total</span><span>{currency.format(total)}</span></div>
            </div>
          </div>
        </div>
      </section>

      <aside className="grid content-start gap-1 bg-slate-200 p-1 dark:bg-[#2d2d2d] print:hidden">
        <div className="grid grid-cols-4 gap-1">
          <PosAction icon={X} label="Eliminar" onClick={onRemoveLast} muted />
          <PosAction icon={Search} label="Buscar" shortcut="F3" onClick={handleSearch} />
          <PosAction icon={Plus} label="Cantidad" shortcut="F4" onClick={onIncrementLast} />
          <PosAction icon={ReceiptText} label="Nueva venta" shortcut="F8" onClick={onClear} />
        </div>

        <div className="grid grid-cols-3 gap-1">
          {(['cash', 'card', 'mixed'] as const).map((method) => (
            <button
              key={method}
              className={`h-16 border text-sm font-semibold ${paymentMethod === method ? 'border-cyan-700 border-b-2 border-b-cyan-600 bg-cyan-50 text-cyan-900 dark:border-[#575757] dark:border-b-cyan-500 dark:bg-[#1f1f1f] dark:text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-[#575757] dark:bg-[#1f1f1f] dark:text-slate-300 dark:hover:bg-[#333]'}`}
              onClick={() => onSetPayment(method)}
            >
              {methodLabels[method]}
            </button>
          ))}
        </div>

        <div className="mt-32 grid grid-cols-4 gap-1">
          <PosAction icon={Banknote} label={cashSessionOpen ? 'Cerrar caja' : 'Abrir caja'} onClick={onToggleCashSession} />
          <PosAction icon={Utensils} label="Mesa" onClick={() => onMessage('Modo mesa preparado para consumo en sitio.')} />
          <div className="hidden xl:block" />
          <div className="hidden xl:block" />
          <PosAction icon={Percent} label="Descuento" shortcut="F2" onClick={onApplyDiscount} />
          <PosAction icon={MessageSquare} label="Comentario" onClick={() => onMessage('Comentario agregado a la orden actual.')} />
          <PosAction icon={UserRound} label="Cliente" onClick={onOpenCustomers} />
          <PosAction icon={Users} label="Asignar" onClick={() => onMessage('Orden asignada al cajero activo.')} />
          <PosAction icon={PackageSearch} label="Guardar" shortcut="F9" onClick={onSaveSale} />
          <PosAction icon={RotateCcw} label="Devolución" onClick={onOpenRefunds} />
          <button className="col-span-2 h-20 border border-emerald-700 bg-emerald-700 text-lg font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50" disabled={loading || !cashSessionOpen || cart.length === 0} onClick={onCharge}>
            <span className="block text-2xl">F10</span>
            {loading ? 'Procesando' : 'Pago'}
          </button>
          <PosAction icon={Lock} label="Bloquear" onClick={onLock} />
          <PosAction icon={CreditCard} label="Transferir" shortcut="F7" onClick={() => onSetPayment('mixed')} />
          <button className="h-20 border border-red-700 bg-red-700 text-sm font-semibold text-white hover:bg-red-600" onClick={onClear}>
            <Trash2 className="mx-auto mb-2" size={24} />
            Anular orden
          </button>
          <PosAction icon={MoreHorizontal} label="Mas" onClick={onRestoreSale} />
        </div>
      </aside>
    </div>
  )
}

function PosAction({
  icon: Icon,
  label,
  shortcut,
  onClick,
  disabled,
  muted,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  shortcut?: string
  onClick?: () => void
  disabled?: boolean
  muted?: boolean
}) {
  return (
    <button className={`relative h-20 border border-slate-300 bg-white text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-[#575757] dark:bg-[#2b2b2b] dark:text-white dark:hover:bg-[#383838] ${muted ? 'text-slate-500 dark:text-slate-400' : ''}`} onClick={onClick} disabled={disabled}>
      {shortcut && <span className="absolute left-2 top-2 text-xs text-slate-500 dark:text-slate-300">{shortcut}</span>}
      <Icon className="mx-auto mb-2" size={28} />
      {label}
    </button>
  )
}

function ModuleStatusBar({
  userName,
  apiOnline,
  cashSessionOpen,
  cashSessionId,
  lowStockCount,
  message,
  hasReceipt,
  onPrint,
}: {
  userName: string
  apiOnline: boolean
  cashSessionOpen: boolean
  cashSessionId: number | null
  lowStockCount: number
  message: string
  hasReceipt: boolean
  onPrint: () => void
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1.4fr_auto]">
      <Card className="flex items-center gap-3 p-4">
        <ShieldCheck className={cashSessionOpen ? 'text-emerald-600' : 'text-slate-400'} size={24} />
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Operación</p>
          <p className="text-sm font-bold">Caja 01 - {cashSessionOpen ? `Sesión ${cashSessionId}` : 'sin turno'}</p>
        </div>
      </Card>
      <Card className="grid grid-cols-2 gap-3 p-3 text-sm">
        <StatusTile label="Usuario" value={userName} />
        <StatusTile label="Estado" value={apiOnline ? 'En línea' : 'Sin conexión'} />
      </Card>
      <Card className="flex items-center gap-3 p-4">
        <Building2 className="text-cyan-700" size={22} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-slate-500">Estado del módulo</p>
          <p className="truncate text-sm text-slate-700">{message}</p>
        </div>
      </Card>
      <Card className="flex items-center gap-3 p-3">
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          <span className="font-semibold">{lowStockCount}</span> stock bajo
        </div>
        {hasReceipt && (
          <Button variant="secondary" onClick={onPrint}>
            <Printer size={18} />
            Recibo
          </Button>
        )}
      </Card>
    </div>
  )
}

function InventoryModule({
  products,
  form,
  loading,
  inventoryValue,
  estimatedProfit,
  lowStockCount,
  onFormChange,
  onSave,
  onCancel,
  onEdit,
  onAdjust,
}: {
  products: Product[]
  form: ProductForm
  loading: boolean
  inventoryValue: number
  estimatedProfit: number
  lowStockCount: number
  onFormChange: (form: ProductForm) => void
  onSave: () => void
  onCancel: () => void
  onEdit: (product: Product) => void
  onAdjust: (product: Product, type: 'in' | 'out') => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Productos" value={products.length.toString()} />
        <Metric label="Stock bajo" value={lowStockCount.toString()} tone="danger" />
        <Metric label="Valor venta" value={currency.format(inventoryValue)} />
        <Metric label="Margen potencial" value={currency.format(estimatedProfit)} />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-bold">{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <Input placeholder="SKU" value={form.sku} onChange={(event) => onFormChange({ ...form, sku: event.target.value })} />
          <Input placeholder="Codigo de barras" value={form.barcode} onChange={(event) => onFormChange({ ...form, barcode: event.target.value })} />
          <Input className="md:col-span-2" placeholder="Nombre" value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} />
          <Input placeholder="Costo" type="number" value={form.cost_price} onChange={(event) => onFormChange({ ...form, cost_price: event.target.value })} />
          <Input placeholder="Precio" type="number" value={form.sale_price} onChange={(event) => onFormChange({ ...form, sale_price: event.target.value })} />
          <Input placeholder="IVA %" type="number" value={form.tax_rate} onChange={(event) => onFormChange({ ...form, tax_rate: event.target.value })} />
          <Input placeholder="Stock inicial" type="number" value={form.stock} onChange={(event) => onFormChange({ ...form, stock: event.target.value })} />
          <Input placeholder="Stock minimo" type="number" value={form.min_stock} onChange={(event) => onFormChange({ ...form, min_stock: event.target.value })} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={onSave} disabled={loading}>
            {form.id ? <Edit3 size={18} /> : <Plus size={18} />}
            {form.id ? 'Actualizar' : 'Crear producto'}
          </Button>
          {form.id && <Button variant="secondary" onClick={onCancel}>Cancelar</Button>}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_100px_80px_100px_120px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Producto</span>
          <span>SKU</span>
          <span>Stock</span>
          <span>Precio</span>
          <span>Acciones</span>
        </div>
        {products.map((product) => (
          <div key={product.id} className="grid grid-cols-[1fr_100px_80px_100px_120px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{product.name}</span>
            <span className="text-slate-500">{product.sku}</span>
            <span className={product.stock <= product.minStock ? 'font-bold text-red-600' : 'text-slate-700'}>{product.stock}</span>
            <span>{currency.format(product.salePrice)}</span>
            <span className="flex gap-1">
              <Button aria-label={`Salida ${product.name}`} className="h-8 px-2" variant="ghost" onClick={() => onAdjust(product, 'out')}><Minus size={14} /></Button>
              <Button aria-label={`Entrada ${product.name}`} className="h-8 px-2" variant="ghost" onClick={() => onAdjust(product, 'in')}><Plus size={14} /></Button>
              <Button aria-label={`Editar ${product.name}`} className="h-8 px-2" variant="ghost" onClick={() => onEdit(product)}><Edit3 size={14} /></Button>
            </span>
          </div>
        ))}
      </Card>
    </div>
  )
}

function CustomersModule({
  customers,
  loading,
  name,
  phone,
  onName,
  onPhone,
  onCreate,
}: {
  customers: Customer[]
  loading: boolean
  name: string
  phone: string
  onName: (value: string) => void
  onPhone: (value: string) => void
  onCreate: () => void
}) {
  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_180px_auto]">
        <Input placeholder="Nombre del cliente" value={name} onChange={(event) => onName(event.target.value)} />
        <Input placeholder="Teléfono" value={phone} onChange={(event) => onPhone(event.target.value)} />
        <Button onClick={onCreate} disabled={loading}>
          <Plus size={18} />
          Crear
        </Button>
      </Card>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_100px_80px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Cliente</span>
          <span>Teléfono</span>
          <span>Saldo</span>
          <span>Puntos</span>
        </div>
        {customers.map((customer) => (
          <div key={customer.id} className="grid grid-cols-[1fr_140px_100px_80px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{customer.name}</span>
            <span className="text-slate-500">{customer.phone ?? 'Sin teléfono'}</span>
            <span>{currency.format(Number(customer.balance ?? 0))}</span>
            <span>{customer.loyalty_points ?? 0}</span>
          </div>
        ))}
          {customers.length === 0 && <Empty text="Aún no hay clientes registrados." />}
      </Card>
    </div>
  )
}

function ReportsModule({
  summary,
  topProducts,
  sales,
  refunds,
  loading,
  onRefund,
}: {
  summary: SalesSummary | null
  topProducts: TopProduct[]
  sales: SaleListItem[]
  refunds: Refund[]
  loading: boolean
  onRefund: (sale: SaleListItem) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Ventas hoy" value={(summary?.sales_count ?? 0).toString()} />
        <Metric label="Ingresos" value={currency.format(Number(summary?.gross_sales ?? 0))} />
        <Metric label="Productos top" value={topProducts.length.toString()} />
      </div>
      <div className="grid gap-4 2xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_120px_120px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Importe</span>
          </div>
          {topProducts.map((product) => (
            <div key={product.product_id} className="grid grid-cols-[1fr_120px_120px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-semibold">{product.product_name}</span>
              <span>{Number(product.quantity).toFixed(0)}</span>
              <span>{currency.format(Number(product.total))}</span>
            </div>
          ))}
          {topProducts.length === 0 && <Empty text="Aún no hay ventas para reportar." />}
        </Card>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-[1fr_100px_90px_92px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
            <span>Venta</span>
            <span>Total</span>
            <span>Estado</span>
            <span>Acción</span>
          </div>
          {sales.map((sale) => (
            <div key={sale.id} className="grid grid-cols-[1fr_100px_90px_92px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-semibold">{sale.folio}</span>
              <span>{currency.format(Number(sale.total))}</span>
              <span className={sale.status === 'refunded' ? 'text-red-600' : 'text-emerald-700'}>{sale.status}</span>
              <Button className="h-8 px-2" variant="ghost" disabled={loading || sale.status !== 'completed'} onClick={() => onRefund(sale)} aria-label={`Devolver ${sale.folio}`}>
                <RotateCcw size={14} />
              </Button>
            </div>
          ))}
          {sales.length === 0 && <Empty text="Aún no hay ventas registradas." />}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_1fr_100px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Venta</span>
          <span>Importe</span>
          <span>Motivo</span>
          <span>Estado</span>
        </div>
        {refunds.map((refund) => (
          <div key={refund.id} className="grid grid-cols-[1fr_120px_1fr_100px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{refund.sale?.folio ?? 'Sin folio'}</span>
            <span>{currency.format(Number(refund.amount))}</span>
            <span className="text-slate-600">{refund.reason}</span>
            <span>{refund.status}</span>
          </div>
        ))}
        {refunds.length === 0 && <Empty text="Aún no hay devoluciones registradas." />}
      </Card>
    </div>
  )
}

function SettingsModule({
  businessName,
  currencyCode,
  defaultTax,
  categories,
  brands,
  suppliers,
  branches,
  settings,
  loading,
  newCategory,
  newBrand,
  newSupplier,
  hasReceipt,
  onBusinessName,
  onCurrencyCode,
  onDefaultTax,
  onNewCategory,
  onNewBrand,
  onNewSupplier,
  onCreateCatalog,
  onSave,
  onPrint,
}: {
  businessName: string
  currencyCode: string
  defaultTax: string
  categories: NamedCatalog[]
  brands: NamedCatalog[]
  suppliers: NamedCatalog[]
  branches: NamedCatalog[]
  settings: SettingRow[]
  loading: boolean
  newCategory: string
  newBrand: string
  newSupplier: string
  hasReceipt: boolean
  onBusinessName: (value: string) => void
  onCurrencyCode: (value: string) => void
  onDefaultTax: (value: string) => void
  onNewCategory: (value: string) => void
  onNewBrand: (value: string) => void
  onNewSupplier: (value: string) => void
  onCreateCatalog: (kind: 'category' | 'brand' | 'supplier') => void
  onSave: () => void
  onPrint: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-lg font-bold">Negocio</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <Input className="md:col-span-3" placeholder="Nombre comercial" value={businessName} onChange={(event) => onBusinessName(event.target.value)} />
            <Input placeholder="Moneda" value={currencyCode} onChange={(event) => onCurrencyCode(event.target.value)} />
            <Input placeholder="IVA predeterminado" type="number" value={defaultTax} onChange={(event) => onDefaultTax(event.target.value)} />
            <Button onClick={onSave} disabled={loading}>
              <Settings size={18} />
              Guardar
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-3 text-lg font-bold">Impresión</h2>
          <p className="text-sm text-slate-500">Recibo web listo para la impresora del navegador. ESC/POS queda preparado para servicio local.</p>
          <Button className="mt-4" variant="secondary" onClick={onPrint} disabled={!hasReceipt}>
            <Printer size={18} />
            Imprimir último recibo
          </Button>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <CatalogCard title="Categorías" value={newCategory} items={categories} placeholder="Nueva categoría" onValue={onNewCategory} onCreate={() => onCreateCatalog('category')} />
        <CatalogCard title="Marcas" value={newBrand} items={brands} placeholder="Nueva marca" onValue={onNewBrand} onCreate={() => onCreateCatalog('brand')} />
        <CatalogCard title="Proveedores" value={newSupplier} items={suppliers} placeholder="Nuevo proveedor" onValue={onNewSupplier} onCreate={() => onCreateCatalog('supplier')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Sucursales</div>
          {branches.map((branch) => (
            <div key={branch.id} className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-semibold">{branch.name}</span>
              <span className="text-slate-500">{branch.code}</span>
            </div>
          ))}
        </Card>
        <Card className="overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">Configuraciones guardadas</div>
          {settings.map((setting) => (
            <div key={setting.id} className="grid grid-cols-[120px_1fr] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
              <span className="font-semibold">{setting.key}</span>
              <span className="truncate text-slate-500">{typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value ?? '')}</span>
            </div>
          ))}
          {settings.length === 0 && <Empty text="Aún no hay configuraciones guardadas." />}
        </Card>
      </div>
    </div>
  )
}

function CatalogCard({
  title,
  value,
  items,
  placeholder,
  onValue,
  onCreate,
}: {
  title: string
  value: string
  items: NamedCatalog[]
  placeholder: string
  onValue: (value: string) => void
  onCreate: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-slate-100 p-4">
        <h2 className="mb-3 text-lg font-bold">{title}</h2>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Input placeholder={placeholder} value={value} onChange={(event) => onValue(event.target.value)} />
          <Button onClick={onCreate}><Plus size={18} /></Button>
        </div>
      </div>
      <div className="max-h-56 overflow-auto">
        {items.map((item) => (
          <div key={item.id} className="border-t border-slate-100 px-4 py-2 text-sm font-medium">{item.name}</div>
        ))}
        {items.length === 0 && <Empty text="Sin elementos." />}
      </div>
    </Card>
  )
}

function PrintableReceipt({ receipt, userName }: { receipt: SaleResponse['data']; userName: string }) {
  return (
    <section className="hidden print:block print:p-4">
      <div className="mx-auto w-[280px] font-mono text-sm text-black">
        <h1 className="text-center text-lg font-bold">POS Profesional</h1>
        <p className="text-center">Sucursal Principal</p>
        <p>Folio: {receipt.folio}</p>
        <p>Cajero: {userName}</p>
        <hr className="my-2 border-black" />
        {receipt.items.map((item, index) => (
          <div key={`${item.product_name}-${index}`} className="mb-1">
            <div>{item.product_name}</div>
            <div className="flex justify-between">
              <span>{Number(item.quantity).toFixed(0)} x {currency.format(Number(item.unit_price))}</span>
              <span>{currency.format(Number(item.line_total))}</span>
            </div>
          </div>
        ))}
        <hr className="my-2 border-black" />
        <div className="flex justify-between"><span>Subtotal</span><span>{currency.format(Number(receipt.subtotal))}</span></div>
        <div className="flex justify-between"><span>IVA</span><span>{currency.format(Number(receipt.tax_total))}</span></div>
        <div className="flex justify-between font-bold"><span>Total</span><span>{currency.format(Number(receipt.total))}</span></div>
        <div className="flex justify-between"><span>Pagado</span><span>{currency.format(Number(receipt.paid_total))}</span></div>
        <div className="flex justify-between"><span>Cambio</span><span>{currency.format(Number(receipt.change_total))}</span></div>
        <p className="mt-4 text-center">Gracias por su compra</p>
      </div>
    </section>
  )
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'danger' }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <strong className={tone === 'danger' ? 'text-2xl text-red-600' : 'text-2xl text-slate-950'}>{value}</strong>
    </Card>
  )
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-3">
      <p className="text-slate-500">{label}</p>
      <strong>{value}</strong>
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return <div className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-500">{text}</div>
}

export default App
