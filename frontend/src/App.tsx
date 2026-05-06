import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Building2,
  CreditCard,
  Edit3,
  Loader2,
  LogOut,
  Minus,
  PackageSearch,
  Plus,
  Printer,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { Input } from './components/ui/input'
import { api } from './lib/api'
import { currency } from './lib/utils'
import { demoProducts, type Product, usePosStore } from './store/usePosStore'

type ModuleKey = 'sale' | 'inventory' | 'customers' | 'reports' | 'settings'
type PaymentMethod = 'cash' | 'card' | 'mixed'

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
  { key: 'settings', label: 'Configuracion', icon: Settings },
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

function App() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('sale')
  const [query, setQuery] = useState('')
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('password')
  const [user, setUser] = useState<AuthResponse['user'] | null>(null)
  const [productsSource, setProductsSource] = useState<Product[]>(demoProducts)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [lastReceipt, setLastReceipt] = useState<SaleResponse['data'] | null>(null)
  const [apiOnline, setApiOnline] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('Modo demo: inicia sesion para operar con la API.')
  const {
    cart,
    addItem,
    updateQuantity,
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
    const [summary, top] = await Promise.all([
      api<SalesSummary>('/reports/sales-summary'),
      api<TopProduct[]>('/reports/top-products?limit=8'),
    ])
    setSalesSummary(summary)
    setTopProducts(top)
  }, [])

  const refreshAll = useCallback(async () => {
    const [, session] = await Promise.all([loadProducts(), loadSession(), loadCustomers(), loadReports()])
    setMessage(session ? 'API conectada. Caja abierta y lista para vender.' : 'API conectada. Abre caja para comenzar.')
  }, [loadCustomers, loadProducts, loadReports, loadSession])

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
    setMessage('Sesion cerrada. Modo demo activo.')
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
      const sale = await api<SaleResponse>('/sales', {
        method: 'POST',
        body: JSON.stringify({
          cash_session_id: cashSessionId,
          items: cart.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
            discount_amount: item.discount,
          })),
          payments: [{ method, amount: total }],
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

  const printReceipt = () => {
    window.print()
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
  const tax = cart.reduce((sum, item) => sum + ((item.salePrice * item.quantity - item.discount) * item.taxRate) / 100, 0)
  const total = Math.max(0, subtotal - discount + tax)
  const lowStockProducts = productsSource.filter((product) => product.stock <= product.minStock)
  const inventoryValue = productsSource.reduce((sum, product) => sum + product.salePrice * product.stock, 0)
  const estimatedProfit = productsSource.reduce((sum, product) => sum + (product.salePrice - product.costPrice) * product.stock, 0)

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 p-5 text-slate-950">
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
          <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">{message}</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[88px_1fr_420px]">
        <aside className="flex border-b border-slate-200 bg-white lg:flex-col lg:border-b-0 lg:border-r print:hidden">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-700 text-white">
              <ReceiptText size={24} />
            </div>
          </div>
          <nav className="flex flex-1 items-center gap-1 overflow-x-auto px-2 lg:flex-col lg:py-4">
            {nav.map((item) => (
              <button
                key={item.key}
                className={`flex h-14 min-w-14 items-center justify-center rounded-md transition ${activeModule === item.key ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                title={item.label}
                onClick={() => setActiveModule(item.key)}
              >
                <item.icon size={22} />
              </button>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col print:hidden">
          <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-700">{user.branch?.name ?? 'Sucursal Principal'} - {apiOnline ? 'API conectada' : 'Modo demo'}</p>
              <h1 className="text-2xl font-bold">{nav.find((item) => item.key === activeModule)?.label ?? 'Punto de venta'}</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] xl:w-[760px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
                <Input className="pl-10" placeholder="Buscar por nombre, SKU o codigo de barras" value={query} onChange={(event) => setQuery(event.target.value)} />
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

          <div className="grid gap-5 p-5 xl:grid-cols-[1fr_330px]">
            <section className="min-w-0">
              {activeModule === 'sale' && (
                <>
                  <SectionTitle title="Catalogo rapido" subtitle="Productos disponibles para venta inmediata" action={<Button variant="ghost" onClick={loadProducts}><PackageSearch size={18} /></Button>} />
                  <ProductGrid products={products} onAdd={addItem} />
                </>
              )}

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

              {activeModule === 'reports' && <ReportsModule summary={salesSummary} topProducts={topProducts} />}

              {activeModule === 'settings' && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="p-4">
                    <h2 className="text-lg font-bold">Negocio</h2>
                    <p className="mt-2 text-sm text-slate-500">Moneda MXN, IVA configurable por producto y caja principal activa.</p>
                  </Card>
                  <Card className="p-4">
                    <h2 className="text-lg font-bold">Impresion</h2>
                    <p className="mt-2 text-sm text-slate-500">El recibo web ya imprime. El siguiente paso tecnico es ESC/POS por agente local.</p>
                    <Button className="mt-4" variant="secondary" onClick={printReceipt} disabled={!lastReceipt}>
                      <Printer size={18} />
                      Imprimir ultimo recibo
                    </Button>
                  </Card>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <Card className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Operacion</h2>
                    <p className="text-sm text-slate-500">Caja 01 - {cashSessionOpen ? `Sesion ${cashSessionId}` : 'sin turno'}</p>
                  </div>
                  <ShieldCheck className={cashSessionOpen ? 'text-emerald-600' : 'text-slate-400'} size={24} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatusTile label="Usuario" value={user.name} />
                  <StatusTile label="Estado" value={apiOnline ? 'Online' : 'Demo'} />
                </div>
              </Card>

              <Card className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Alertas</h2>
                  <Building2 className="text-cyan-700" size={22} />
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-md bg-red-50 p-3 text-red-800">
                    <span>Stock bajo</span>
                    <strong>{lowStockProducts.length}</strong>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3 text-slate-700">{message}</div>
                  {lastReceipt && (
                    <Button className="w-full" variant="secondary" onClick={printReceipt}>
                      <Printer size={18} />
                      Imprimir recibo
                    </Button>
                  )}
                </div>
              </Card>
            </aside>
          </div>
        </section>

        <CartPanel
          cart={cart}
          subtotal={subtotal}
          discount={discount}
          tax={tax}
          total={total}
          loading={loading}
          cashSessionOpen={cashSessionOpen}
          paymentMethod={paymentMethod}
          onClear={clearCart}
          onCharge={chargeSale}
          onRemove={removeItem}
          onSetPayment={setPaymentMethod}
          onUpdateQuantity={updateQuantity}
        />
      </div>

      {lastReceipt && <PrintableReceipt receipt={lastReceipt} userName={user.name} />}
    </main>
  )
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      {action}
    </div>
  )
}

function ProductGrid({ products, onAdd }: { products: Product[]; onAdd: (product: Product) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
      {products.map((product) => (
        <Card key={product.id} className="p-4">
          <div className="flex min-h-32 flex-col justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{product.category}</span>
                <span className={product.stock <= product.minStock ? 'text-xs font-bold text-red-600' : 'text-xs font-semibold text-slate-500'}>{product.stock} disp.</span>
              </div>
              <h3 className="text-base font-bold">{product.name}</h3>
              <p className="text-xs text-slate-500">{product.sku} - {product.barcode ?? 'sin codigo'}</p>
            </div>
            <div className="flex items-center justify-between">
              <strong className="text-lg">{currency.format(product.salePrice)}</strong>
              <Button onClick={() => onAdd(product)}>
                <Plus size={18} />
                Agregar
              </Button>
            </div>
          </div>
        </Card>
      ))}
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
        <Input placeholder="Telefono" value={phone} onChange={(event) => onPhone(event.target.value)} />
        <Button onClick={onCreate} disabled={loading}>
          <Plus size={18} />
          Crear
        </Button>
      </Card>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_140px_100px_80px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Cliente</span>
          <span>Telefono</span>
          <span>Saldo</span>
          <span>Puntos</span>
        </div>
        {customers.map((customer) => (
          <div key={customer.id} className="grid grid-cols-[1fr_140px_100px_80px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{customer.name}</span>
            <span className="text-slate-500">{customer.phone ?? 'Sin telefono'}</span>
            <span>{currency.format(Number(customer.balance ?? 0))}</span>
            <span>{customer.loyalty_points ?? 0}</span>
          </div>
        ))}
        {customers.length === 0 && <Empty text="Aun no hay clientes registrados." />}
      </Card>
    </div>
  )
}

function ReportsModule({ summary, topProducts }: { summary: SalesSummary | null; topProducts: TopProduct[] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Ventas hoy" value={(summary?.sales_count ?? 0).toString()} />
        <Metric label="Ingresos" value={currency.format(Number(summary?.gross_sales ?? 0))} />
        <Metric label="Productos top" value={topProducts.length.toString()} />
      </div>
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
        {topProducts.length === 0 && <Empty text="Aun no hay ventas para reportar." />}
      </Card>
    </div>
  )
}

function CartPanel({
  cart,
  subtotal,
  discount,
  tax,
  total,
  loading,
  cashSessionOpen,
  paymentMethod,
  onClear,
  onCharge,
  onRemove,
  onSetPayment,
  onUpdateQuantity,
}: {
  cart: ReturnType<typeof usePosStore.getState>['cart']
  subtotal: number
  discount: number
  tax: number
  total: number
  loading: boolean
  cashSessionOpen: boolean
  paymentMethod: PaymentMethod
  onClear: () => void
  onCharge: () => void
  onRemove: (productId: number) => void
  onSetPayment: (method: PaymentMethod) => void
  onUpdateQuantity: (productId: number, quantity: number) => void
}) {
  return (
    <aside className="flex min-h-[520px] flex-col border-l border-slate-200 bg-white print:hidden">
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-cyan-700">Venta actual</p>
            <h2 className="text-xl font-bold">Ticket nuevo</h2>
          </div>
          <Button variant="ghost" onClick={onClear}>
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-56 items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-sm text-slate-500">
            Escanea o agrega productos para iniciar la venta.
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-3 flex justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-xs text-slate-500">{currency.format(item.salePrice)} c/u</p>
                </div>
                <strong>{currency.format(item.salePrice * item.quantity - item.discount)}</strong>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center rounded-md border border-slate-200">
                  <button className="flex h-8 w-8 items-center justify-center" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                    <Minus size={14} />
                  </button>
                  <span className="w-9 text-center text-sm font-bold">{item.quantity}</span>
                  <button className="flex h-8 w-8 items-center justify-center" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                    <Plus size={14} />
                  </button>
                </div>
                <Button variant="ghost" onClick={() => onRemove(item.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-200 p-5">
        <div className="mb-4 grid grid-cols-3 gap-2">
          {(['cash', 'card', 'mixed'] as const).map((method) => (
            <button key={method} className={`h-10 rounded-md border text-sm font-semibold ${paymentMethod === method ? 'border-cyan-700 bg-cyan-50 text-cyan-800' : 'border-slate-200 text-slate-600'}`} onClick={() => onSetPayment(method)}>
              {method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : 'Mixto'}
            </button>
          ))}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{currency.format(subtotal)}</span></div>
          <div className="flex justify-between text-slate-500"><span>Descuentos</span><span>{currency.format(discount)}</span></div>
          <div className="flex justify-between text-slate-500"><span>Impuestos</span><span>{currency.format(tax)}</span></div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-bold"><span>Total</span><span>{currency.format(total)}</span></div>
        </div>

        <Button className="mt-5 h-12 w-full" disabled={loading || !cashSessionOpen || cart.length === 0} onClick={onCharge}>
          {loading ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />}
          Cobrar venta
        </Button>
      </div>
    </aside>
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
