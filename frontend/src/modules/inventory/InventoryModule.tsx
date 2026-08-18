import { useRef } from 'react'
import { Edit3, Minus, Plus, RefreshCw, Trash2, Upload, Download } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { API_URL } from '../../lib/api'
import { currency } from '../../lib/utils'
import type { NamedCatalog, ProductForm, StockMovementRow } from '../../types'
import type { Product } from '../../store/usePosStore'
import { Metric } from '../../components/shared/Metric'
import { CatalogCard } from '../../components/shared/CatalogCard'
import { SelectBox } from '../../components/shared/SelectBox'

export function InventoryModule({
  products,
  movements,
  form,
  loading,
  categories,
  brands,
  suppliers,
  newCategory,
  newBrand,
  newSupplier,
  inventoryValue,
  estimatedProfit,
  lowStockCount,
  onFormChange,
  onNewCategory,
  onNewBrand,
  onNewSupplier,
  onCreateCatalog,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onRegenerate,
  onAdjust,
  onImportCsv,
  importResult,
}: {
  products: Product[]
  movements: StockMovementRow[]
  form: ProductForm
  loading: boolean
  categories: NamedCatalog[]
  brands: NamedCatalog[]
  suppliers: NamedCatalog[]
  newCategory: string
  newBrand: string
  newSupplier: string
  inventoryValue: number
  estimatedProfit: number
  lowStockCount: number
  onFormChange: (form: ProductForm) => void
  onNewCategory: (value: string) => void
  onNewBrand: (value: string) => void
  onNewSupplier: (value: string) => void
  onCreateCatalog: (kind: 'category' | 'brand' | 'supplier') => void
  onSave: () => void
  onCancel: () => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onRegenerate: () => void
  onAdjust: (product: Product, type: 'in' | 'out') => void
  onImportCsv: (file: File) => void
  importResult?: { created: number; updated: number; skipped: number; warnings: string[] } | null
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Productos" value={products.length.toString()} />
        <Metric label="Stock bajo" value={lowStockCount.toString()} tone="danger" />
        <Metric label="Valor venta" value={currency.format(inventoryValue)} />
        <Metric label="Margen potencial" value={currency.format(estimatedProfit)} />
      </div>

      <div className="flex items-center gap-2">
        <a href={`${API_URL.replace('/api', '')}/api/products/import/template`} download className="inline-flex items-center gap-1 rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50">
          <Download size={14} /> Plantilla CSV
        </a>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportCsv(f); e.target.value = '' }} />
        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={loading}>
          <Upload size={16} /> Importar CSV
        </Button>
      </div>
      {importResult && (
        <Card className="border-green-200 bg-green-50 p-3 text-sm">
          <strong>Creados:</strong> {importResult.created} &middot; <strong>Actualizados:</strong> {importResult.updated} &middot; <strong>Omitidos:</strong> {importResult.skipped}
          {importResult.warnings.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-xs text-amber-600">{importResult.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          )}
        </Card>
      )}

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-bold">{form.id ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Input className="pr-11" placeholder="SKU automatico" value={form.sku} onChange={(event) => onFormChange({ ...form, sku: event.target.value })} />
            <Button aria-label="Generar SKU y codigo" className="absolute right-1 top-1 h-8 px-2" variant="ghost" onClick={onRegenerate}><RefreshCw size={15} /></Button>
          </div>
          <div className="relative">
            <Input className="pr-11" placeholder="Codigo automatico" value={form.barcode} onChange={(event) => onFormChange({ ...form, barcode: event.target.value })} />
            <Button aria-label="Generar codigo y SKU" className="absolute right-1 top-1 h-8 px-2" variant="ghost" onClick={onRegenerate}><RefreshCw size={15} /></Button>
          </div>
          <Input className="md:col-span-2" placeholder="Nombre" value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} />
          <Input placeholder="Costo" type="number" value={form.cost_price} onChange={(event) => onFormChange({ ...form, cost_price: event.target.value })} />
          <Input placeholder="Precio" type="number" value={form.sale_price} onChange={(event) => onFormChange({ ...form, sale_price: event.target.value })} />
          <Input placeholder="IVA %" type="number" value={form.tax_rate} onChange={(event) => onFormChange({ ...form, tax_rate: event.target.value })} />
          <Input placeholder="Stock inicial" type="number" value={form.stock} onChange={(event) => onFormChange({ ...form, stock: event.target.value })} />
          <Input placeholder="Stock minimo" type="number" value={form.min_stock} onChange={(event) => onFormChange({ ...form, min_stock: event.target.value })} />
          <SelectBox value={form.category_id} onChange={(value) => onFormChange({ ...form, category_id: value })}>
            <option value="">Categoria</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </SelectBox>
          <SelectBox value={form.brand_id} onChange={(value) => onFormChange({ ...form, brand_id: value })}>
            <option value="">Marca</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
          </SelectBox>
          <SelectBox value={form.supplier_id} onChange={(value) => onFormChange({ ...form, supplier_id: value })}>
            <option value="">Proveedor</option>
            {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </SelectBox>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={onSave} disabled={loading}>
            {form.id ? <Edit3 size={18} /> : <Plus size={18} />}
            {form.id ? 'Actualizar' : 'Crear producto'}
          </Button>
          {form.id && <Button variant="secondary" onClick={onCancel}>Cancelar</Button>}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <CatalogCard title="Categorias" value={newCategory} items={categories} placeholder="Nueva categoria" onValue={onNewCategory} onCreate={() => onCreateCatalog('category')} />
        <CatalogCard title="Marcas" value={newBrand} items={brands} placeholder="Nueva marca" onValue={onNewBrand} onCreate={() => onCreateCatalog('brand')} />
        <CatalogCard title="Proveedores" value={newSupplier} items={suppliers} placeholder="Nuevo proveedor" onValue={onNewSupplier} onCreate={() => onCreateCatalog('supplier')} />
      </div>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_80px_100px_160px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Producto</span>
          <span>SKU</span>
          <span>Stock</span>
          <span>Precio</span>
          <span>Acciones</span>
        </div>
        {products.map((product) => (
          <div key={product.id} className="grid grid-cols-[1fr_120px_80px_100px_160px] items-center gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{product.name}</span>
            <span className="text-slate-500">{product.sku}</span>
            <span className={product.stock <= product.minStock ? 'font-bold text-red-600' : 'text-slate-700'}>{product.stock}</span>
            <span>{currency.format(product.salePrice)}</span>
            <span className="flex gap-1">
              <Button aria-label={`Salida ${product.name}`} className="h-8 px-2" variant="ghost" onClick={() => onAdjust(product, 'out')}><Minus size={14} /></Button>
              <Button aria-label={`Entrada ${product.name}`} className="h-8 px-2" variant="ghost" onClick={() => onAdjust(product, 'in')}><Plus size={14} /></Button>
              <Button aria-label={`Editar ${product.name}`} className="h-8 px-2" variant="ghost" onClick={() => onEdit(product)}><Edit3 size={14} /></Button>
              <Button aria-label={`Eliminar ${product.name}`} className="h-8 px-2" variant="ghost" onClick={() => onDelete(product)}><Trash2 size={14} /></Button>
            </span>
          </div>
        ))}
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_90px_90px_90px_160px] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500">
          <span>Kardex reciente</span>
          <span>Tipo</span>
          <span>Cantidad</span>
          <span>Saldo</span>
          <span>Fecha</span>
        </div>
        {movements.map((movement) => (
          <div key={movement.id} className="grid grid-cols-[1fr_90px_90px_90px_160px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span>
              <span className="block font-semibold">{movement.product?.name ?? 'Producto'}</span>
              <span className="block text-xs text-slate-500">{movement.notes ?? 'Sin nota'}</span>
            </span>
            <span>{movement.type}</span>
            <span>{Number(movement.quantity).toFixed(0)}</span>
            <span>{Number(movement.stock_after).toFixed(0)}</span>
            <span className="text-slate-500">{new Date(movement.created_at).toLocaleString()}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}
