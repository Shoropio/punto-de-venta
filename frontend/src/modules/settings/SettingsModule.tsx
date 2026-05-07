import { Printer, Settings } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import type { NamedCatalog, SettingRow } from '../../types'
import { CatalogCard } from '../../components/shared/CatalogCard'
import { Empty } from '../../components/shared/Empty'
import { translateSettingKey, translateSettingValue } from '../../lib/pos-utils'

export function SettingsModule({
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
              <span className="font-semibold">{translateSettingKey(setting.key)}</span>
              <span className="truncate text-slate-500">{translateSettingValue(setting.key, setting.value)}</span>
            </div>
          ))}
          {settings.length === 0 && <Empty text="Aún no hay configuraciones guardadas." />}
        </Card>
      </div>
    </div>
  )
}
