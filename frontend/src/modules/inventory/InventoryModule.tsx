import { Edit3, Minus, Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { currency } from '../../lib/utils'
import type { ProductForm } from '../../types'
import type { Product } from '../../store/usePosStore'
import { Metric } from '../../components/shared/Metric'

export function InventoryModule({
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
