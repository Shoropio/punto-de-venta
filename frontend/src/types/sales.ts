export type PaymentMethod = 'cash' | 'card' | 'mixed' | 'transfer' | 'credit'

export type SalesSummary = {
  sales_count: number
  gross_sales: string
  payments: Array<{ method: string; total: string }>
}

export type TopProduct = {
  product_id: number
  product_name: string
  quantity: string
  total: string
}

export type SaleListItem = {
  id: number
  folio: string
  total: string
  status: string
  sold_at: string
  items?: Array<{ product_name: string; quantity: string }>
  payments?: Array<{ method: string; amount: string }>
}

export type Refund = {
  id: number
  amount: string
  reason: string
  status: string
  sale?: { folio?: string } | null
}

export type SaleResponse = {
  data: {
    id: number
    folio: string
    subtotal: string
    tax_total: string
    total: string
    paid_total: string
    change_total: string
    customer?: { name?: string } | null
    items: Array<{ product_name: string; quantity: string; unit_price: string; line_total: string }>
    payments: Array<{ method: string; amount: string }>
  }
}

export type CashMovement = {
  id: number
  type: 'deposit' | 'withdrawal'
  amount: string
  reason: string
  reference?: string | null
  created_at: string
}

export type StockMovementRow = {
  id: number
  type: string
  quantity: string
  stock_before: string
  stock_after: string
  notes?: string | null
  created_at: string
  product?: { id: number; name: string; sku?: string } | null
}
