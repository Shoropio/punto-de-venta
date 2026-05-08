import type { Product } from '../store/usePosStore'

export type ApiProduct = {
  id: number
  sku: string
  barcode?: string
  category_id?: number | null
  brand_id?: number | null
  supplier_id?: number | null
  name: string
  cost_price: string
  sale_price: string
  tax_rate: string
  stock: string
  min_stock: string
  unit?: string
  category?: { id?: number; name?: string } | null
  brand?: { id?: number; name?: string } | null
  supplier?: { id?: number; name?: string } | null
}

export type ProductIdentifiers = {
  sku: string
  barcode: string
}

export type ProductForm = {
  id?: number
  sku: string
  barcode: string
  category_id: string
  brand_id: string
  supplier_id: string
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
  category_id: '',
  brand_id: '',
  supplier_id: '',
  name: '',
  cost_price: '',
  sale_price: '',
  tax_rate: '',
  stock: '',
  min_stock: '',
  unit: 'piece',
}

export function mapProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    categoryId: product.category?.id ?? product.category_id ?? null,
    brandId: product.brand?.id ?? product.brand_id ?? null,
    supplierId: product.supplier?.id ?? product.supplier_id ?? null,
    category: product.category?.name ?? 'General',
    costPrice: Number(product.cost_price),
    salePrice: Number(product.sale_price),
    taxRate: Number(product.tax_rate),
    stock: Number(product.stock),
    minStock: Number(product.min_stock),
    unit: product.unit ?? 'piece',
  }
}
