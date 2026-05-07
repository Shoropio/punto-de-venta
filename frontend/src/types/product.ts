import type { Product } from '../store/usePosStore'

export type ApiProduct = {
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

export type ProductForm = {
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

export const emptyProductForm: ProductForm = {
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

export function mapProduct(product: ApiProduct): Product {
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
