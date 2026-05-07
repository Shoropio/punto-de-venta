import { Barcode, Plus } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { DataCard } from '../../components/shared/DataCard'
import { SelectBox } from '../../components/shared/SelectBox'
import type { Product } from '../../store/usePosStore'

export function BarcodesModule({ products, productId, barcode, loading, onProduct, onBarcode, onGenerate, onAssign }: {
  products: Product[]
  productId: string
  barcode: string
  loading: boolean
  onProduct: (value: string) => void
  onBarcode: (value: string) => void
  onGenerate: () => void
  onAssign: () => void
}) {
  return (
    <div className="space-y-4">
      <Card className="grid gap-3 p-4 md:grid-cols-[1fr_220px_auto_auto]">
        <SelectBox value={productId} onChange={onProduct}>
          <option value="">Producto</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name} - {product.barcode ?? 'sin codigo'}</option>)}
        </SelectBox>
        <Input placeholder="Codigo de barras" value={barcode} onChange={(event) => onBarcode(event.target.value)} />
        <Button variant="secondary" onClick={onGenerate}><Barcode size={18} /> Generar</Button>
        <Button onClick={onAssign} disabled={loading}><Plus size={18} /> Asignar</Button>
      </Card>
      <DataCard title="Productos con codigo" empty="No hay productos.">
        {products.map((product) => (
          <div key={product.id} className="grid grid-cols-[1fr_160px_160px] gap-3 border-t border-slate-100 px-4 py-3 text-sm">
            <span className="font-semibold">{product.name}</span>
            <span>{product.sku}</span>
            <span className="font-mono text-[#0088cc]">{product.barcode ?? 'Sin codigo'}</span>
          </div>
        ))}
      </DataCard>
    </div>
  )
}
